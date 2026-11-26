#!/usr/bin/env python3
"""Publish kit for bilingual Shorts: thumbnail + title + description + tags (EN: "How is this", TA: "How is this - Tamil").

  python3 publish_kit.py frames   <slug>   # clean thumbnail candidates -> qa/thumb_candidates.jpg
  python3 publish_kit.py validate <slug>   # check publish.json against YouTube limits + channel rules
  python3 publish_kit.py thumbs   <slug>   # render final/thumbnail_<lang>.jpg (9:16) + thumbnail_<lang>_16x9.jpg
  python3 publish_kit.py finalize <slug>   # write final/publish_<lang>.md (copy-paste ready)
  python3 publish_kit.py all      <slug>   # validate + thumbs + finalize

publish.json (written by Claude in the project dir) - see references/seo-playbook.md for the rules:
{
  "thumb_shot": "S01", "thumb_time": null,          # keyframe Sxx, or a time (sec) inside clips/Sxx.mp4
  "sources": ["https://..."],
  "en": {"title": "...", "title_options": ["...", "...", "..."], "thumb_text": "Your clock is|*LYING*",
         "hook_line": "...", "body": "...", "hashtags": ["#shorts", ...], "tags": ["...", ...]},
  "ta": { ...same keys... }
}
"""
from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path

KIT_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(KIT_DIR.parent / "bilingual-3d-shorts" / "scripts"))
from common import (CLIP_EXTS, IMG_EXTS, LANGS, REMOTION_DIR, die, find_file, load_beats,  # noqa: E402
                    load_config, project_dir, run)

TAMIL = re.compile(r"[஀-௿]")
LETTER = re.compile(r"[^\W\d_]", re.UNICODE)


def kit_cfg() -> dict:
    return json.loads((KIT_DIR / "config.json").read_text())


def load_publish(pdir: Path) -> dict:
    f = pdir / "publish.json"
    if not f.exists():
        die(f"{f} missing - write it first (see {KIT_DIR / 'references' / 'seo-playbook.md'})")
    return json.loads(f.read_text())


def tamil_ratio(s: str) -> float:
    letters = LETTER.findall(s)
    return len(TAMIL.findall(s)) / max(1, len(letters))


def build_description(pub: dict, lang: str, kc: dict) -> str:
    L = pub[lang]
    parts = [L["hook_line"].strip(), L["body"].strip()]
    if pub.get("sources"):
        head = "Sources:" if lang == "en" else "ஆதாரங்கள்:"
        parts.append(head + "\n" + "\n".join(f"- {u}" for u in pub["sources"]))
    parts.append(kc["channel_lines"][lang])
    parts.append(kc["cross_links"][lang])
    if kc["attribution"]["enabled"]:
        parts.append(kc["attribution"][lang])
    parts.append(" ".join(L["hashtags"]))
    return "\n\n".join(p for p in parts if p)


# ---------------------------------------------------------------- frames
def cmd_frames(slug: str) -> None:
    pdir = project_dir(slug)
    beats = load_beats(pdir)
    shots = [s for b in beats["beats"] for s in b["shots"]]
    cands = [s["id"] for s in shots if s.get("hero")] or [s["id"] for s in shots]
    if shots[0]["id"] not in cands:
        cands.insert(0, shots[0]["id"])
    qa = pdir / "qa"
    qa.mkdir(exist_ok=True)
    imgs = []
    for sid in cands:
        img = find_file(pdir / "keyframes", sid, IMG_EXTS)
        if img:
            imgs.append((sid, img))
    if not imgs:
        die("no keyframes found - run keyframes.py (or render 3D keyframes) first")
    inputs, chains = [], []
    for i, (sid, img) in enumerate(imgs):
        inputs += ["-i", str(img)]
        chains.append(f"[{i}]scale=360:640:force_original_aspect_ratio=increase,crop=360:640[v{i}]")
    cols = min(4, len(imgs))
    rows = -(-len(imgs) // cols)
    pad = cols * rows - len(imgs)
    for k in range(pad):
        chains.append(f"color=c=black:s=360x640:d=1[p{k}]")
    labels = "".join(f"[v{i}]" for i in range(len(imgs))) + "".join(f"[p{k}]" for k in range(pad))
    layout = "|".join(f"{(i % cols) * 360}_{(i // cols) * 640}" for i in range(cols * rows))
    fc = ";".join(chains) + f";{labels}xstack=inputs={cols * rows}:layout={layout}[out]"
    run(["ffmpeg", "-v", "error", "-y", *inputs, "-filter_complex", fc, "-map", "[out]", "-frames:v", "1",
         str(qa / "thumb_candidates.jpg")])
    print(json.dumps({"sheet": str(qa / "thumb_candidates.jpg"), "order": [s for s, _ in imgs], "cols": cols}))


# ---------------------------------------------------------------- validate
def validate(pub: dict, kc: dict, pdir: Path) -> tuple[list[str], list[str]]:
    errs, warns = [], []
    lim = kc["limits"]
    sid = pub.get("thumb_shot")
    if not sid:
        errs.append("thumb_shot missing")
    elif pub.get("thumb_time") is not None:
        if not find_file(pdir / "clips", sid, CLIP_EXTS):
            errs.append(f"thumb_time given but clips/{sid}.* missing")
    elif not find_file(pdir / "keyframes", sid, IMG_EXTS):
        errs.append(f"keyframes/{sid}.* missing")
    for lang in LANGS:
        L = pub.get(lang)
        if not L:
            errs.append(f"{lang}: section missing"); continue
        for k in ("title", "title_options", "thumb_text", "hook_line", "body", "hashtags", "tags"):
            if not L.get(k):
                errs.append(f"{lang}: '{k}' missing or empty")
        if errs and any(e.startswith(lang) for e in errs):
            continue
        titles = [L["title"], *L["title_options"]]
        for t in titles:
            if len(t) > lim["title_max"]:
                errs.append(f"{lang}: title over {lim['title_max']} chars: {t!r}")
            if "<" in t or ">" in t:
                errs.append(f"{lang}: '<' or '>' not allowed in titles: {t!r}")
        if len(L["title"]) > lim["title_target"]:
            warns.append(f"{lang}: title {len(L['title'])} chars (aim <= {lim['title_target']} so it isn't truncated)")
        if len(L["title_options"]) < 3:
            warns.append(f"{lang}: give 3 title_options")
        if L["title"] not in L["title_options"]:
            warns.append(f"{lang}: chosen title is not one of title_options")
        tt = L["thumb_text"].replace("*", "").replace("|", " ")
        if len(tt.split()) > lim["thumb_words_max"]:
            errs.append(f"{lang}: thumb_text has {len(tt.split())} words (max {lim['thumb_words_max']})")
        if len(tt) > lim["thumb_chars_max"]:
            errs.append(f"{lang}: thumb_text {len(tt)} chars (max {lim['thumb_chars_max']})")
        hs = L["hashtags"]
        if not (lim["hashtags_min"] <= len(hs) <= lim["hashtags_max"]):
            errs.append(f"{lang}: {len(hs)} hashtags (want {lim['hashtags_min']}-{lim['hashtags_max']})")
        if hs and hs[0].lower() != "#shorts":
            errs.append(f"{lang}: first hashtag must be #shorts")
        for h in hs:
            if not re.fullmatch(r"#[^\s#]+", h):
                errs.append(f"{lang}: bad hashtag {h!r}")
        tags = L["tags"]
        if not (lim["tags_min"] <= len(tags) <= lim["tags_max"]):
            errs.append(f"{lang}: {len(tags)} tags (want {lim['tags_min']}-{lim['tags_max']})")
        tag_chars = len(",".join(tags))
        if tag_chars > lim["tags_chars_max"]:
            errs.append(f"{lang}: tags total {tag_chars} chars (YouTube max {lim['tags_chars_max']})")
        if any("<" in t or ">" in t or "," in t for t in tags):
            errs.append(f"{lang}: tags may not contain '<', '>' or ','")
        if len(set(t.lower() for t in tags)) != len(tags):
            warns.append(f"{lang}: duplicate tags")
        ch = kc["channels"][lang]["name"]
        if ch.lower() not in [t.lower() for t in tags]:
            warns.append(f"{lang}: add the channel name '{ch}' as a tag")
        desc = build_description(pub, lang, kc)
        if len(desc) > lim["description_max"]:
            errs.append(f"{lang}: description {len(desc)} chars (max {lim['description_max']})")
        if "<" in desc or ">" in desc:
            errs.append(f"{lang}: '<' or '>' not allowed in description")
        if lang == "ta":
            for k in ("title", "hook_line", "body", "thumb_text"):
                r = tamil_ratio(L[k])
                if r < lim["tamil_script_min_ratio"]:
                    errs.append(f"ta: '{k}' is only {r:.0%} Tamil script - transcreate it into Tamil")
        else:
            for k in ("title", "hook_line", "body", "thumb_text"):
                if TAMIL.search(L[k]):
                    errs.append(f"en: '{k}' contains Tamil script")
        blob = " ".join([*titles, L["hook_line"], L["body"], *tags]).lower()
        for term in kc.get("banned_terms", []):
            if term.lower() in blob:
                errs.append(f"{lang}: banned term {term!r}")
        if re.search(r"(^|\s)@\w", blob):
            warns.append(f"{lang}: @mention found - don't tag other creators")
    return errs, warns


def cmd_validate(slug: str) -> bool:
    pdir = project_dir(slug)
    errs, warns = validate(load_publish(pdir), kit_cfg(), pdir)
    print(json.dumps({"ok": not errs, "errors": errs, "warnings": warns}, ensure_ascii=False, indent=2))
    return not errs


# ---------------------------------------------------------------- thumbs
def thumb_source(pdir: Path, pub: dict) -> Path:
    sid = pub["thumb_shot"]
    if pub.get("thumb_time") is not None:
        clip = find_file(pdir / "clips", sid, CLIP_EXTS)
        out = pdir / "qa" / "thumb_src.png"
        run(["ffmpeg", "-v", "error", "-y", "-ss", f"{float(pub['thumb_time']):.2f}", "-i", str(clip), "-frames:v", "1", str(out)])
        return out
    return find_file(pdir / "keyframes", sid, IMG_EXTS)


def cmd_thumbs(slug: str) -> None:
    pdir = project_dir(slug)
    pub, kc, cfg = load_publish(pdir), kit_cfg(), load_config()
    src = thumb_source(pdir, pub)
    rel = src.relative_to(pdir).as_posix()
    out_dir = pdir / "final"
    out_dir.mkdir(exist_ok=True)
    W, H = kc["thumbnail"]["landscape"]
    for lang in LANGS:
        props = {"lang": lang, "image": rel, "text": pub[lang]["thumb_text"], "channel": kc["channels"][lang]["name"],
                 "accent": kc["thumbnail"]["accent"], "grade": cfg["grade"]}
        pf = pdir / "qa" / f"thumb_props_{lang}.json"
        pf.write_text(json.dumps(props, ensure_ascii=False))
        out = out_dir / f"thumbnail_{lang}.jpg"
        run(["npx", "remotion", "still", "src/index.ts", "Thumbnail", str(out), f"--props={pf}", f"--public-dir={pdir}",
             "--image-format=jpeg", f"--jpeg-quality={kc['thumbnail']['jpeg_quality']}", "--log=error"], cwd=REMOTION_DIR)
        land = out_dir / f"thumbnail_{lang}_16x9.jpg"
        fc = (f"[0]scale={W}:{H}:force_original_aspect_ratio=increase,crop={W}:{H},boxblur=30:3,eq=brightness=-0.12[bg];"
              f"[0]scale=-2:{H}[fg];[bg][fg]overlay=(W-w)/2:0")
        run(["ffmpeg", "-v", "error", "-y", "-i", str(out), "-filter_complex", fc, "-frames:v", "1", "-q:v", "2", str(land)])
        print(json.dumps({"lang": lang, "thumbnail": str(out), "landscape": str(land)}))


# ---------------------------------------------------------------- finalize
def cmd_finalize(slug: str) -> None:
    pdir = project_dir(slug)
    pub, kc = load_publish(pdir), kit_cfg()
    for lang in LANGS:
        L = pub[lang]
        other = "ta" if lang == "en" else "en"
        ch = kc["channels"][lang]["name"]
        desc = build_description(pub, lang, kc)
        tags = ", ".join(L["tags"])
        alts = "\n".join(f"- {t}" for t in L["title_options"] if t != L["title"])
        if lang == "en":
            md = f"""# Publish kit - {ch} (English)

**Video:** `final/{slug}_en.mp4`
**Thumbnail:** `final/thumbnail_en.jpg` (9:16), `final/thumbnail_en_16x9.jpg` (16:9)
**Captions:** upload `final/{slug}_en.srt` (English) and `final/{slug}_{other}.srt` as a Tamil CC track

## Title ({len(L['title'])} chars)
{L['title']}

### Other options
{alts}

## Description
```
{desc}
```

## Tags ({len(','.join(L['tags']))}/500 chars) - paste into the Tags box
```
{tags}
```

## Hashtags
{' '.join(L['hashtags'])}
"""
        else:
            md = f"""# Publish kit - {ch} (தமிழ்)

**வீடியோ:** `final/{slug}_ta.mp4`
**Thumbnail:** `final/thumbnail_ta.jpg` (9:16), `final/thumbnail_ta_16x9.jpg` (16:9)
**வசனங்கள்:** `final/{slug}_ta.srt` (தமிழ்) மற்றும் `final/{slug}_{other}.srt`-ஐ English CC track-ஆ அப்லோட் பண்ணுங்க

## தலைப்பு ({len(L['title'])} chars)
{L['title']}

### மற்ற விருப்பங்கள்
{alts}

## விளக்கம் (Description)
```
{desc}
```

## Tags ({len(','.join(L['tags']))}/500 chars)
```
{tags}
```

## ஹேஷ்டேக்குகள்
{' '.join(L['hashtags'])}
"""
        f = pdir / "final" / f"publish_{lang}.md"
        f.write_text(md, encoding="utf-8")
        print(json.dumps({"lang": lang, "file": str(f), "title_chars": len(L["title"]), "tags_chars": len(",".join(L["tags"])),
                          "description_chars": len(desc)}, ensure_ascii=False))


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("cmd", choices=["frames", "validate", "thumbs", "finalize", "all"])
    ap.add_argument("slug")
    a = ap.parse_args()
    if a.cmd == "frames":
        cmd_frames(a.slug)
    elif a.cmd == "validate":
        sys.exit(0 if cmd_validate(a.slug) else 2)
    elif a.cmd == "thumbs":
        cmd_thumbs(a.slug)
    elif a.cmd == "finalize":
        cmd_finalize(a.slug)
    else:
        if not cmd_validate(a.slug):
            sys.exit(2)
        cmd_thumbs(a.slug)
        cmd_finalize(a.slug)


if __name__ == "__main__":
    main()
