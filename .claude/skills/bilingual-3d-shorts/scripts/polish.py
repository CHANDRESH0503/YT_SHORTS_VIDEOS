#!/usr/bin/env python3
"""Deep Polish pass (Stage 6b): whole-video audit of a preview (or final) render before the final render / Gate 4.

  python3 polish.py <slug> [--lang en ta] [--video path.mp4]

Per shot segment of timeline_<lang>.json it measures, from the rendered video:
  · motion energy   mean frame-to-frame change inside the segment (transitions excluded): static or monotonous shots
  · colour          mean luma + chroma per segment against the video's median: shots that fall outside the grade
  · cut sync        cuts that land in the middle of a spoken word
  · sound density   SFX events per 10 s window and per beat (from the timeline): silent stretches apart from the voice
  · numbers         beats whose narration states a number with no number / infographic overlay
Writes qa/polish_<lang>.md (ranked fixes) and qa/polish_sheet_<lang>.jpg (the frame before + after every cut, with the
energy and flags under each pair). Everything here is a WARN: thresholds live in config.json "polish" and still need
calibrating on real Shorts, so nothing blocks the gate. Uses <slug>_<lang>_preview.mp4 when present, else the final.
"""
from __future__ import annotations

import argparse
import json
import re
import subprocess
from pathlib import Path

from common import LANGS, die, load_beats, load_config, project_dir

DW, DH = 36, 64   # analysis size (9:16)
NUM_WORDS = r"\b(one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|fifteen|twenty|thirty|forty|fifty|hundred|thousand|million|billion|percent|half|double|triple)\b"
# calibrated on the bullet-train Short (2026-11-28): energy median ~4, a washed-out near-static shot at 0.7 / luma 191;
# scene changes (sky vs tunnel vs x-ray) move luma ±30% and chroma Δ ~15 by design, so only outliers flag
DEFAULTS = {"static_energy": 0.8, "monotony_ratio": 0.2, "luma_dev": 0.4, "chroma_dev": 30.0, "chroma_outlier_x": 2.5,
            "min_sfx_per_10s": 3, "cut_word_margin": 3, "edge_frames": 6, "sheet_offset": 8}


def decode(video: Path, fps: int) -> tuple[list[bytes], list[bytes]]:
    """All frames at DWxDH: gray (motion) and rgb (colour)."""
    gray = subprocess.run(["ffmpeg", "-v", "error", "-i", str(video), "-vf", f"fps={fps},scale={DW}:{DH},format=gray",
                           "-f", "rawvideo", "-"], capture_output=True).stdout
    rgb = subprocess.run(["ffmpeg", "-v", "error", "-i", str(video), "-vf", f"fps={fps},scale={DW}:{DH},format=rgb24",
                          "-f", "rawvideo", "-"], capture_output=True).stdout
    n = DW * DH
    return [gray[i * n:(i + 1) * n] for i in range(len(gray) // n)], [rgb[i * n * 3:(i + 1) * n * 3] for i in range(len(rgb) // (n * 3))]


def frame_diff(a: bytes, b: bytes) -> float:
    return sum(abs(x - y) for x, y in zip(a, b)) / len(a)


def colour(fr: bytes) -> tuple[float, float, float]:
    """mean luma 0..255 and chroma (U, V) offsets."""
    r, g, b = fr[0::3], fr[1::3], fr[2::3]
    n = len(r)
    R, G, B = sum(r) / n, sum(g) / n, sum(b) / n
    y = 0.299 * R + 0.587 * G + 0.114 * B
    return y, 0.492 * (B - y), 0.877 * (R - y)


def median(xs: list[float]) -> float:
    s = sorted(xs)
    return s[len(s) // 2] if s else 0.0


def sheet(video: Path, cuts: list[dict], fps: int, out: Path) -> bool:
    """Contact sheet: for every cut the last frame before and the first frame after, captioned."""
    try:
        from PIL import Image, ImageDraw, ImageFont
    except ImportError:
        print("WARN: Pillow not installed - skipping polish sheet")
        return False
    tw, th = 135, 240
    cols = 4
    off = DEFAULTS["sheet_offset"]
    pairs = []
    for c in cuts:
        imgs = []
        for f in (max(0, c["frame"] - off), c["frame"] + off):   # outside the whip / zoom blur
            raw = subprocess.run(["ffmpeg", "-v", "error", "-ss", f"{f / fps:.3f}", "-i", str(video), "-frames:v", "1",
                                  "-vf", f"scale={tw}:{th}", "-f", "rawvideo", "-pix_fmt", "rgb24", "-"], capture_output=True).stdout
            imgs.append(Image.frombytes("RGB", (tw, th), raw) if len(raw) == tw * th * 3 else Image.new("RGB", (tw, th)))
        pairs.append((c, imgs))
    pw, ph = 2 * tw + 6, th + 58
    rows = (len(pairs) + cols - 1) // cols
    canvas = Image.new("RGB", (cols * (pw + 12) + 12, rows * (ph + 12) + 12), (18, 18, 22))
    d = ImageDraw.Draw(canvas)
    try:
        font = ImageFont.truetype("/System/Library/Fonts/Supplemental/Arial Bold.ttf", 13)
    except OSError:
        font = ImageFont.load_default()
    for i, (c, (a, b)) in enumerate(pairs):
        x, y = 12 + (i % cols) * (pw + 12), 12 + (i // cols) * (ph + 12)
        canvas.paste(a, (x, y))
        canvas.paste(b, (x + tw + 6, y))
        col = (255, 120, 90) if c["flags"] else (200, 205, 210)
        d.text((x, y + th + 4), f"{c['frame'] / fps:5.2f}s {c['prev']}→{c['shot']} {c['transition']}", fill=(255, 255, 255), font=font)
        d.text((x, y + th + 20), f"energy {c['energy']:.1f}  sfx/10s {c['sfx10']}", fill=(200, 205, 210), font=font)
        d.text((x, y + th + 36), ", ".join(c["flags"])[:44] or "ok", fill=col, font=font)
    out.parent.mkdir(exist_ok=True)
    canvas.save(out, quality=88)
    return True


def audit(slug: str, lang: str, video_arg: str | None, cfg: dict) -> dict:
    pdir = project_dir(slug)
    P = {**DEFAULTS, **(cfg.get("polish") or {})}
    tlf = pdir / f"timeline_{lang}.json"
    if not tlf.exists():
        die(f"{tlf} missing - run timeline.py {slug} first")
    tl = json.loads(tlf.read_text())
    fps = tl["fps"]
    video = Path(video_arg) if video_arg else next((v for v in (pdir / "final" / f"{slug}_{lang}_preview.mp4",
                                                                pdir / "final" / f"{slug}_{lang}.mp4") if v.exists()), None)
    if not video or not video.exists():
        die(f"no render for {lang} - run render.py {slug} --preview first")
    beats = load_beats(pdir)
    words = json.loads((pdir / "audio" / lang / "words.json").read_text())["words"]
    pre = cfg["video"]["preroll_sec"]
    gray, rgb = decode(video, fps)
    if abs(len(gray) - tl["durationInFrames"]) > 3:
        print(f"WARN {lang}: video has {len(gray)} frames, timeline {tl['durationInFrames']} - re-render after timeline.py")
    segs = tl["segments"]
    E = P["edge_frames"]
    issues = []   # (score, text)

    # ---- per-segment motion + colour ----
    rows = []
    for i, sg in enumerate(segs):
        a, b = sg["from"] + E, min(sg["from"] + sg["dur"] - E, len(gray) - 1)
        if b - a < 3:
            a, b = sg["from"], min(sg["from"] + sg["dur"], len(gray) - 1)
        en = sum(frame_diff(gray[k], gray[k - 1]) for k in range(a + 1, b + 1)) / max(1, b - a)
        cs = [colour(rgb[k]) for k in range(a, b + 1, 3) if k < len(rgb)]
        y = sum(c[0] for c in cs) / max(1, len(cs))
        u = sum(c[1] for c in cs) / max(1, len(cs))
        v = sum(c[2] for c in cs) / max(1, len(cs))
        rows.append({"i": i, "shot": sg["shot"], "beat": sg["beat"], "from": sg["from"], "dur": sg["dur"], "move": sg["move"],
                     "transition": sg["transition"], "energy": en, "y": y, "u": u, "v": v, "flags": []})
    my, mu, mv = median([r["y"] for r in rows]), median([r["u"] for r in rows]), median([r["v"] for r in rows])
    dc = lambda r: ((r["u"] - mu) ** 2 + (r["v"] - mv) ** 2) ** 0.5  # noqa: E731
    c_lim = max(P["chroma_dev"], P["chroma_outlier_x"] * median([dc(r) for r in rows]))
    for k, r in enumerate(rows):
        t = r["from"] / fps
        if r["energy"] < P["static_energy"]:
            r["flags"].append("static")
            issues.append((3, f"{t:5.2f}s {r['shot']}: nearly static (energy {r['energy']:.2f} < {P['static_energy']}) - "
                              "add real motion in the clip (camera move, action, particles) or a stronger 2.5D move"))
        if k and rows[k - 1]["shot"] != r["shot"]:
            p = rows[k - 1]
            if abs(p["energy"] - r["energy"]) <= P["monotony_ratio"] * max(p["energy"], r["energy"], 1e-6) and p["move"] == r["move"]:
                r["flags"].append("monotone")
                issues.append((1, f"{t:5.2f}s {p['shot']}→{r['shot']}: same move ({r['move']}) and same energy - vary scale or move"))
        if my and abs(r["y"] - my) / my > P["luma_dev"]:
            r["flags"].append("luma")
            issues.append((2, f"{t:5.2f}s {r['shot']}: brightness {r['y']:.0f} vs video median {my:.0f} - washed out or murky: "
                              "re-light (exposure, sky colour, key from the camera side)"))
        if dc(r) > c_lim:
            r["flags"].append("colour")
            issues.append((1, f"{t:5.2f}s {r['shot']}: colour far off the rest (Δ {dc(r):.1f} > {c_lim:.1f}) - fine if it is a "
                              "deliberate set change (x-ray, night), else match the palette"))

    # ---- cut sync: cuts inside a spoken word ----
    F = lambda s: int(round((pre + s) * fps))  # noqa: E731
    wspans = [(F(w["start"]), F(w["end"]), w["text"]) for w in words]
    m = P["cut_word_margin"]
    for r in rows[1:]:
        f = r["from"]
        hit = next((w for w in wspans if w[0] + m < f < w[1] - m), None)
        if hit:
            r["flags"].append("mid-word")
            issues.append((1, f"{f / fps:5.2f}s {r['shot']}: cut lands inside the word '{hit[2]}' - nudge with shot weight"))

    # ---- sound density ----
    sfx = tl.get("sfx") or []
    end = tl["endCard"]["from"] if tl.get("endCard") else tl["durationInFrames"]
    win = 10 * fps
    dens = []
    for w0 in range(0, end, win):
        n = sum(1 for s in sfx if w0 <= s["from"] < min(end, w0 + win))
        span = (min(end, w0 + win) - w0) / fps
        dens.append((w0, round(n / span * 10, 1)))
        if span >= 5 and n / span * 10 < P["min_sfx_per_10s"]:
            issues.append((2, f"{w0 / fps:5.1f}-{min(end, w0 + win) / fps:.1f}s: {n} sounds ({n / span * 10:.1f}/10 s) - "
                              "add foley on actions in this stretch"))
    for r in rows:
        r["sfx10"] = next((d for w0, d in dens if w0 <= r["from"] < w0 + win), 0)
    bwin = {}
    for r in rows:
        b = bwin.setdefault(r["beat"], [r["from"], r["from"] + r["dur"]])
        b[1] = max(b[1], r["from"] + r["dur"])
    for bid, (b0, b1) in bwin.items():
        real = [s for s in sfx if b0 <= s["from"] < b1 and not re.search(r"/(whoosh2?|pop|tick)\.wav$", s["src"])]
        if not real:
            issues.append((2, f"{b0 / fps:5.2f}s {bid}: no foley, impact or stinger in this beat (only whooshes/pops) - add a sound moment"))

    # ---- numbers on screen ----
    ov_shots = {s["id"] for b in beats["beats"] for s in b["shots"] if s.get("overlay")}
    for b in beats["beats"]:
        nar = b["narration"]["en"]
        nums = re.findall(r"\b\d[\d,.]*\b", nar) + re.findall(NUM_WORDS, nar, re.I)
        if nums and not any(s["id"] in ov_shots for s in b["shots"]):
            issues.append((2, f"{b['id']}: says {', '.join(dict.fromkeys(n.lower() for n in nums))} with no number on screen - "
                              "add a counter / gauge / compare / scale overlay"))

    issues.sort(key=lambda x: -x[0])
    cuts = [{"frame": r["from"], "prev": rows[k - 1]["shot"], "shot": r["shot"], "transition": r["transition"],
             "energy": r["energy"], "sfx10": r["sfx10"], "flags": r["flags"]} for k, r in enumerate(rows) if k]
    qa = pdir / "qa"
    has_sheet = sheet(video, cuts, fps, qa / f"polish_sheet_{lang}.jpg")
    sev = {3: "HIGH", 2: "MED", 1: "LOW"}
    md = [f"# Deep Polish - {slug} ({lang})", "", f"video: `{video.name}` · {len(rows)} segments · median luma {my:.0f}",
          f"motion energy: min {min(r['energy'] for r in rows):.2f} · median {median([r['energy'] for r in rows]):.2f} · "
          f"max {max(r['energy'] for r in rows):.2f}", f"sound density (per 10 s): {', '.join(str(d) for _, d in dens)}", "",
          "## Fixes, most important first", *(f"- **{sev[s]}** {t}" for s, t in issues), *(["- nothing flagged"] if not issues else []),
          "", "## Segments", "| t | shot | move | energy | luma | flags |", "|---|---|---|---|---|---|",
          *(f"| {r['from'] / fps:.2f} | {r['shot']} | {r['move']} | {r['energy']:.2f} | {r['y']:.0f} | {', '.join(r['flags'])} |" for r in rows)]
    (qa / f"polish_{lang}.md").write_text("\n".join(md) + "\n")
    return {"lang": lang, "video": video.name, "issues": len(issues), "high": sum(s == 3 for s, _ in issues),
            "report": str(qa / f"polish_{lang}.md"), "sheet": str(qa / f"polish_sheet_{lang}.jpg") if has_sheet else None,
            "energy_median": round(median([r["energy"] for r in rows]), 2), "sfx_per_10s": [d for _, d in dens]}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("slug")
    ap.add_argument("--lang", nargs="*", default=list(LANGS))
    ap.add_argument("--video", default=None, help="audit this file instead of final/<slug>_<lang>[_preview].mp4 (one --lang)")
    a = ap.parse_args()
    cfg = load_config()
    for lang in a.lang:
        print(json.dumps(audit(a.slug, lang, a.video, cfg)))


if __name__ == "__main__":
    main()
