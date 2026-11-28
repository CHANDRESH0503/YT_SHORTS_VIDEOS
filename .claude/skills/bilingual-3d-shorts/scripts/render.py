#!/usr/bin/env python3
"""Render final Shorts with Remotion, normalise loudness, write SRT + thumbnail.

  python3 render.py <slug> [--lang en ta] [--preview]   # --preview = 540x960 fast draft

Outputs: final/<slug>_<lang>.mp4, final/<slug>_<lang>.srt, final/thumb_<lang>.jpg
"""
from __future__ import annotations

import argparse
import json
import re
import time

from common import LANGS, REMOTION_DIR, die, disk_free_gb, load_config, project_dir, run


def srt_time(frames: int, fps: int) -> str:
    ms = int(round(frames / fps * 1000))
    h, ms = divmod(ms, 3_600_000)
    m, ms = divmod(ms, 60_000)
    s, ms = divmod(ms, 1000)
    return f"{h:02d}:{m:02d}:{s:02d},{ms:03d}"


def write_srt(tl: dict, out) -> None:
    fps = tl["fps"]
    lines = []
    for i, c in enumerate(tl["captions"], 1):
        lines += [str(i), f"{srt_time(c['from'], fps)} --> {srt_time(c['to'], fps)}", c["text"], ""]
    out.write_text("\n".join(lines), encoding="utf-8")


def loudnorm(src, dst, cfg) -> dict:
    I, TP = cfg["audio"]["target_lufs"], cfg["audio"]["true_peak"]
    r = run(["ffmpeg", "-hide_banner", "-y", "-i", str(src), "-af", f"loudnorm=I={I}:TP={TP}:LRA=11:print_format=json",
             "-f", "null", "-"])
    m = json.loads(re.findall(r"\{[^{}]+\}", r.stderr, re.S)[-1])
    af = (f"loudnorm=I={I}:TP={TP}:LRA=11:measured_I={m['input_i']}:measured_TP={m['input_tp']}:"
          f"measured_LRA={m['input_lra']}:measured_thresh={m['input_thresh']}:offset={m['target_offset']}:linear=true")
    run(["ffmpeg", "-v", "error", "-y", "-i", str(src), "-c:v", "copy", "-af", af, "-c:a", "aac", "-b:a", "256k",
         "-ar", "48000", "-movflags", "+faststart", str(dst)])
    return m


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("slug")
    ap.add_argument("--lang", nargs="*", default=list(LANGS))
    ap.add_argument("--preview", action="store_true")
    a = ap.parse_args()
    cfg = load_config()
    pdir = project_dir(a.slug)
    if not (REMOTION_DIR / "node_modules" / "remotion").exists():
        die("Remotion not installed - run: cd remotion && npm install && npx remotion browser ensure")
    if disk_free_gb() < 2:
        die(f"only {disk_free_gb():.1f} GB free - rendering needs ~2 GB of scratch space")
    out_dir = pdir / "final"
    out_dir.mkdir(exist_ok=True)
    for lang in a.lang:
        tlf = pdir / f"timeline_{lang}.json"
        if not tlf.exists():
            die(f"{tlf} missing - run timeline.py {a.slug}")
        tl = json.loads(tlf.read_text())
        raw = out_dir / f".{a.slug}_{lang}_raw.mp4"
        t0 = time.time()
        cmd = ["npx", "remotion", "render", "src/index.ts", "ShortVideo", str(raw), f"--props={tlf}",
               f"--public-dir={pdir}", "--codec=h264", "--crf=17", "--x264-preset=slow", "--color-space=bt709",
               *(["--image-format=jpeg", "--jpeg-quality=90"] if a.preview else ["--image-format=png"]),
               "--audio-codec=aac", "--audio-bitrate=320k", "--concurrency=4", "--log=error"]
        if a.preview:
            cmd.append("--scale=0.5")
        print(f"{lang}: rendering {tl['durationInFrames']} frames ...", flush=True)
        run(cmd, cwd=REMOTION_DIR)
        final = out_dir / (f"{a.slug}_{lang}_preview.mp4" if a.preview else f"{a.slug}_{lang}.mp4")
        m = loudnorm(raw, final, cfg)
        raw.unlink(missing_ok=True)
        write_srt(tl, out_dir / f"{a.slug}_{lang}.srt")
        thumb_f = tl["overlays"][0]["from"] + 12 if tl["overlays"] else 30
        run(["ffmpeg", "-v", "error", "-y", "-ss", f"{thumb_f / tl['fps']:.2f}", "-i", str(final), "-frames:v", "1",
             "-q:v", "2", str(out_dir / f"thumb_{lang}.jpg")])
        print(json.dumps({"lang": lang, "file": str(final), "render_sec": round(time.time() - t0),
                          "input_lufs": m["input_i"]}))


if __name__ == "__main__":
    main()
