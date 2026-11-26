#!/usr/bin/env python3
"""Project lifecycle: init, validate (beats.json), status.

  python3 project.py init "<one line idea>" [--slug my-slug]
  python3 project.py validate <slug>
  python3 project.py status <slug>
"""
from __future__ import annotations

import argparse
import datetime as dt
import json
import re

from common import (CAMERA_MOVES, CLIP_EXTS, IMG_EXTS, LANGS, ROLES, die, end_card_sec, find_file, iter_shots,
                    load_beats, load_config, narration_text, project_dir, projects_dir, slugify)

SUBDIRS = ["keyframes", "clips", "audio/en", "audio/ta", "sfx", "final", "qa"]


def cmd_init(a):
    slug = a.slug or slugify(a.idea)
    p = projects_dir() / slug
    if p.exists():
        die(f"project already exists: {p}")
    for d in SUBDIRS:
        (p / d).mkdir(parents=True, exist_ok=True)
    (p / "brief.md").write_text(
        f"# Brief\n\n- **One-line idea:** {a.idea}\n- **Created:** {dt.date.today().isoformat()}\n"
        f"- **Outputs:** English + Tamil 9:16 Shorts, 40-55s each\n")
    print(json.dumps({"slug": slug, "dir": str(p)}))


# Narrative-style checks (script-playbook §2b). Markers are loose on purpose: they catch a beat with no "why" at all.
CAUSAL = {"en": r"\b(because|so|which means|that means|that's why|this is why|here's how|thanks to|until|which|means|why)\b",
          "ta": r"(ஏன்னா|ஏன்|அதனால|அதான்|அப்படின்னா|அதாவது|னால|அப்போ|ஆகவே|அதுக்கு)"}
ANALOGY = {"en": r"\b(like|imagine|think of|just as|the same way|as if)\b", "ta": r"(மாதிரி|போல|போன்ற|நினைச்சு பாருங்க)"}
STOP = set("the a an and but so it its is are of to in on at for that this with by be was it's you your".split())


def check_narrative(beats: dict, errs: list, warns: list) -> None:
    ex = beats.get("explainer")
    if not isinstance(ex, dict):
        errs.append("explainer {question, answer, chain, analogy, terms} missing - build the explanation spine first (script-playbook §2b)")
        return
    for k in ("question", "answer", "analogy"):
        if not str(ex.get(k, "")).strip():
            errs.append(f"explainer.{k} empty")
    chain = ex.get("chain") or []
    if not 3 <= len(chain) <= 6:
        errs.append(f"explainer.chain has {len(chain)} steps (need 3-5 cause -> effect steps)")
    if not isinstance(ex.get("terms"), list):
        errs.append("explainer.terms must be a list (empty only if the narration uses no technical words)")
    if len(str(ex.get("answer", "")).split()) > 25:
        warns.append("explainer.answer is over 25 words - say the mechanism in one plain sentence")
    en_all = " ".join(b.get("narration", {}).get("en", "") for b in beats["beats"]).lower()
    for t in ex.get("terms") or []:
        term = (t.get("term") or "").strip()
        if not t.get("plain"):
            warns.append(f"explainer.terms '{term}': add its plain meaning")
        if term and term.lower() not in en_all:
            warns.append(f"explainer.terms '{term}' never said in the English narration")
    for lang in LANGS:
        whole = " ".join(b.get("narration", {}).get(lang, "") for b in beats["beats"])
        if not re.search(ANALOGY[lang], whole, re.I):
            warns.append(f"{lang}: no analogy in the narration - say explainer.analogy at the hardest step")
    for b in beats["beats"]:
        nar = b.get("narration", {})
        if b.get("role") in ("mechanism", "escalation", "twist"):
            for lang in LANGS:
                if nar.get(lang) and not re.search(CAUSAL[lang], nar[lang], re.I):
                    warns.append(f"{b['id']}.{lang}: states what happens but not why - add a causal link (§2b What -> Why -> So)")
        for sent in re.split(r"(?<=[.!?])\s+", nar.get("en", "")):
            if len(sent.split()) > 20:
                warns.append(f"{b['id']}.en: sentence over 20 words - split it so it can be spoken: '{sent[:40]}...'")
    if beats["beats"] and beats["beats"][-1].get("role") == "payoff":
        words = lambda x: {w for w in re.findall(r"[a-z']+", x.lower()) if len(w) > 3 and w not in STOP}
        pay = beats["beats"][-1].get("narration", {}).get("en", "")
        if len(words(pay) & words(str(ex.get("answer", "")))) < 2:
            warns.append("payoff does not restate explainer.answer - close the loop with the actual explanation")


def validate(beats: dict, cfg: dict) -> tuple[list[str], list[str], dict]:
    errs, warns = [], []
    for k in ("slug", "title", "style_preset", "assets", "beats"):
        if k not in beats:
            errs.append(f"missing top-level key '{k}'")
    if errs:
        return errs, warns, {}
    if beats["style_preset"] not in cfg["style_presets"]:
        errs.append(f"style_preset '{beats['style_preset']}' not in config.style_presets")
    asset_ids = {x["id"] for x in beats["assets"]}
    for x in beats["assets"]:
        if not x.get("description"):
            errs.append(f"asset {x.get('id')} has no description")
    n_beats = len(beats["beats"])
    if not 5 <= n_beats <= 10:
        warns.append(f"{n_beats} beats (aim 6-9)")
    roles = [b.get("role") for b in beats["beats"]]
    if roles[0] != "hook":
        errs.append("first beat must have role 'hook'")
    if roles[-1] != "payoff":
        errs.append("last beat must have role 'payoff'")
    if "twist" not in roles:
        warns.append("no 'twist' beat - curiosity loop will feel flat")
    check_narrative(beats, errs, warns)
    seen, n_shots, heroes, n_code = set(), 0, 0, 0
    for b in beats["beats"]:
        if b.get("role") not in ROLES:
            errs.append(f"{b['id']}: role must be one of {ROLES}")
        for lang in LANGS:
            if not b.get("narration", {}).get(lang, "").strip():
                errs.append(f"{b['id']}: narration.{lang} empty")
        if not 1 <= len(b.get("shots", [])) <= 3:
            errs.append(f"{b['id']}: needs 1-3 shots")
        for s in b.get("shots", []):
            n_shots += 1
            if s["id"] in seen:
                errs.append(f"duplicate shot id {s['id']}")
            seen.add(s["id"])
            if s.get("camera_move") not in CAMERA_MOVES:
                errs.append(f"{s['id']}: camera_move must be one of {CAMERA_MOVES}")
            if not s.get("scene"):
                errs.append(f"{s['id']}: scene description empty")
            for r in s.get("asset_refs", []):
                if r not in asset_ids:
                    errs.append(f"{s['id']}: unknown asset_ref '{r}'")
            heroes += bool(s.get("hero"))
            src = s.get("source")
            if src not in ("code3d", "nano"):
                errs.append(f"{s['id']}: source must be 'code3d' or 'nano' (decide per references/visual-source-decision.md)")
            elif not s.get("source_reason"):
                warns.append(f"{s['id']}: add a short source_reason")
            n_code += src == "code3d"
            ov = s.get("overlay")
            if ov:
                if ov.get("kind") not in ("number", "icon", "label"):
                    errs.append(f"{s['id']}: overlay.kind must be number|icon|label")
                for lang in LANGS:
                    trig = (ov.get("trigger") or {}).get(lang)
                    if trig and trig.lower() not in b["narration"][lang].lower():
                        warns.append(f"{s['id']}: overlay trigger '{trig}' not found in {b['id']} narration.{lang}")
    vp = beats.get("visual_plan")
    if not vp or vp.get("mode") not in ("code3d", "nano", "hybrid") or not vp.get("reason"):
        errs.append("visual_plan {mode: code3d|nano|hybrid, reason} missing - decide per references/visual-source-decision.md")
    elif n_shots:
        share = n_code / n_shots
        expect = "code3d" if share >= 0.999 else "nano" if n_code == 0 else "hybrid"
        if vp["mode"] != expect and not (vp["mode"] == "code3d" and share >= 0.7):
            warns.append(f"visual_plan.mode is '{vp['mode']}' but {n_code}/{n_shots} shots are code3d")
        if 0 < n_code <= 2:
            warns.append(f"only {n_code} code3d shot(s) - building a 3D rig for so few is rarely worth it")
    if not 12 <= n_shots <= 24:
        warns.append(f"{n_shots} shots (aim 14-20 so each lasts 2-4s)")
    if not 3 <= heroes <= 10:
        warns.append(f"{heroes} hero shots (aim 5-8)")

    stats = {"beats": n_beats, "shots": n_shots, "hero_shots": heroes, "code3d_shots": n_code, "nano_shots": n_shots - n_code}
    for lang in LANGS:
        text, _ = narration_text(beats, lang)
        cps = cfg["voice"][lang]["chars_per_sec"]
        est = len(text) / cps + cfg["video"]["preroll_sec"] + cfg["video"]["tail_sec"] + end_card_sec(cfg)
        stats[lang] = {"chars": len(text), "words": len(text.split()), "est_sec": round(est, 1)}
        lo, hi = cfg["duration"]["min"], cfg["duration"]["max"]
        if not lo <= est <= hi:
            errs.append(f"{lang}: estimated {est:.1f}s outside {lo}-{hi}s - tighten/expand script")
    ew = stats["en"]["words"]
    wmin, wmax = cfg["words"]["en"]["min"], cfg["words"]["en"]["max"]
    if not wmin <= ew <= wmax:
        warns.append(f"en: {ew} words (aim {wmin}-{wmax})")
    stats["total_chars"] = stats["en"]["chars"] + stats["ta"]["chars"]
    return errs, warns, stats


def cmd_validate(a):
    p = project_dir(a.slug)
    cfg = load_config()
    beats = load_beats(p)
    errs, warns, stats = validate(beats, cfg)
    for lang in LANGS:
        if stats:
            text, _ = narration_text(beats, lang)
            ex = beats.get("explainer") or {}
            spine = ""
            if lang == "en" and ex:
                spine = (f"[EXPLAINER] Q: {ex.get('question', '')}\nA: {ex.get('answer', '')}\n"
                         f"Chain: {' -> '.join(ex.get('chain') or [])}\nAnalogy: {ex.get('analogy', '')}\n"
                         + "".join(f"Term: {t.get('term')} = {t.get('plain')}\n" for t in ex.get("terms") or []) + "\n")
            (p / f"script_{lang}.txt").write_text(spine +
                "\n\n".join(f"[{b['id']} · {b['role']}] {b['narration'][lang]}" for b in beats["beats"]) + "\n")
    print(json.dumps({"ok": not errs, "errors": errs, "warnings": warns, "stats": stats}, ensure_ascii=False, indent=2))
    if errs:
        raise SystemExit(2)


def cmd_status(a):
    p = project_dir(a.slug)
    out = {"dir": str(p), "beats.json": (p / "beats.json").exists()}
    if out["beats.json"]:
        beats = load_beats(p)
        shots = [s for _, s in iter_shots(beats)]
        out["keyframes"] = f"{sum(bool(find_file(p / 'keyframes', s['id'], IMG_EXTS)) for s in shots)}/{len(shots)}"
        out["nano_frames_missing"] = [s["id"] for s in shots if s.get("source") != "code3d" and not find_file(p / "keyframes", s["id"], IMG_EXTS)]
        out["code3d_renders_missing"] = [s["id"] for s in shots if s.get("source") == "code3d" and not find_file(p / "clips", s["id"], CLIP_EXTS)]
        heroes = [s["id"] for s in shots if s.get("hero")]
        have = [s["id"] for s in shots if find_file(p / "clips", s["id"], CLIP_EXTS)]
        out["clips_present"] = have
        out["hero_clips_missing"] = [h for h in heroes if h not in have]
    for lang in LANGS:
        out[f"audio_{lang}"] = (p / "audio" / lang / "words.json").exists()
        out[f"timeline_{lang}"] = (p / f"timeline_{lang}.json").exists()
        out[f"final_{lang}"] = (p / "final" / f"{a.slug}_{lang}.mp4").exists()
    print(json.dumps(out, indent=2))


def main():
    ap = argparse.ArgumentParser()
    sub = ap.add_subparsers(dest="cmd", required=True)
    i = sub.add_parser("init"); i.add_argument("idea"); i.add_argument("--slug")
    v = sub.add_parser("validate"); v.add_argument("slug")
    s = sub.add_parser("status"); s.add_argument("slug")
    a = ap.parse_args()
    {"init": cmd_init, "validate": cmd_validate, "status": cmd_status}[a.cmd](a)


if __name__ == "__main__":
    main()
