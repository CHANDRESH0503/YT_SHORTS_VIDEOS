#!/usr/bin/env python3
"""Keyframes via Nano Banana (Gemini app / Google AI Studio), made by the user - free, manual.

  python3 keyframes.py <slug>               # write keyframes/NANO_BANANA.md (prompt sheet) + list what's missing
  python3 keyframes.py <slug> --check       # pick up dropped-in frames, normalise to 1080x1920 PNG, contact sheet
  python3 keyframes.py <slug> --sheet-only  # rebuild qa/keyframes_sheet.jpg

The user generates each image in Nano Banana and saves it into projects/<slug>/keyframes/ as the filename the sheet
gives (asset_<id>.png, S01.png ...). Loose names like "s1.png", "S01 (1).jpeg" or ".webp" are accepted by --check.
Images that are not 9:16 are centre-cropped (original kept in keyframes/originals/).
"""
from __future__ import annotations

import argparse
import json
import re
import shutil
import tempfile
from pathlib import Path

from common import IMG_EXTS, die, find_file, iter_shots, load_beats, load_config, project_dir, run

MIN_W = 720  # below this the 1080x1920 render looks soft


def build_shot_prompt(beats: dict, shot: dict, cfg: dict) -> str:
    """Natural-language prompt (Nano Banana follows descriptive sentences better than tag lists)."""
    assets = {a["id"]: a for a in beats["assets"]}
    refs = [r for r in shot.get("asset_refs", []) if r in assets]
    style = cfg["style_presets"][beats["style_preset"]]
    lines = [f"Create a vertical 9:16 portrait image. {shot['scene'].strip().rstrip('.')}."]
    for r in refs:
        lines.append(f"The {r.replace('_', ' ')} is {assets[r]['description']} - match the uploaded reference image exactly.")
    lines.append(f"Style: {style}.")
    if shot.get("lighting_camera"):
        lines.append(f"Camera and lighting: {shot['lighting_camera']}.")
    setting = shot.get("background", beats.get("world", ""))
    if setting:
        lines.append(f"Setting: {setting}.")
    lines.append("Leave some calm space in the lower third. Absolutely no text, letters, numbers, captions, logos or watermark.")
    return " ".join(lines)


def build_asset_prompt(beats: dict, asset: dict, cfg: dict) -> str:
    style = re.sub(r",?\s*vertical 9:16 frame", "", cfg["style_presets"][beats["style_preset"]])
    return (f"Create a square character/prop reference sheet showing {asset['description']} from the front, three-quarter "
            f"and side view, neutral pose, on a clean light grey studio background with even soft lighting. Style: {style}. "
            "No text, labels or watermark.")


# ------------------------------------------------------------------ prompt sheet
def write_pack(pdir: Path, beats: dict, cfg: dict) -> Path:
    kdir = pdir / "keyframes"
    out = kdir / "NANO_BANANA.md"
    L = [f"# Nano Banana keyframes - {beats['title']}\n",
         "Make each image in the **Gemini app** (gemini.google.com → Create image) or **Google AI Studio** "
         "(aistudio.google.com, model *Gemini … Flash Image / Nano Banana*, aspect ratio **9:16**). Both are free.\n",
         f"Save every image into:\n`{kdir}/`\nwith the **exact filename** shown. Any of png/jpg/webp is fine.\n",
         "**Order:** do the asset reference sheets first, then upload them as the reference image wherever a shot lists one "
         "(that's what keeps characters/props consistent). Check the corners for a visible watermark; regenerate or crop if there is one.\n",
         "When done, tell Claude `continue " + pdir.name + "` (it runs `keyframes.py " + pdir.name + " --check`).\n"]
    done = lambda stem: "✅ done" if find_file(kdir, stem, IMG_EXTS) else "⬜ todo"  # noqa: E731
    if beats["assets"]:
        L.append("\n## Step 1 - asset reference sheets (square 1:1)\n")
        for a in beats["assets"]:
            stem = f"asset_{a['id']}"
            L += [f"### `{stem}.png` - {done(stem)}", "```", build_asset_prompt(beats, a, cfg), "```", ""]
    code = [s["id"] for _, s in iter_shots(beats) if s.get("source") == "code3d"]
    if code:
        L.append(f"\n> Built by Claude as code-built 3D - **skip these**: {', '.join(code)}\n")
    L.append("\n## Step 2 - one frame per shot (vertical 9:16)\n")
    for b, s in iter_shots(beats):
        if s.get("source") == "code3d":
            continue
        refs = [f"`asset_{r}.png`" for r in s.get("asset_refs", [])]
        tag = " · **hero**" if s.get("hero") else ""
        L.append(f"### `{s['id']}.png` - {done(s['id'])}{tag}")
        L.append(f"Beat {b['id']} ({b['role']}): _{b['narration']['en']}_  ")
        L.append(f"Upload reference: {', '.join(refs) if refs else 'none'}")
        L += ["```", build_shot_prompt(beats, s, cfg), "```", ""]
    out.write_text("\n".join(L), encoding="utf-8")
    (kdir / "prompts.json").write_text(json.dumps(
        {**{f"asset_{a['id']}": build_asset_prompt(beats, a, cfg) for a in beats["assets"]},
         **{s["id"]: build_shot_prompt(beats, s, cfg) for _, s in iter_shots(beats) if s.get("source") != "code3d"}},
        ensure_ascii=False, indent=1))
    return out


# ------------------------------------------------------------------ check / normalise
def probe_size(f: Path) -> tuple[int, int] | None:
    r = run(["ffprobe", "-v", "error", "-select_streams", "v:0", "-show_entries", "stream=width,height", "-of", "csv=p=0", str(f)])
    try:
        w, h = (int(x) for x in r.stdout.strip().split(",")[:2])
        return w, h
    except ValueError:
        return None


def adopt_loose_names(kdir: Path, beats: dict) -> list[str]:
    """Rename e.g. 's1.png', 'S01 (2).jpeg', 'asset_display.webp' -> canonical stems."""
    shot_ids = {int(s["id"][1:]): s["id"] for _, s in iter_shots(beats)}
    asset_ids = {a["id"].lower(): a["id"] for a in beats["assets"]}
    moved = []
    for f in sorted(kdir.iterdir()):
        if not f.is_file() or f.suffix.lower() not in IMG_EXTS or f.parent.name == "originals":
            continue
        stem = f.stem
        m = re.match(r"^\s*s0*(\d+)\b", stem, re.I)
        target = None
        if m and int(m.group(1)) in shot_ids:
            target = shot_ids[int(m.group(1))]
        else:
            m2 = re.match(r"^\s*asset[_\- ]+([a-z0-9_]+)", stem, re.I)
            if m2 and m2.group(1).lower() in asset_ids:
                target = f"asset_{asset_ids[m2.group(1).lower()]}"
        if target and stem != target:
            dest = kdir / f"{target}{f.suffix.lower()}"
            if dest.exists():
                continue
            f.rename(dest)
            moved.append(f"{f.name} -> {dest.name}")
    return moved


def normalise(f: Path, kdir: Path, W: int, H: int) -> str:
    size = probe_size(f)
    if not size:
        return "unreadable"
    w, h = size
    ratio, target = w / h, W / H
    note = f"{w}x{h}"
    if (w, h) == (W, H) and f.suffix == ".png":
        return note + " ok"
    orig = kdir / "originals"
    orig.mkdir(exist_ok=True)
    keep = orig / f.name
    shutil.copy2(f, keep)
    vf = f"scale={W}:{H}:force_original_aspect_ratio=increase:flags=lanczos,crop={W}:{H}"
    out = kdir / f"{f.stem}.png"
    tmp = kdir / f".{f.stem}.tmp.png"
    run(["ffmpeg", "-v", "error", "-y", "-i", str(keep), "-vf", vf, "-frames:v", "1", str(tmp)])
    if f != out:
        f.unlink()
    tmp.replace(out)
    if abs(ratio - target) > 0.03:
        note += f" cropped to 9:16 (was {ratio:.2f}, lost {100 * (1 - min(ratio, target) / max(ratio, target)):.0f}% of the frame)"
    else:
        note += " resized"
    if w < MIN_W:
        note += f" ⚠ low resolution (<{MIN_W}px wide) - regenerate larger if possible"
    return note


def check(pdir: Path, beats: dict, cfg: dict) -> dict:
    kdir = pdir / "keyframes"
    W, H = cfg["image"]["width"], cfg["image"]["height"]
    moved = adopt_loose_names(kdir, beats)
    report, missing = {}, []
    pending_3d = []
    for _, s in iter_shots(beats):
        f = find_file(kdir, s["id"], IMG_EXTS)
        if not f:
            (pending_3d if s.get("source") == "code3d" else missing).append(s["id"])
            continue
        report[s["id"]] = normalise(f, kdir, W, H)
    for a in beats["assets"]:
        if not find_file(kdir, f"asset_{a['id']}", IMG_EXTS):
            report[f"asset_{a['id']}"] = "missing (optional, but used as the consistency reference)"
    return {"renamed": moved, "frames": report, "missing": missing, "code3d_pending": pending_3d,
            "ok": not missing and not pending_3d}


def contact_sheet(pdir: Path, beats: dict) -> Path | None:
    kdir = pdir / "keyframes"
    tmp = Path(tempfile.mkdtemp())
    n = 0
    for _, s in iter_shots(beats):
        f = find_file(kdir, s["id"], IMG_EXTS)
        if not f:
            continue
        run(["ffmpeg", "-v", "error", "-y", "-i", str(f), "-vf",
             "scale=270:480:force_original_aspect_ratio=increase,crop=270:480", str(tmp / f"{n:03d}.png")])
        n += 1
    if not n:
        return None
    cols = 6
    rows = (n + cols - 1) // cols
    out = pdir / "qa" / "keyframes_sheet.jpg"
    out.parent.mkdir(exist_ok=True)
    run(["ffmpeg", "-v", "error", "-y", "-framerate", "1", "-i", str(tmp / "%03d.png"),
         "-vf", f"tile={cols}x{rows}:padding=6:color=black", "-frames:v", "1", "-q:v", "3", str(out)])
    shutil.rmtree(tmp, ignore_errors=True)
    return out


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("slug")
    ap.add_argument("--check", action="store_true")
    ap.add_argument("--sheet-only", action="store_true")
    a = ap.parse_args()
    cfg = load_config()
    pdir = project_dir(a.slug)
    beats = load_beats(pdir)
    (pdir / "keyframes").mkdir(exist_ok=True)
    if a.sheet_only:
        print(json.dumps({"sheet": str(contact_sheet(pdir, beats))}))
        return
    if a.check:
        res = check(pdir, beats, cfg)
        write_pack(pdir, beats, cfg)  # refresh ✅/⬜ marks
        sheet = contact_sheet(pdir, beats)
        res["sheet"] = str(sheet) if sheet else None
        print(json.dumps(res, ensure_ascii=False, indent=1))
        if res["missing"]:
            die(f"{len(res['missing'])} Nano Banana frame(s) still missing: {' '.join(res['missing'])}", 2)
        if res["code3d_pending"]:
            die(f"code3d shots not rendered yet: {' '.join(res['code3d_pending'])} - build and render them first (clips/Sxx.mp4 + keyframes/Sxx.png)", 2)
        return
    pack = write_pack(pdir, beats, cfg)
    shots = [s["id"] for _, s in iter_shots(beats)]
    nano = [s["id"] for _, s in iter_shots(beats) if s.get("source") != "code3d"]
    missing = [sid for sid in nano if not find_file(pdir / "keyframes", sid, IMG_EXTS)]
    print(json.dumps({"prompt_sheet": str(pack), "folder": str(pdir / "keyframes"), "shots": len(shots), "nano_shots": len(nano),
                      "assets": [f"asset_{x['id']}" for x in beats["assets"]], "missing": missing}, indent=1))


if __name__ == "__main__":
    main()
