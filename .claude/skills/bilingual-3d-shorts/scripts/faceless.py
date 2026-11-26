#!/usr/bin/env python3
"""Faceless-shorts shots (source: "faceless") - rendered in code by the faceless-shorts skill's engine, $0.

  python3 faceless.py <slug>            # set up projects/<slug>/faceless/ (the style's engine) + list the shot slots
  python3 faceless.py <slug> --check    # boot the engine headless and report errors (capture.mjs check)
  python3 faceless.py <slug> --export   # render every faceless shot -> clips/Sxx.mp4 (5s) + keyframes/Sxx.png
  python3 faceless.py <slug> --export --only S04,S07

Only the faceless-shorts *visual engine* is used (three.js / canvas in headless Chrome). Voice, captions, music, the
end card and both languages stay in this pipeline (ElevenLabs + Remotion), so the faceless sub-project has no voice and
no captions: each faceless shot gets a fixed 5 s slot, line k of data/lines.json, and Claude writes src/shots.js with
`at: L(k)` for shot k (see the slot list this prints). Style = visual_plan.faceless_style (one style per video).
Needs Node 22+ and a Chrome (installed Chrome, $CHROME, or Remotion's Chrome for Testing). No npm install, no Kokoro/Whisper models.
"""
from __future__ import annotations

import argparse
import json
import os
import shutil
import subprocess
import tempfile
from pathlib import Path

from common import FACELESS_SKILL as FS_SKILL, die, faceless_styles, find_chrome, iter_shots, load_beats, project_dir, run

SLOT = 5.0   # seconds per shot (same as code3d clips; timeline trims to the shot length)
LEAD = 0.5   # the engine fades in over 0.25 s at t=0 and out over 0.4 s at the end: keep slots clear of both
FPS = "30"   # the pipeline's fps (config.video.fps)


def faceless_shots(beats: dict) -> list[tuple[dict, dict]]:
    return [(b, s) for b, s in iter_shots(beats) if s.get("source") == "faceless"]


def write_timing(fdir: Path, beats: dict, shots: list[tuple[dict, dict]]) -> list[dict]:
    """script.json + data/lines.json: one silent 5 s slot per faceless shot; data/words.json empty = no captions."""
    lines, slots = [], []
    for k, (b, s) in enumerate(shots):
        start = LEAD + k * SLOT
        lines.append({"i": k, "text": s["id"], "start": round(start, 3), "end": round(start + SLOT, 3)})
        slots.append({"line": k, "id": s["id"], "start": start, "end": start + SLOT, "beat": b["id"],
                      "scene": s["scene"], "camera_move": s.get("camera_move"), "narration_en": b["narration"]["en"]})
    dur = LEAD + len(shots) * SLOT + LEAD
    (fdir / "data").mkdir(exist_ok=True)
    (fdir / "data/lines.json").write_text(json.dumps({"duration": dur, "estimated": True, "lines": lines}, indent=1))
    (fdir / "data/words.json").write_text("[]\n")
    for f in ("cues.json", "narration.wav", "mix.wav", "words.txt"):
        (fdir / "data" / f).unlink(missing_ok=True)
    script = {"title": beats.get("title", ""), "note": "visual-only sub-project of the bilingual pipeline: no voice, no captions",
              "lines": [{"text": s["id"], "caps": " "} for _, s in shots]}
    (fdir / "script.json").write_text(json.dumps(script, indent=1, ensure_ascii=False))
    (fdir / "slots.json").write_text(json.dumps(slots, indent=1, ensure_ascii=False))
    return slots


def capture(fdir: Path, *args: str) -> subprocess.CompletedProcess:
    env = {**os.environ, "FPS": FPS}
    if find_chrome():
        env["CHROME"] = find_chrome()
    return subprocess.run(["node", "tools/capture.mjs", *args], cwd=fdir, env=env, capture_output=True, text=True)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("slug")
    ap.add_argument("--check", action="store_true")
    ap.add_argument("--export", action="store_true")
    ap.add_argument("--only", default="", help="comma-separated shot ids to export")
    a = ap.parse_args()
    pdir = project_dir(a.slug)
    beats = load_beats(pdir)
    shots = faceless_shots(beats)
    if not shots:
        die("no shots with source 'faceless' in beats.json - nothing to do")
    style = (beats.get("visual_plan") or {}).get("faceless_style")
    if style not in faceless_styles():
        die(f"visual_plan.faceless_style must be one of {faceless_styles()} (got {style!r})")
    if not FS_SKILL.exists():
        die(f"faceless-shorts skill not found at {FS_SKILL}")
    fdir = pdir / "faceless"
    if not fdir.exists():
        run(["bash", str(FS_SKILL / "scripts/new_video.sh"), style, "faceless", "--dir", str(pdir)])
    elif (fdir / ".style").exists() and (fdir / ".style").read_text().strip() != style:
        die(f"{fdir} was made with style '{(fdir / '.style').read_text().strip()}'; delete it (or ask the user) before switching to '{style}'")
    (fdir / ".style").write_text(style + "\n")
    slots = write_timing(fdir, beats, shots)

    if a.check or a.export:
        r = capture(fdir, "check")
        print(r.stdout.strip())
        if "CHECK OK" not in r.stdout:
            die(f"capture.mjs check failed - fix src/shots.js first\n{r.stderr.strip()}", 2)
    if a.export:
        only = {x.strip().upper() for x in a.only.split(",") if x.strip()}
        (pdir / "clips").mkdir(exist_ok=True)
        (pdir / "keyframes").mkdir(exist_ok=True)
        done = []
        for sl in slots:
            if only and sl["id"] not in only:
                continue
            clip = pdir / "clips" / f"{sl['id']}.mp4"
            r = capture(fdir, "video", str(clip), str(sl["start"]), str(sl["end"]))
            if r.returncode or not clip.exists():
                die(f"{sl['id']}: video capture failed\n{r.stdout[-400:]}{r.stderr[-400:]}", 2)
            tmp = Path(tempfile.mkdtemp())
            mid = sl["start"] + SLOT / 2
            r = capture(fdir, "frames", str(tmp), f"{mid:.2f}")
            jpg = next(tmp.glob("*.jpg"), None)
            if r.returncode or not jpg:
                die(f"{sl['id']}: keyframe capture failed\n{r.stderr[-400:]}", 2)
            run(["ffmpeg", "-v", "error", "-y", "-i", str(jpg), "-vf", "scale=1080:1920", str(pdir / "keyframes" / f"{sl['id']}.png")])
            shutil.rmtree(tmp, ignore_errors=True)
            done.append(sl["id"])
        print(json.dumps({"exported": done, "clips": str(pdir / "clips"), "keyframes": str(pdir / "keyframes"),
                          "next": f"python3 keyframes.py {a.slug} --check"}, indent=1))
        return
    print(json.dumps({"style": style, "dir": str(fdir), "style_guide": str(FS_SKILL / "styles" / style / "STYLE.md"),
                      "style_sheet": str(FS_SKILL / "styles" / style / "style-sheet.png"),
                      "write": str(fdir / "src/shots.js"),
                      "slots": [f"L({s['line']}) = {s['id']} ({s['beat']}, {s['camera_move']}): {s['scene']}" for s in slots],
                      "next": f"python3 faceless.py {a.slug} --check, then --export"}, ensure_ascii=False, indent=1))


if __name__ == "__main__":
    main()
