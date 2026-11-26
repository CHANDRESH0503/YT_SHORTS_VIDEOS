#!/usr/bin/env python3
"""Automated QA for final renders + contact sheets for visual review.

  python3 qa.py <slug> [--lang en ta]

Writes qa_report.md and qa/contact_<lang>.jpg; exit code 3 if any hard check fails.
"""
from __future__ import annotations

import argparse
import json
import re

from common import LANGS, ROOT, end_card_sec, load_config, project_dir, run


def probe(f) -> dict:
    r = run(["ffprobe", "-v", "error", "-show_entries", "stream=codec_type,width,height,r_frame_rate:format=duration",
             "-of", "json", str(f)])
    return json.loads(r.stdout)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("slug")
    ap.add_argument("--lang", nargs="*", default=list(LANGS))
    a = ap.parse_args()
    cfg = load_config()
    pdir = project_dir(a.slug)
    V, D = cfg["video"], cfg["duration"]
    report, failed = [f"# QA report - {a.slug}\n"], False
    for lang in a.lang:
        f = pdir / "final" / f"{a.slug}_{lang}.mp4"
        report.append(f"\n## {lang.upper()} - `{f.name}`\n")
        if not f.exists():
            report.append("- FAIL: file missing\n"); failed = True; continue
        tl = json.loads((pdir / f"timeline_{lang}.json").read_text())
        words = json.loads((pdir / "audio" / lang / "words.json").read_text())["words"]
        p = probe(f)
        vs = next(s for s in p["streams"] if s["codec_type"] == "video")
        dur = float(p["format"]["duration"])
        num, den = map(int, vs["r_frame_rate"].split("/"))
        fps = num / den
        checks = []
        checks.append((D["min"] <= dur <= D["max"], f"duration {dur:.2f}s (want {D['min']}-{D['max']})"))
        checks.append(((vs["width"], vs["height"]) == (V["width"], V["height"]), f"resolution {vs['width']}x{vs['height']}"))
        checks.append((abs(fps - V["fps"]) < 0.01, f"fps {fps:.2f}"))
        checks.append((any(s["codec_type"] == "audio" for s in p["streams"]), "audio stream present"))

        e = run(["ffmpeg", "-hide_banner", "-nostats", "-i", str(f), "-af", "ebur128=peak=true", "-f", "null", "-"]).stderr
        I = float(re.findall(r"I:\s+(-?[\d.]+) LUFS", e)[-1])
        tp = re.findall(r"Peak:\s+(-?[\d.]+) dBFS", e)
        checks.append((abs(I - cfg["audio"]["target_lufs"]) <= 1.0, f"integrated loudness {I:.1f} LUFS"))
        if tp:
            checks.append((float(tp[-1]) <= cfg["audio"]["true_peak"] + 0.5, f"true peak {float(tp[-1]):.1f} dBFS"))

        bd = run(["ffmpeg", "-hide_banner", "-nostats", "-i", str(f), "-vf", "blackdetect=d=0.3:pix_th=0.08", "-an",
                  "-f", "null", "-"]).stderr
        blacks = re.findall(r"black_start:([\d.]+)", bd)
        checks.append((not blacks, f"black gaps: {blacks or 'none'}"))
        fz = run(["ffmpeg", "-hide_banner", "-nostats", "-i", str(f), "-vf", "freezedetect=n=-60dB:d=1.5", "-an",
                  "-f", "null", "-"]).stderr
        freezes = re.findall(r"freeze_start: ([\d.]+)", fz)
        checks.append((not freezes, f"frozen stretches >1.5s: {freezes or 'none'}"))

        max_seg = max(s["dur"] for s in tl["segments"]) / tl["fps"]
        checks.append((max_seg <= V["max_shot_sec"] + 0.25, f"longest shot {max_seg:.2f}s"))
        n_cap_words = sum(len(c["words"]) for c in tl["captions"])
        checks.append((n_cap_words == len(words), f"caption words {n_cap_words}/{len(words)}"))
        if end_card_sec(cfg):
            ec = tl.get("endCard")
            ok = bool(ec) and ec["from"] + ec["dur"] == tl["durationInFrames"] and (pdir / ec["logo"]).exists()
            checks.append((ok, f"end card (channel logo + subscribe) {'at ' + str(round(ec['from'] / tl['fps'], 2)) + 's' if ec else 'MISSING - re-run timeline.py + render.py'}"))
        cap = cfg["captions"]
        checks.append((55 <= cap["y_percent"] <= 75 and cap["max_width_percent"] <= 86,
                       f"caption safe area y={cap['y_percent']}% width={cap['max_width_percent']}%"))
        hero_ids = {s["shot"] for s in tl["segments"] if s["clip"]}
        report.append(f"- info: {len(tl['segments'])} segments, {len(hero_ids)} shots with real clips, "
                      f"{len(tl['overlays'])} overlays, {len(tl['captions'])} caption chunks\n")
        for ok, msg in checks:
            report.append(f"- {'PASS' if ok else 'FAIL'}: {msg}\n")
            failed |= not ok

        sheet = pdir / "qa" / f"contact_{lang}.jpg"
        run(["ffmpeg", "-v", "error", "-y", "-i", str(f), "-vf", "fps=1/2.5,scale=270:-1,tile=6x4:padding=4",
             "-frames:v", "1", "-q:v", "3", str(sheet)])
        report.append(f"- contact sheet: `{sheet}`\n")

    refs = sorted((ROOT / "References").glob("*"))
    if refs:
        ref_sheet = pdir / "qa" / "reference_sheet.jpg"
        if not ref_sheet.exists():
            run(["ffmpeg", "-v", "error", "-y", "-i", str(refs[0]), "-vf", "fps=1/2.5,scale=270:-1,tile=6x2:padding=4",
                 "-frames:v", "1", "-q:v", "3", str(ref_sheet)])
        report.append(f"\nReference sheet for side-by-side: `{ref_sheet}`\n")
    (pdir / "qa_report.md").write_text("".join(report))
    print("".join(report))
    if failed:
        raise SystemExit(3)


if __name__ == "__main__":
    main()
