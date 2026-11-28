"""Long-form (4-12 min) planning: outline.json skeleton, the plan check + report, YouTube chapters, beats-vs-outline checks.

Used through project.py:
  python3 project.py init "<idea>" --long --minutes 9    -> outline.json skeleton with a chapter time budget
  python3 project.py plan <slug>                         -> checks outline.json, writes plan.md (+ final/chapters_<lang>.txt
                                                            from the real audio once voices exist); exit 2 on errors
  python3 project.py validate <slug>                     -> for "format": "long" beats.json also checks it against outline.json
Rules and research: references/long-form-playbook.md. Numbers: config.json -> long_form.
"""
from __future__ import annotations

import json
import re

from common import LANGS, SOURCES, end_card_sec, faceless_styles, load_config, project_dir

TITLE_STING_SEC = 2.5   # silent title card after the cold open
CARD_SEC = 2.5          # each chapter card (the voice pauses under it)
STOP = set("the a an and but so it its is are of to in on at for that this with by be was it's you your who what how".split())


def mmss(sec: float) -> str:
    sec = max(0, int(round(sec)))
    return f"{sec // 60}:{sec % 60:02d}" if sec < 3600 else f"{sec // 3600}:{sec % 3600 // 60:02d}:{sec % 60:02d}"


def voice_limits(cfg: dict, chars: dict) -> list[str]:
    """Budget warnings for the voice provider each language uses (references/voice-and-captions.md §Providers)."""
    v, out = cfg["voice"], []
    prov = {l: v[l].get("provider") or v.get("provider", "elevenlabs") for l in LANGS}
    el = [l for l in LANGS if prov[l] == "elevenlabs"]
    for l in el:
        if chars[l] > 10000:
            out.append(f"{l}: ~{chars[l]} characters - over ElevenLabs' 10,000 per request (one take); switch this language to "
                       "the edge voice (voice.provider), or cut the script")
    if el and sum(chars[l] for l in el) > cfg["long_form"]["voice_free_chars_month"]:
        out.append(f"ElevenLabs would need ~{sum(chars[l] for l in el)} characters - more than a free month "
                   f"({cfg['long_form']['voice_free_chars_month']}); use voice.provider edge (free, no limit), or agree at Gate L")
    return out


def chapter_range(minutes: float, lf: dict) -> tuple[int, int]:
    for upto, lo, hi in lf["chapters_by_minutes"]:
        if minutes <= upto:
            return lo, hi
    return tuple(lf["chapters_by_minutes"][-1][1:])


def outline_skeleton(idea: str, minutes: float, cfg: dict) -> dict:
    """A fill-in outline whose chapter seconds already add up to the target length (playbook §3, §7)."""
    lf = cfg["long_form"]
    lo, hi = chapter_range(minutes, lf)
    n = round((lo + hi) / 2)
    cold, ending = 40, 40
    body = minutes * 60 - cold - ending - TITLE_STING_SEC - n * CARD_SEC - end_card_sec(cfg)
    per = int(body / n)
    chapters = [{"id": f"C{i}", "title": "", "goal": "", "turn": "", "analogy": "", "rehooks": [""], "numbers": [],
                 "skit": False, "sets": [], "cliffhanger": "" if i < n else None, "est_sec": per} for i in range(1, n + 1)]
    chapters[-1].pop("cliffhanger")
    return {
        "format": "long", "minutes_target": minutes, "aspect": lf["aspect"], "idea": idea,
        "title_working": "", "promise": "", "central_question": "",
        "cold_open": {"scene": "", "line": "", "stakes": "", "irony": "", "question": "", "est_sec": cold},
        "chapters": chapters,
        "midpoint_twist": {"chapter": f"C{(n + 1) // 2 + (n % 2 == 0)}", "what": ""},
        "loops": [{"question": "", "opened_in": "cold_open", "closed_in": f"C{n}"}],
        "ending": {"resolution": "", "you_angle": "", "callback": "", "final_line": "", "est_sec": ending},
        "recurring": {"cast": [], "sets": [], "motifs": []},
        "visual_plan": {"mode": "", "faceless_style": "", "reason": ""},
        "shorts_cutdowns": [],
    }


def timeline_of(o: dict, cfg: dict) -> tuple[list[dict], float]:
    """Estimated start/end of each part: cold open, title sting, chapters (card + body), ending, end card."""
    parts, t = [], 0.0
    co = float((o.get("cold_open") or {}).get("est_sec") or 0)
    parts.append({"id": "cold_open", "title": "Cold open", "start": t, "end": t + co}); t += co
    t += TITLE_STING_SEC
    for c in o.get("chapters") or []:
        d = float(c.get("est_sec") or 0)
        parts.append({"id": c.get("id"), "title": c.get("title") or c.get("id"), "start": t, "end": t + CARD_SEC + d,
                      "rehooks": len([r for r in c.get("rehooks") or [] if str(r).strip()])})
        t += CARD_SEC + d
    en = float((o.get("ending") or {}).get("est_sec") or 0)
    parts.append({"id": "ending", "title": "Ending", "start": t, "end": t + en}); t += en
    return parts, t + end_card_sec(cfg)


def _words(x: str) -> set[str]:
    return {w for w in re.findall(r"[a-z']+", str(x).lower()) if len(w) > 3 and w not in STOP}


def check_outline(o: dict, cfg: dict) -> tuple[list[str], list[str], dict]:
    lf = cfg["long_form"]
    errs, warns = [], []
    if o.get("format") != "long":
        errs.append('outline.json needs "format": "long"')
    for k in ("title_working", "promise", "central_question"):
        if not str(o.get(k) or "").strip():
            errs.append(f"outline.{k} empty")
    mins = float(o.get("minutes_target") or 0)
    D = lf["duration"]
    if not D["min"] <= mins * 60 <= D["max"]:
        errs.append(f"minutes_target {mins} outside {D['min'] // 60}-{D['max'] // 60} min")
    # cold open (playbook §3.1)
    co = o.get("cold_open") or {}
    for k in ("scene", "line", "stakes", "question"):
        if not str(co.get(k) or "").strip():
            errs.append(f"cold_open.{k} empty - open on the most dramatic moment, the stakes and the central question")
    lo, hi = lf["cold_open_sec"]["min"], lf["cold_open_sec"]["max"]
    if not lo <= float(co.get("est_sec") or 0) <= hi:
        errs.append(f"cold_open.est_sec {co.get('est_sec')} outside {lo}-{hi}s (first interrupt by ~30 s, story starts by ~45 s)")
    low = str(co.get("line") or "").lower().lstrip()
    for bad in (cfg.get("hook") or {}).get("banned_openers", []):
        if low.startswith(bad):
            errs.append(f"cold_open.line opens with '{bad}' - start inside the most dramatic moment, no warm-up (§2c)")
    if not str(co.get("irony") or "").strip():
        warns.append("cold_open.irony empty - one thing the viewer knows that a character doesn't keeps them watching")
    # chapters
    ch = o.get("chapters") or []
    clo, chi = chapter_range(mins or 9, lf)
    if not clo <= len(ch) <= chi:
        warns.append(f"{len(ch)} chapters for ~{mins:g} min (aim {clo}-{chi})")
    ids = [c.get("id") for c in ch]
    if len(set(ids)) != len(ids) or not all(ids):
        errs.append("every chapter needs a unique id (C1, C2, ...)")
    set_ids = {s.get("id") for s in (o.get("recurring") or {}).get("sets") or []}
    slo, shi = lf["chapter_sec"]["min"], lf["chapter_sec"]["max"]
    for i, c in enumerate(ch):
        cid = c.get("id", f"#{i + 1}")
        for k in ("title", "goal", "turn"):
            if not str(c.get(k) or "").strip():
                errs.append(f"{cid}.{k} empty")
        if len(str(c.get("title") or "").split()) > lf["chapter_title_max_words"]:
            warns.append(f"{cid}.title '{c.get('title')}' - keep chapter cards to {lf['chapter_title_max_words']} words")
        if i < len(ch) - 1 and not str(c.get("cliffhanger") or "").strip():
            errs.append(f"{cid}.cliffhanger empty - end every chapter but the last on a line that pulls into the next one")
        if not str(c.get("analogy") or "").strip():
            warns.append(f"{cid}: no analogy - give the chapter's hardest idea an everyday comparison")
        if not slo <= float(c.get("est_sec") or 0) <= shi:
            warns.append(f"{cid}.est_sec {c.get('est_sec')} outside {slo}-{shi}s - split or merge chapters")
        t = str(c.get("turn") or "").lower()
        if t and not re.search(r"\b(but|therefore|so|until|except|instead|then)\b", t):
            warns.append(f"{cid}.turn should read as 'but …' or 'therefore …' (a change, not 'and then')")
        if set_ids and not c.get("sets"):
            warns.append(f"{cid}: name the recurring sets it uses (reuse keeps 150-240 shots buildable)")
        for s in c.get("sets") or []:
            if set_ids and s not in set_ids:
                errs.append(f"{cid}: set '{s}' is not in recurring.sets")
    # timing + re-hook map
    parts, total = timeline_of(o, cfg)
    if not D["min"] <= total <= D["max"]:
        errs.append(f"estimated runtime {mmss(total)} outside {mmss(D['min'])}-{mmss(D['max'])}")
    elif mins and abs(total - mins * 60) > 0.15 * mins * 60:
        warns.append(f"estimated runtime {mmss(total)} is far from minutes_target {mins:g} - adjust est_sec")
    marks = [parts[0]["end"]]  # the central question lands at the end of the cold open
    for p in parts[1:-1]:
        marks.append(p["start"])  # chapter card
        k = p.get("rehooks", 0)
        body = p["end"] - p["start"] - CARD_SEC
        marks += [p["start"] + CARD_SEC + body * (j + 1) / (k + 1) for j in range(k)]
        marks.append(p["end"])  # cliffhanger
    marks = sorted({round(m, 1) for m in marks})  # a cliffhanger and the next chapter card are one moment
    gap_max = lf["rehook_max_gap_sec"]
    for a, b in zip(marks, marks[1:]):
        if b - a > gap_max:
            warns.append(f"no re-hook between {mmss(a)} and {mmss(b)} ({b - a:.0f}s) - add one to that chapter's rehooks (max ~{gap_max}s)")
    mt = o.get("midpoint_twist") or {}
    tp = next((p for p in parts if p["id"] == mt.get("chapter")), None)
    if not tp or not str(mt.get("what") or "").strip():
        errs.append("midpoint_twist {chapter, what} missing - a reveal that reframes everything before it")
    else:
        pos = (tp["start"] + tp["end"]) / 2 / total
        a, b = lf["midpoint_twist_pct"]
        if not a <= pos <= b:
            warns.append(f"midpoint twist in {mt['chapter']} lands at ~{pos:.0%} of the runtime (aim {a:.0%}-{b:.0%})")
    # open loops
    order = ["cold_open"] + ids + ["ending"]
    loops = o.get("loops") or []
    if not any(lp.get("opened_in") == "cold_open" for lp in loops):
        errs.append("loops: the cold open's central question must be a loop (opened_in: cold_open, closed_in: a later chapter)")
    for lp in loops:
        oi, ci = lp.get("opened_in"), lp.get("closed_in")
        if oi not in order or ci not in order:
            errs.append(f"loop '{lp.get('question')}': opened_in/closed_in must be one of {order}")
        elif order.index(ci) <= order.index(oi):
            errs.append(f"loop '{lp.get('question')}' closes before (or where) it opens")
        elif order.index(ci) - order.index(oi) < 2 and oi != "cold_open":
            warns.append(f"loop '{lp.get('question')}' closes in the next part - let it run across a chapter so it pulls")
    # ending (playbook §3.5)
    en = o.get("ending") or {}
    for k in ("resolution", "callback", "final_line"):
        if not str(en.get(k) or "").strip():
            errs.append(f"ending.{k} empty")
    if not str(en.get("you_angle") or "").strip():
        warns.append("ending.you_angle empty - say what the story means for the viewer before the callback")
    if en.get("final_line") and not _words(en["final_line"]) & (_words(co.get("line")) | _words(co.get("question")) | _words(co.get("scene"))):
        warns.append("ending.final_line shares no key word with the cold open - close the loop back to the opening image")
    if re.search(r"\b(to recap|in summary|in conclusion)\b", str(en), re.I):
        warns.append("ending says 'to recap / in summary' - viewers leave on recap phrases; end on the callback")
    # recurring cast / sets / visual plan
    rec = o.get("recurring") or {}
    if not rec.get("cast"):
        warns.append("recurring.cast empty - fix each character's look once (cast bible) so 150+ shots stay consistent")
    if not set_ids:
        warns.append("recurring.sets empty - plan 4-8 reusable sets; long-form is only buildable through reuse")
    elif len(set_ids) > lf["max_sets"]:
        warns.append(f"{len(set_ids)} recurring sets - over {lf['max_sets']} costs more build time than it adds")
    vp = o.get("visual_plan") or {}
    if vp.get("mode") not in (*SOURCES, "hybrid"):
        errs.append(f"visual_plan.mode must be one of {(*SOURCES, 'hybrid')} (references/visual-source-decision.md + playbook §4)")
    if vp.get("mode") in ("faceless", "hybrid") and vp.get("faceless_style") and vp["faceless_style"] not in faceless_styles():
        errs.append(f"visual_plan.faceless_style must be one of {faceless_styles()}")
    if o.get("aspect", lf["aspect"]) != lf["aspect"]:
        warns.append(f"aspect {o.get('aspect')} - long-form is {lf['aspect']} (YouTube long-form is landscape)")
    if not o.get("shorts_cutdowns"):
        warns.append("shorts_cutdowns empty - plan 2-3 Shorts from chapters whose turn stands alone (playbook §6)")
    # production budget (playbook §5)
    speech = total - TITLE_STING_SEC - len(ch) * CARD_SEC - end_card_sec(cfg)
    budget = {"runtime": mmss(total), "runtime_sec": round(total), "speech_sec": round(speech),
              "words_en": round(speech * lf["wpm"]["en"] / 60), "shots": round(speech / lf["avg_shot_sec"]),
              "sets": len(set_ids), "chapters": len(ch), "rehooks": len(marks), "midroll_eligible": total >= lf["midroll_min_sec"]}
    for lang in LANGS:
        budget[f"chars_{lang}"] = round(speech * cfg["voice"][lang]["chars_per_sec"])
        budget[f"voice_{lang}"] = cfg["voice"][lang].get("provider") or cfg["voice"].get("provider", "elevenlabs")
    budget["chars_total"] = budget["chars_en"] + budget["chars_ta"]
    warns += voice_limits(cfg, {l: budget[f"chars_{l}"] for l in LANGS})
    return errs, warns, {"parts": parts, "marks": marks, "budget": budget}


def chapters_from_audio(pdir, beats: dict, o: dict, lang: str, cfg: dict) -> list[tuple[float, str]] | None:
    """Real chapter starts from audio/<lang>/words.json beat times (YouTube needs 00:00 first, >= 3 chapters, >= 10 s each)."""
    f = pdir / "audio" / lang / "words.json"
    if not f.exists() or not beats:
        return None
    bt = {b["id"]: b for b in json.loads(f.read_text()).get("beats", [])}
    pre = cfg["video"]["preroll_sec"]
    titles = {c["id"]: c.get("title") for c in o.get("chapters") or []}
    out, seen = [(0.0, "Intro" if lang == "en" else "முன்னுரை")], set()
    for b in beats["beats"]:
        cid = b.get("chapter")
        if cid in titles and cid not in seen and b["id"] in bt:
            seen.add(cid)
            card = (b.get("chapter_card") or {}).get(lang) or titles[cid]
            out.append((max(0.0, pre + bt[b["id"]]["start"] - 0.5), card))
    return out


def cmd_plan(a):
    pdir = project_dir(a.slug)
    cfg = load_config()
    f = pdir / "outline.json"
    if not f.exists():
        raise SystemExit(f"ERROR: {f} missing - run `project.py init \"<idea>\" --long` or write outline.json (playbook §7)")
    o = json.loads(f.read_text())
    errs, warns, r = check_outline(o, cfg)
    b, lf = r["budget"], cfg["long_form"]
    lines = [f"# Long-form plan - {o.get('title_working') or a.slug}\n",
             f"**Promise:** {o.get('promise', '')}  \n**Central question:** {o.get('central_question', '')}  \n"
             f"**Runtime:** ~{b['runtime']} ({o.get('aspect', lf['aspect'])}) · {b['chapters']} chapters · ~{b['words_en']} words EN · "
             f"~{b['shots']} shots · {b['sets']} recurring sets\n",
             "## Chapter map (estimated)\n", "| start | part | sec | turn / cliffhanger |", "|---|---|---|---|"]
    chap = {c.get("id"): c for c in o.get("chapters") or []}
    for p in r["parts"]:
        c = chap.get(p["id"], {})
        note = (o.get("cold_open") or {}).get("question", "") if p["id"] == "cold_open" else \
            (o.get("ending") or {}).get("callback", "") if p["id"] == "ending" else f"{c.get('turn', '')} → {c.get('cliffhanger') or '(last)'}"
        lines.append(f"| {mmss(p['start'])} | {p['title']} | {p['end'] - p['start']:.0f} | {note} |")
    lines += ["", "## Re-hook map", ", ".join(mmss(m) for m in r["marks"]), ""]
    lines += ["## YouTube chapters (estimated; the real ones are written from the audio)"]
    yt = [(0.0, "Intro")] + [(p["start"], p["title"]) for p in r["parts"][1:-1]]
    lines += [f"{mmss(t)} {n}" for t, n in yt] + [""]
    if b["midroll_eligible"]:
        brk = [mmss(p["start"]) for p in r["parts"][2:-1] if p["start"] >= 120]
        lines += ["## Mid-roll ad breaks (8:00+)", "At chapter cards, right after a cliffhanger: " + ", ".join(brk), ""]
    lines += ["## Production budget", f"- Voice: ~{b['chars_en']} characters EN ({b['voice_en']}) + ~{b['chars_ta']} TA ({b['voice_ta']}) "
              f"= ~{b['chars_total']} (ElevenLabs: ~{lf['voice_free_chars_month']} free a month, ≤ 10,000 per take; edge: no limit)",
              f"- Shots: ~{b['shots']} at ~{lf['avg_shot_sec']} s; sets: {b['sets']}; cast: {len((o.get('recurring') or {}).get('cast') or [])}",
              f"- Visual plan: {(o.get('visual_plan') or {}).get('mode')} {(o.get('visual_plan') or {}).get('faceless_style') or ''} "
              f"- {(o.get('visual_plan') or {}).get('reason', '')}", ""]
    if o.get("shorts_cutdowns"):
        lines += ["## Shorts cut-downs"] + [f"- {s.get('chapter')}: {s.get('hook')}" for s in o["shorts_cutdowns"]] + [""]
    beats = json.loads((pdir / "beats.json").read_text()) if (pdir / "beats.json").exists() else None
    written = []
    for lang in LANGS:
        real = chapters_from_audio(pdir, beats, o, lang, cfg)
        if real:
            ok = len(real) >= lf["youtube_chapters"]["min_count"] and all(
                b2 - a2 >= lf["youtube_chapters"]["min_sec"] for (a2, _), (b2, _) in zip(real, real[1:]))
            if not ok:
                warns.append(f"{lang}: real chapters break YouTube's rules (>= 3, >= 10 s each) - check beat chapter ids")
            (pdir / "final").mkdir(exist_ok=True)
            out = pdir / "final" / f"chapters_{lang}.txt"
            out.write_text("\n".join(f"{mmss(t)} {n}" for t, n in real) + "\n")
            written.append(str(out))
    if errs or warns:
        lines += ["## To fix"] + [f"- ERROR: {e}" for e in errs] + [f"- WARN: {w}" for w in warns] + [""]
    (pdir / "plan.md").write_text("\n".join(lines))
    print(json.dumps({"ok": not errs, "errors": errs, "warnings": warns, "budget": b, "plan": str(pdir / "plan.md"),
                      "chapters_files": written}, ensure_ascii=False, indent=2))
    if errs:
        raise SystemExit(2)


def check_long_beats(beats: dict, outline: dict | None, cfg: dict, stats: dict, errs: list, warns: list) -> None:
    """A long-form beats.json must follow its approved outline.json (playbook §8)."""
    if not outline:
        errs.append("long-form beats.json but no outline.json - plan first (project.py init --long, then project.py plan, Gate L)")
        return
    cids = [c.get("id") for c in outline.get("chapters") or []]
    order = ["cold_open"] + cids + ["ending"]
    bl = beats["beats"]
    last = 0
    for b in bl:
        c = b.get("chapter")
        if c not in order:
            errs.append(f"{b['id']}: chapter must be one of {order}")
            continue
        if order.index(c) < last:
            errs.append(f"{b['id']}: chapter '{c}' comes after '{order[last]}' - beats must follow the outline's order")
        last = max(last, order.index(c))
    if bl and bl[0].get("chapter") != "cold_open":
        errs.append("the first beat must be the cold open (chapter: cold_open)")
    cps = cfg["voice"]["en"]["chars_per_sec"]
    for c in outline.get("chapters") or []:
        mine = [b for b in bl if b.get("chapter") == c["id"]]
        if not mine:
            errs.append(f"{c['id']} '{c.get('title')}' has no beats")
            continue
        if not all((mine[0].get("chapter_card") or {}).get(l) for l in LANGS):
            errs.append(f"{mine[0]['id']}: first beat of {c['id']} needs chapter_card {{en, ta}} (the 2-5 word title card)")
        est = sum(len(b["narration"]["en"]) for b in mine) / cps
        want = float(c.get("est_sec") or 0)
        if want and abs(est - want) > 0.35 * want:
            warns.append(f"{c['id']}: narration ~{est:.0f}s vs outline {want:.0f}s - trim or re-budget the outline")
    warns += voice_limits(cfg, {l: stats.get(l, {}).get("chars", 0) for l in LANGS})
