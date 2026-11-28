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
from pathlib import Path

from common import (ASSETS_DIR, CLIP_EXTS, IMG_EXTS, LANGS, ROOT, die, end_card_sec, ffprobe_duration, find_file, fmt_cfg, load_beats,
                    load_config, norm_word, project_dir)

ALT_MOVE = {"push_in": "pull_out", "pull_out": "push_in", "pan_left": "pan_right", "pan_right": "pan_left",
            "tilt_up": "tilt_down", "tilt_down": "tilt_up", "orbit_left": "orbit_right", "orbit_right": "orbit_left",
            "static_drift": "push_in"}
OVERLAY_COLORS = {"number": "#E8F1F5", "icon": "#FFFFFF", "label": "#7DF9FF", "hook": "#FFD43B"}
INFOGRAPHICS = ("counter", "gauge", "compare", "scale", "pin")   # Infographic.tsx; colour = the video's accent
END_PUNCT = tuple(".?!,;:…।")
AUDIO_EXTS = (".wav", ".mp3", ".m4a", ".aac", ".ogg")


def pick_grade(beats: dict, cfg: dict) -> tuple[str, dict]:
    """One colour grade per video: visual_plan.grade, else the faceless style's default, else teal."""
    presets = cfg.get("grade_presets") or {}
    vp = beats.get("visual_plan") or {}
    by_style = cfg.get("grade_by_style") or {}
    name = vp.get("grade") or (by_style.get(vp.get("faceless_style")) if vp.get("mode") in ("faceless", "hybrid")
                               and vp.get("faceless_style") else None) or by_style.get("_default", "teal")
    if name not in presets:
        if vp.get("grade"):
            die(f"visual_plan.grade '{name}' not in config.grade_presets ({', '.join(presets)})")
        return "legacy", cfg["grade"]
    return name, {"grain": 0.05, **presets[name]}


def duck_curve(words: list, pre: float, fps: int, total: int, ramp: int = 9, hold: float = 1.2) -> list[list[float]]:
    """Music gain keyframes [frame, gain]: ducked (0) under speech and through normal sentence pauses (<= hold s),
    back up only in real gaps, ~300 ms ramps. Swelling in every sentence gap made the narration sound stop-start."""
    spans = []
    for w in words:
        s, e = int(round((pre + w["start"]) * fps)), int(round((pre + w["end"]) * fps))
        if spans and s - spans[-1][1] <= int(hold * fps):
            spans[-1][1] = max(spans[-1][1], e)
        else:
            spans.append([s, e])
    pts = [[0, 1.0]]
    for s, e in spans:
        a = max(s - ramp, pts[-1][0] + 1)
        if a >= s:
            s = a + 1
        pts += [[a, 1.0], [s, 0.0], [max(e, s + 1), 0.0], [max(e, s + 1) + ramp, 1.0]]
    if pts[-1][0] < total:
        pts.append([total, 1.0])
    return pts


def find_word(words: list, beat_id: str, trig: str | None, pre: float, fps: int) -> int | None:
    """Frame where the first word of `trig` is spoken inside beat `beat_id` (None if not found)."""
    key = norm_word(trig.split()[0]) if trig else ""
    for w in words:
        if key and w.get("beat") == beat_id and norm_word(w["text"]).startswith(key):
            return int(round((pre + w["start"]) * fps))
    return None


def resolve(v, lang: str):
    """{en, ta} -> that language's value; anything else as is."""
    return v.get(lang, v.get("en")) if isinstance(v, dict) and set(v) & {"en", "ta"} else v


def pin_track(pdir, segs: list, shot_id: str, pin_id: str, f0: int, dur: int, fps: int) -> list | None:
    """Screen track [[k, x, y, visible], ...] (k = frame from overlay start, x/y 0..1) of a 3D point logged by film.js pin()
    in clips/<shot>.pins.json, mapped through the clip's trim/speed and the Shot layer's 1.02->1.07 clip scale."""
    pf = pdir / "clips" / f"{shot_id}.pins.json"
    if not pf.exists():
        return None
    track = json.loads(pf.read_text()).get(pin_id)
    if not track:
        return None
    out = []
    for k in range(dur):
        f = f0 + k
        sg = next((s for s in segs if s["shot"] == shot_id and s["from"] <= f < s["from"] + s["dur"] and s["clip"]), None)
        if not sg or f - sg["from"] >= sg["clip"]["frames"]:
            out.append([k, 0.5, 0.5, 0])
            continue
        ct = (sg["clip"]["startFrom"] + (f - sg["from"]) * sg["clip"]["playbackRate"]) / fps
        i = min(range(len(track)), key=lambda j: abs(track[j][0] - ct))
        _, x, y, vis = track[i]
        sc = 1.02 + 0.05 * (f - sg["from"]) / max(1, sg["dur"])
        out.append([k, round(0.5 + (x - 0.5) * sc, 4), round(0.5 + (y - 0.5) * sc, 4), vis])
    return out


def music_file(spec: str | None, mood: str | None, music_cfg) -> "Path | None":
    """A track: an exact file under assets/music/ (spec), else the first file of the mood folder."""
    if spec:
        c = ASSETS_DIR / "music" / spec
        return c if c.exists() else None
    if mood and (ASSETS_DIR / "music" / mood).is_dir():
        cands = sorted((ASSETS_DIR / "music" / mood).glob("*"))
    elif music_cfg == "auto":
        cands = sorted(f for d in (ASSETS_DIR / "music").iterdir() if d.is_dir() and d.name != "stingers" for f in d.glob("*"))
    else:
        cands = [ASSETS_DIR / "music" / music_cfg]
    return next((c for c in cands if c.suffix.lower() in AUDIO_EXTS and c.exists()), None)


def build(slug: str, lang: str, cfg: dict) -> dict:
    pdir = project_dir(slug)
    beats = load_beats(pdir)
    cfg = fmt_cfg(cfg, beats)  # long-form shot length / hook limits when beats.format == "long"
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
    grade_name, grade = pick_grade(beats, cfg)
    accent = (beats.get("visual_plan") or {}).get("accent") or grade.get("accent") or "#FFD43B"
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
            text = resolve(ov.get("text", ""), lang) or ""
            kind = ov["kind"]
            d = int(ov["dur_sec"] * fps) if ov.get("dur_sec") else (int(ov_dur * 1.5) if kind in INFOGRAPHICS else ov_dur)
            o = {"from": max(0, at), "dur": min(d, total - at), "text": text, "kind": kind,
                 "color": ov.get("color", accent if kind in INFOGRAPHICS else OVERLAY_COLORS[kind]), "seg": ov.get("seg")}
            if kind in INFOGRAPHICS:
                data = {k: resolve(v, lang) for k, v in ov.items() if k not in ("kind", "trigger", "text", "color", "dur_sec", "seg")}
                if kind == "compare":
                    data["items"] = [{"label": resolve(it.get("label", ""), lang), "value": it["value"]} for it in ov.get("items", [])]
                if kind == "pin":
                    tr = pin_track(pdir, segs, s["id"], ov.get("pin", ""), o["from"], o["dur"], fps)
                    if tr is None:
                        print(f"WARN {lang}: {s['id']} pin '{ov.get('pin')}' has no clips/{s['id']}.pins.json track - "
                              "call pin() in shots.js and re-export; the label sits at the fallback point")
                    data["track"] = tr
                o["data"] = data
            overlays.append(o)

    # ---- hook title: 3-6 words on screen from frame 0 (sound-off viewers), held until the spoken hook lands ----
    hc = cfg.get("hook") or {}
    ht = (beats.get("hook_text") or {}).get(lang)
    if ht:
        b1 = btimes.get(beats["beats"][0]["id"])
        end = F(pre + b1["end"] + 0.3) if b1 else F(hc.get("text_min_sec", 2.0))
        end = max(F(hc.get("text_min_sec", 2.0)), min(end, F(hc.get("text_max_sec", 3.5))))
        for o in overlays:  # other callouts wait until the title clears (they share the upper zone)
            if o["from"] < end:
                o["dur"] = max(12, o["dur"] - (end - o["from"]))
                o["from"] = end
        overlays.insert(0, {"from": 0, "dur": end, "text": ht, "kind": "hook", "color": OVERLAY_COLORS["hook"], "seg": None})

    # ---- sfx + music (copied into project so they are inside the Remotion public dir) ----
    sfx_dir = pdir / "sfx"
    sfx_dir.mkdir(exist_ok=True)
    for f in (ASSETS_DIR / "sfx").glob("*.wav"):
        if not (sfx_dir / f.name).exists():
            shutil.copy2(f, sfx_dir / f.name)
    vol = cfg["audio"]["sfx"]
    sfx = []
    # ---- foley: per-shot close-up sounds on their trigger word (assets/sfx/foley/<name>.*) ----
    foley_dir = ASSETS_DIR / "sfx" / "foley"
    foley_missing = []
    for b in beats["beats"]:
        for s in b["shots"]:
            for fx in s.get("sfx") or []:
                src = next((f for f in sorted(foley_dir.glob(f"{fx['name']}.*")) if f.suffix.lower() in AUDIO_EXTS), None)
                if not src:
                    foley_missing.append(fx["name"])
                    continue
                (sfx_dir / "foley").mkdir(exist_ok=True)
                if not (sfx_dir / "foley" / src.name).exists():
                    shutil.copy2(src, sfx_dir / "foley" / src.name)
                at = first_seg[s["id"]]["from"] + 6
                trig = (fx.get("trigger") or {}).get(lang)
                if trig:
                    key = norm_word(trig.split()[0])
                    for w in words:
                        if w.get("beat") == b["id"] and key and norm_word(w["text"]).startswith(key):
                            at = F(pre + w["start"]) + int(fx.get("offset_frames", 0)) + F(fx.get("offset_ms", 0) / 1000)
                            break
                sfx.append({"from": max(0, at), "src": f"sfx/foley/{src.name}", "volume": float(fx.get("volume", vol.get("foley", 0.6)))})
    if foley_missing:
        print(f"WARN {lang}: foley sounds not found in assets/sfx/foley/: {', '.join(sorted(set(foley_missing)))} (see assets/DOWNLOADS.md)")
    speech = [(F(pre + w["start"]), F(pre + w["end"])) for w in words]
    under = (cfg.get("flow") or {}).get("whoosh_under_voice", 1.0)

    def on_speech(f0: int, f1: int) -> bool:
        return any(a < f1 and f0 < b for a, b in speech)

    for i, sg in enumerate(segs):
        if sg["transition"] in ("whip_left", "whip_right", "zoom"):
            name = "whoosh" if sg["transition"] != "zoom" else "whoosh2"
            at = max(0, sg["from"] - 5)
            v = vol["whoosh"] * (under if on_speech(at, at + 12) else 1.0)  # a loud whoosh mid-word breaks the sentence
            sfx.append({"from": at, "src": f"sfx/{name}.wav", "volume": round(v, 3)})
        if sg["transition"] == "flash":
            sfx.append({"from": max(0, sg["from"] - 42), "src": "sfx/riser.wav", "volume": vol["riser"]})
            sfx.append({"from": sg["from"], "src": "sfx/impact.wav", "volume": vol["impact"]})
            if (sfx_dir / "subdrop.wav").exists():   # sweetener: low sub under the hit, felt more than heard
                sfx.append({"from": sg["from"], "src": "sfx/subdrop.wav", "volume": vol.get("subdrop", 0.5)})
    for o in overlays:
        if o["kind"] in ("counter", "gauge") and (sfx_dir / "tick.wav").exists():
            # ticks while the number / needle runs (Infographic.tsx counts over the first ~55% of the callout), then a pop
            run_f = int(o["dur"] * 0.55)
            for k in range(6, run_f, 3):
                sfx.append({"from": o["from"] + k, "src": "sfx/tick.wav", "volume": round(vol.get("tick", 0.3) * (0.6 + 0.4 * k / run_f), 3)})
            sfx.append({"from": o["from"] + run_f, "src": "sfx/pop.wav", "volume": vol["pop"]})
        else:
            sfx.append({"from": o["from"], "src": "sfx/pop.wav", "volume": vol["pop"]})
    sfx.append({"from": max(0, total - int(tail * fps) - 6), "src": "sfx/ding.wav", "volume": vol["ding"]})

    # ---- music, scored to the story: segments with cues (switch mood / drop out before the twist / stinger on the payoff) ----
    music = []
    m = cfg["audio"]["music"]
    beat_start = {b["id"]: w0 for (w0, _), b in zip(windows, beats["beats"])}
    first_word = lambda bid: next((F(pre + w["start"]) for w in words if w.get("beat") == bid), beat_start.get(bid, 0))  # noqa: E731
    if m and beats.get("music_mood") != "none":
        mc = cfg["audio"].get("music_cues") or {}
        duck_pts = duck_curve(words, pre, fps, total, (cfg.get("flow") or {}).get("duck_ramp_frames", 9),
                              (cfg.get("flow") or {}).get("duck_hold_sec", 1.2))
        base = music_file(beats.get("music"), beats.get("music_mood"), m)
        cues = list(beats.get("music_cues") or [])
        # default score: drop the bed out just before the first twist line, back in on its first word, unless a
        # drop/switch cue already sits on that beat or beats.music_auto_drop is false
        tw = next((b["id"] for b in beats["beats"] if b.get("role") == "twist"), None)
        if tw and mc.get("auto_drop", True) and beats.get("music_auto_drop", True) and \
                not any(c.get("at_beat") == tw and c.get("mode", "switch") != "stinger" for c in cues):
            cues.append({"at_beat": tw, "mode": "drop"})
        # list of (frame, track, fade_frames) changes; drops are gaps
        tracks = []   # [{"file", "from", "to", "fadeIn", "fadeOut"}]
        cur = {"file": base, "from": 0, "fadeIn": 10} if base else None
        for c in sorted(cues, key=lambda c: beat_start.get(c.get("at_beat"), 10 ** 9)):
            if c.get("at_beat") not in beat_start:
                print(f"WARN {lang}: music cue at_beat '{c.get('at_beat')}' is not a beat id - skipped")
                continue
            at = find_word(words, c["at_beat"], (c.get("trigger") or {}).get(lang), pre, fps) or first_word(c["at_beat"])
            mode = c.get("mode", "switch")
            if mode == "stinger":
                st = music_file(c.get("file"), c.get("mood", "stingers"), None)
                if st:
                    (sfx_dir / "stingers").mkdir(exist_ok=True)
                    shutil.copy2(st, sfx_dir / "stingers" / st.name)
                    sfx.append({"from": max(0, at - int(c.get("lead_frames", 2))), "src": f"sfx/stingers/{st.name}",
                                "volume": float(c.get("volume", vol.get("stinger", 0.5)))})
                else:
                    print(f"WARN {lang}: no stinger in assets/music/stingers/ (python3 sfx.py makes a stopgap)")
                continue
            if mode == "drop" and cur:
                gap = F(c.get("drop_sec", mc.get("drop_sec", 0.6)))
                tracks.append({**cur, "to": max(cur["from"] + 1, at - gap), "fadeOut": 8})
                cur = {"file": cur["file"], "from": at, "fadeIn": 4, "resume": True}
            elif mode == "switch":
                nf = music_file(c.get("file"), c.get("mood"), None)
                if not nf:
                    print(f"WARN {lang}: music cue switch to '{c.get('file') or c.get('mood')}' found no file - skipped")
                    continue
                xf = int(c.get("xfade_frames", 15))
                if cur:
                    tracks.append({**cur, "to": at + xf, "fadeOut": xf})
                cur = {"file": nf, "from": at, "fadeIn": xf}
        if cur:
            tracks.append({**cur, "to": total, "fadeOut": 30})
        copied = {}
        for tr in tracks:
            f = tr["file"]
            if f not in copied:
                dst = sfx_dir / f"music{len(copied) or ''}{f.suffix.lower()}"
                shutil.copy2(f, dst)   # always refresh, so a changed mood/track takes effect
                copied[f] = f"sfx/{dst.name}"
            music.append({"src": copied[f], "from": tr["from"], "dur": max(1, tr["to"] - tr["from"]),
                          # a drop resumes the same track where it would have been (wrapped: the track loops)
                          "trimBefore": tr["from"] % max(1, F(ffprobe_duration(f))) if tr.get("resume") else 0,
                          "fadeIn": tr["fadeIn"], "fadeOut": tr["fadeOut"], "volume": cfg["audio"]["music_volume"],
                          "duck": cfg["audio"].get("music_duck", 1.0), "duckCurve": duck_pts})

    # ---- ambience beds (room tone per beat: beats[].ambience = a name in assets/sfx/ambience/) ----
    beds = []
    amb_dir = ASSETS_DIR / "sfx" / "ambience"
    for (w0, w1), b in zip(windows, beats["beats"]):
        name = b.get("ambience") or beats.get("ambience")
        if not name or name == "none":
            continue
        src = next((f for f in sorted(amb_dir.glob(f"{name}.*")) if f.suffix.lower() in AUDIO_EXTS), None)
        if not src:
            print(f"WARN {lang}: ambience '{name}' not in assets/sfx/ambience/ (python3 sfx.py makes stopgaps; assets/DOWNLOADS.md)")
            continue
        (sfx_dir / "ambience").mkdir(exist_ok=True)
        shutil.copy2(src, sfx_dir / "ambience" / src.name)
        if beds and beds[-1]["src"].endswith("/" + src.name) and beds[-1]["from"] + beds[-1]["dur"] >= w0:
            beds[-1]["dur"] = w1 - beds[-1]["from"]   # same bed continues across beats
        else:
            beds.append({"src": f"sfx/ambience/{src.name}", "from": w0, "dur": w1 - w0, "fade": 6,
                         "volume": vol.get("ambience", 0.35), "duck": cfg["audio"].get("ambience_duck", 0.6)})
    duck_pts_all = music[0]["duckCurve"] if music else duck_curve(words, pre, fps, total)
    for bd in beds:
        bd["duckCurve"] = duck_pts_all

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
        if music:   # the score plays out under the end card
            music[-1]["dur"] = total - music[-1]["from"]

    cap = cfg["captions"]
    # clip already graded in-engine (film.js LUT) for every shot -> Remotion's tint only unifies
    if segs and all(sg["clip"] for sg in segs) and grade.get("engine") and (pdir / "faceless" / "look.json").exists() \
            and (beats.get("visual_plan") or {}).get("mode") == "faceless":
        grade = {**grade, "tint_opacity": round(grade.get("tint_opacity", 0) * grade.get("in_engine_tint_scale", 1), 3), "in_engine": True}
    grade = {k: v for k, v in grade.items() if k not in ("engine", "in_engine_tint_scale")}
    return {
        "lang": lang, "fps": fps, "width": V["width"], "height": V["height"], "durationInFrames": total,
        "vo": {"src": f"audio/{lang}/vo.mp3", "from": F(pre)},
        "segments": segs, "captions": captions, "overlays": overlays, "sfx": sfx, "music": music, "beds": beds, "endCard": end_card,
        "captionStyle": {"font": cc["font"], "weight": cc["weight"], "size": cc["size"], "yPercent": cap["y_percent"],
                         "maxWidthPercent": cap["max_width_percent"], "color": cap["color"],
                         "highlight": cap["highlight_color"], "stroke": cap["stroke_px"], "shadow": cap["shadow"]},
        "overlayStyle": {"yPercent": cfg["overlay"]["y_percent"], "size": cfg["overlay"]["size"]},
        "grade": grade, "gradeName": grade_name, "accent": accent,
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
                          "overlays": len(tl["overlays"]), "end_card": bool(tl["endCard"]), "grade": tl["gradeName"],
                          "music": [f"{m['src']}@{m['from'] / tl['fps']:.1f}s" for m in tl["music"]] or None,
                          "beds": len(tl["beds"]), "sfx": len(tl["sfx"]),
                          "sfx_per_10s": round(len(tl["sfx"]) / (tl["durationInFrames"] / tl["fps"]) * 10, 1),
                          "foley": sum(1 for s in tl["sfx"] if "/foley/" in s["src"]),
                          "infographics": sum(1 for o in tl["overlays"] if o["kind"] in INFOGRAPHICS)}))


if __name__ == "__main__":
    main()
