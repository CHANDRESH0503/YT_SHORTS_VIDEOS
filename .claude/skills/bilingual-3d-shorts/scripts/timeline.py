#!/usr/bin/env python3
"""Build per-language Remotion timelines (all times in frames) from beats.json + audio/<lang>/words.json.

  python3 timeline.py <slug> [--lang en ta]

Same visuals for both languages; cut points follow each language's own narration timing.
Shots use clips/Sxx.mp4 when present (trimmed or slowed to >=0.8x), otherwise keyframes/Sxx.* with a 2.5D move.
Every video ends with the channel end card (config.json -> end_card): that language's channel logo + a subscribe ask.
"""
from __future__ import annotations

import argparse
import json
import math
import shutil

from common import (ASSETS_DIR, CLIP_EXTS, IMG_EXTS, LANGS, ROOT, die, end_card_sec, ffprobe_duration, find_file, load_beats,
                    load_config, norm_word, project_dir)

ALT_MOVE = {"push_in": "pull_out", "pull_out": "push_in", "pan_left": "pan_right", "pan_right": "pan_left",
            "tilt_up": "tilt_down", "tilt_down": "tilt_up", "orbit_left": "orbit_right", "orbit_right": "orbit_left",
            "static_drift": "push_in"}
OVERLAY_COLORS = {"number": "#E8F1F5", "icon": "#FFFFFF", "label": "#7DF9FF"}
END_PUNCT = tuple(".?!,;:…।")


def build(slug: str, lang: str, cfg: dict) -> dict:
    pdir = project_dir(slug)
    beats = load_beats(pdir)
    wfile = pdir / "audio" / lang / "words.json"
    if not wfile.exists():
        die(f"{wfile} missing - run voice.py render {slug} --lang {lang}")
    vo = json.loads(wfile.read_text())
    V = cfg["video"]
    fps = V["fps"]
    F = lambda t: int(round(t * fps))  # noqa: E731
    pre, tail = V["preroll_sec"], V["tail_sec"]
    total = F(pre + vo["duration"] + tail)  # end of narration + tail; the end card is appended after this
    words = vo["words"]

    # ---- beat windows (frames) ----
    btimes = {b["id"]: b for b in vo["beats"]}
    starts = []
    for i, b in enumerate(beats["beats"]):
        if i == 0:
            starts.append(0)
        elif b["id"] in btimes:
            starts.append(F(pre + btimes[b["id"]]["start"]) - 2)  # cut lands just before the first word
        else:
            die(f"{lang}: beat {b['id']} has no aligned words")
    windows = [(starts[i], starts[i + 1] if i + 1 < len(starts) else total) for i in range(len(starts))]

    # ---- shot segments ----
    segs, clip_state = [], {}
    max_f = int(V["max_shot_sec"] * fps)
    whip = 0
    for (b0, b1), b in zip(windows, beats["beats"]):
        shots = b["shots"]
        wts = [s.get("weight", 1.0) for s in shots]
        edges = [b0]
        for w in wts[:-1]:
            edges.append(edges[-1] + int((b1 - b0) * w / sum(wts)))
        edges.append(b1)
        for si, s in enumerate(shots):
            s0, s1 = edges[si], edges[si + 1]
            n = max(1, math.ceil((s1 - s0) / max_f))
            sub = [s0 + (s1 - s0) * k // n for k in range(n + 1)]
            img = find_file(pdir / "keyframes", s["id"], IMG_EXTS)
            if not img:
                die(f"keyframe for {s['id']} missing - make it in Nano Banana (keyframes/NANO_BANANA.md), then keyframes.py {slug} --check")
            clip = find_file(pdir / "clips", s["id"], CLIP_EXTS)
            if clip and s["id"] not in clip_state:
                clip_state[s["id"]] = {"dur": ffprobe_duration(clip), "used": 0.0}
            for k in range(n):
                f0, f1 = sub[k], sub[k + 1]
                d = (f1 - f0) / fps
                move = s["camera_move"] if k % 2 == 0 else ALT_MOVE.get(s["camera_move"], "push_in")
                if not segs:
                    tr = "cut"
                elif k > 0:
                    tr = "punch"
                elif si == 0 and b["role"] in ("twist", "payoff"):
                    tr = "flash"
                elif si == 0:
                    tr = "zoom"
                else:
                    tr = "whip_left" if whip % 2 == 0 else "whip_right"
                    whip += 1
                seg = {"shot": s["id"], "beat": b["id"], "from": f0, "dur": f1 - f0, "move": move,
                       "transition": tr, "image": f"keyframes/{img.name}", "clip": None}
                if clip:
                    st = clip_state[s["id"]]
                    avail = st["dur"] - st["used"] - 0.05
                    if avail > 0.4:
                        rate = 1.0 if avail >= d else max(0.8, avail / d)
                        play_f = min(f1 - f0, int(avail / rate * fps))
                        seg["clip"] = {"src": f"clips/{clip.name}", "startFrom": int(st["used"] * fps),
                                       "playbackRate": round(rate, 3), "frames": play_f}
                        st["used"] += play_f / fps * rate
                segs.append(seg)

    # ---- captions ----
    cc = cfg["captions"][lang]
    chunks, cur = [], []

    def flush():
        if cur:
            chunks.append(list(cur)); cur.clear()

    for i, w in enumerate(words):
        if cur and (len(cur) >= cc["max_words"] or w.get("beat") != cur[-1].get("beat")
                    or len(" ".join(x["text"] for x in cur + [w])) > cc["max_chars"]):
            flush()
        cur.append(w)
        if w["text"].endswith(END_PUNCT):
            flush()
    flush()
    captions = []
    for i, ch in enumerate(chunks):
        c_from = F(pre + ch[0]["start"])
        nxt = F(pre + chunks[i + 1][0]["start"]) if i + 1 < len(chunks) else total
        c_to = min(nxt, F(pre + ch[-1]["end"] + 0.45))
        c_to = max(c_to, c_from + 6)
        clean = lambda t: t.rstrip(".,;:…।") if not t.endswith(("?", "!")) else t  # noqa: E731
        captions.append({"from": c_from, "to": c_to, "text": " ".join(clean(w["text"]) for w in ch),
                         "words": [{"text": clean(w["text"]), "from": F(pre + w["start"]), "to": F(pre + w["end"])} for w in ch]})

    # ---- overlays ----
    overlays, ov_dur = [], int(cfg["overlay"]["dur_sec"] * fps)
    first_seg = {}
    for sg in segs:
        first_seg.setdefault(sg["shot"], sg)
    for b in beats["beats"]:
        for s in b["shots"]:
            ov = s.get("overlay")
            if not ov:
                continue
            sg = first_seg[s["id"]]
            at = sg["from"] + 9
            trig = (ov.get("trigger") or {}).get(lang)
            if trig:
                key = norm_word(trig.split()[0])
                for w in words:
                    if w.get("beat") == b["id"] and key and norm_word(w["text"]).startswith(key):
                        at = F(pre + w["start"]) - 2
                        break
            text = ov["text"][lang] if isinstance(ov.get("text"), dict) else ov.get("text", "")
            d = int(ov["dur_sec"] * fps) if ov.get("dur_sec") else ov_dur
            overlays.append({"from": max(0, at), "dur": min(d, total - at), "text": text, "kind": ov["kind"],
                             "color": ov.get("color", OVERLAY_COLORS[ov["kind"]]), "seg": ov.get("seg")})

    # ---- sfx + music (copied into project so they are inside the Remotion public dir) ----
    sfx_dir = pdir / "sfx"
    sfx_dir.mkdir(exist_ok=True)
    for f in (ASSETS_DIR / "sfx").glob("*.wav"):
        if not (sfx_dir / f.name).exists():
            shutil.copy2(f, sfx_dir / f.name)
    vol = cfg["audio"]["sfx"]
    sfx = []
    for i, sg in enumerate(segs):
        if sg["transition"] in ("whip_left", "whip_right", "zoom"):
            name = "whoosh" if sg["transition"] != "zoom" else "whoosh2"
            sfx.append({"from": max(0, sg["from"] - 5), "src": f"sfx/{name}.wav", "volume": vol["whoosh"]})
        if sg["transition"] == "flash":
            sfx.append({"from": max(0, sg["from"] - 42), "src": "sfx/riser.wav", "volume": vol["riser"]})
            sfx.append({"from": sg["from"], "src": "sfx/impact.wav", "volume": vol["impact"]})
    for o in overlays:
        sfx.append({"from": o["from"], "src": "sfx/pop.wav", "volume": vol["pop"]})
    sfx.append({"from": max(0, total - int(tail * fps) - 6), "src": "sfx/ding.wav", "volume": vol["ding"]})

    music = None
    m = cfg["audio"]["music"]
    if m:
        cands = sorted((ASSETS_DIR / "music").glob("*")) if m == "auto" else [ASSETS_DIR / "music" / m]
        cands = [c for c in cands if c.suffix.lower() in (".mp3", ".wav", ".m4a", ".aac") and c.exists()]
        if cands:
            dst = sfx_dir / f"music{cands[0].suffix.lower()}"
            if not dst.exists():
                shutil.copy2(cands[0], dst)
            music = {"src": f"sfx/{dst.name}", "volume": cfg["audio"]["music_volume"]}

    # ---- end card: channel logo + subscribe ask, appended after the last shot ----
    end_card = None
    if end_card_sec(cfg):
        ec = cfg["end_card"]
        logo = ROOT / ec["logo"][lang]
        if not logo.exists():
            die(f"end card logo missing: {logo} - put the {lang} channel icon there or fix config.json end_card.logo")
        (pdir / "brand").mkdir(exist_ok=True)
        dst = pdir / "brand" / f"logo_{lang}{logo.suffix.lower()}"
        shutil.copy2(logo, dst)
        end_card = {"from": total, "dur": F(end_card_sec(cfg)), "logo": f"brand/{dst.name}",
                    "channel": ec["channel"][lang], "cta": ec["cta"][lang], "subline": ec.get("subline", {}).get(lang, "")}
        sfx.append({"from": total, "src": "sfx/whoosh2.wav", "volume": vol["whoosh"]})
        sfx.append({"from": total + 14, "src": "sfx/pop.wav", "volume": vol["pop"]})
        total += end_card["dur"]

    cap = cfg["captions"]
    return {
        "lang": lang, "fps": fps, "width": V["width"], "height": V["height"], "durationInFrames": total,
        "vo": {"src": f"audio/{lang}/vo.mp3", "from": F(pre)},
        "segments": segs, "captions": captions, "overlays": overlays, "sfx": sfx, "music": music, "endCard": end_card,
        "captionStyle": {"font": cc["font"], "weight": cc["weight"], "size": cc["size"], "yPercent": cap["y_percent"],
                         "maxWidthPercent": cap["max_width_percent"], "color": cap["color"],
                         "highlight": cap["highlight_color"], "stroke": cap["stroke_px"], "shadow": cap["shadow"]},
        "overlayStyle": {"yPercent": cfg["overlay"]["y_percent"], "size": cfg["overlay"]["size"]},
        "grade": cfg["grade"],
    }


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("slug")
    ap.add_argument("--lang", nargs="*", default=list(LANGS))
    a = ap.parse_args()
    cfg = load_config()
    pdir = project_dir(a.slug)
    for lang in a.lang:
        tl = build(a.slug, lang, cfg)
        (pdir / f"timeline_{lang}.json").write_text(json.dumps(tl, ensure_ascii=False, indent=1))
        segs = tl["segments"]
        print(json.dumps({"lang": lang, "seconds": round(tl["durationInFrames"] / tl["fps"], 2), "segments": len(segs),
                          "max_seg_sec": round(max(s["dur"] for s in segs) / tl["fps"], 2),
                          "clip_segments": sum(1 for s in segs if s["clip"]), "captions": len(tl["captions"]),
                          "overlays": len(tl["overlays"]), "end_card": bool(tl["endCard"])}))


if __name__ == "__main__":
    main()
