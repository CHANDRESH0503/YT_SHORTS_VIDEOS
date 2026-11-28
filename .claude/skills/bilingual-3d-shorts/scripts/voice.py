#!/usr/bin/env python3
"""Narration with word timestamps -> audio/<lang>/vo.mp3 + words.json, from one of two providers
(config.json voice.provider, or voice.<lang>.provider for one language, or --provider for one run):
  elevenlabs  ElevenLabs API, per-character timestamps (free tier ~10k chars/month, non-commercial, attribution)
  edge        Microsoft Edge online voices via edge-tts: free, no account, no length limit, real word timings
(references/voice-and-captions.md §Providers; the edge code is in tts_providers.py)

  python3 voice.py credits                       # ElevenLabs characters left this cycle
  python3 voice.py voices [--provider edge|elevenlabs]
  python3 voice.py render <slug> [--lang en ta] [--force] [--provider edge]
  python3 voice.py sample "<text>" --lang ta [--provider edge] [--voice <id>] --out /path/x.mp3   # short audition

After rendering, prints measured duration and updates config chars_per_sec (calibration, running average).
If a render lands slightly over the max duration (<= max_atempo), it is sped up with ffmpeg atempo and all
timestamps are rescaled -- no extra credits spent.

Each language is ONE request for the whole narration (never per beat or per sentence): one take keeps the voice's pitch,
energy and pacing continuous across beats. After rendering it reports the flow: pauses longer than flow.max_gap_sec
and when the hook line ends (hook.max_sec / hook.qa_max_sec), so a choppy or slow-opening take is caught before render.
"""
from __future__ import annotations

import argparse
import base64
import json
import os
import urllib.error
import urllib.request
from pathlib import Path

from common import (LANGS, die, end_card_sec, ffprobe_duration, fmt_cfg, load_beats, load_config, load_env, narration_text,
                    project_dir, run, save_config)
import tts_providers as tp

PROVIDERS = ("elevenlabs", "edge")


def provider_for(cfg: dict, lang: str, override: str | None = None) -> str:
    p = override or cfg["voice"][lang].get("provider") or cfg["voice"].get("provider", "elevenlabs")
    if p not in PROVIDERS:
        die(f"voice provider '{p}' must be one of {PROVIDERS}")
    return p


def synth(text: str, lang: str, cfg: dict, provider: str, voice: str | None = None) -> tuple[bytes, list[dict], str, str, str]:
    """-> (mp3 bytes, words [{text, start, end}] one per whitespace token of text, voice id, model id,
    timing: engine = the TTS itself gave the word times)"""
    if provider == "edge":
        vc = dict(cfg["voice"]["edge"][lang], **({"voice": voice} if voice else {}))
        audio, words = tp.edge_tts_words(text, vc)
        return audio, words, vc["voice"], "edge-tts", "engine"
    vc = cfg["voice"][lang]
    audio, al = tts(text, voice or vc["voice_id"], vc["settings"], cfg)
    return audio, char_words(al), voice or vc["voice_id"], cfg["voice"]["model_id"], "engine"

API = "https://api.elevenlabs.io"


def _key() -> str:
    load_env()
    k = os.environ.get("ELEVENLABS_API_KEY")
    if not k:
        die("ELEVENLABS_API_KEY not set - add it to YT_VIDEOS/.env")
    return k


def _req(method: str, path: str, body: dict | None = None) -> dict:
    data = json.dumps(body).encode() if body is not None else None
    req = urllib.request.Request(API + path, data=data, method=method,
                                 headers={"xi-api-key": _key(), "Content-Type": "application/json", "Accept": "application/json"})
    try:
        with urllib.request.urlopen(req, timeout=300) as r:
            return json.loads(r.read())
    except urllib.error.HTTPError as e:
        die(f"ElevenLabs {method} {path} -> HTTP {e.code}: {e.read().decode(errors='replace')[:600]}")


def credits() -> dict:
    # restricted keys may lack the user_read permission: report unknown instead of failing
    req = urllib.request.Request(API + "/v1/user/subscription", headers={"xi-api-key": _key(), "Accept": "application/json"})
    try:
        with urllib.request.urlopen(req, timeout=60) as r:
            s = json.loads(r.read())
    except urllib.error.HTTPError as e:
        if e.code == 401 and "user_read" in e.read().decode(errors="replace"):
            print("warning: API key lacks user_read permission - credit balance unknown, check it in the ElevenLabs dashboard")
            return {"tier": None, "used": None, "limit": None, "remaining": float("inf"), "resets_unix": None}
        die(f"ElevenLabs subscription check -> HTTP {e.code}")
    used, limit = s.get("character_count", 0), s.get("character_limit", 0)
    return {"tier": s.get("tier"), "used": used, "limit": limit, "remaining": limit - used,
            "resets_unix": s.get("next_character_count_reset_unix")}


def tts(text: str, voice_id: str, settings: dict, cfg: dict) -> tuple[bytes, dict]:
    body = {"text": text, "model_id": cfg["voice"]["model_id"], "voice_settings": settings}
    fmt = cfg["voice"]["output_format"]
    r = _req("POST", f"/v1/text-to-speech/{voice_id}/with-timestamps?output_format={fmt}", body)
    if "audio_base64" not in r or not r.get("alignment"):
        die(f"unexpected ElevenLabs response keys: {list(r)}")
    return base64.b64decode(r["audio_base64"]), r["alignment"]


def words_from_alignment(text: str, al: dict, spans) -> tuple[list[dict], list[dict]]:
    return assign_beats(char_words(al), text, spans)


def char_words(al: dict) -> list[dict]:
    """ElevenLabs per-character alignment -> words split on whitespace."""
    chars = al["characters"]
    st, en = al["character_start_times_seconds"], al["character_end_times_seconds"]
    words, cur, cs = [], "", None
    for i, ch in enumerate(chars):
        if ch.isspace():
            if cur:
                words.append({"text": cur, "start": st[cs], "end": en[i - 1]})
                cur, cs = "", None
            continue
        if cs is None:
            cs = i
        cur += ch
    if cur:
        words.append({"text": cur, "start": st[cs], "end": en[len(chars) - 1]})
    return words


def assign_beats(words: list[dict], text: str, spans) -> tuple[list[dict], list[dict]]:
    # assign beats by word counts of the original text (robust to alignment normalisation)
    counts = [len(text[c0:c1].split()) for _, c0, c1 in spans]
    if sum(counts) != len(words):
        # proportional fallback when tokenisation differs
        scale = len(words) / max(1, sum(counts))
        counts = [max(1, round(c * scale)) for c in counts]
        counts[-1] = max(1, len(words) - sum(counts[:-1]))
    beats_t, i = [], 0
    for (bid, _, _), n in zip(spans, counts):
        ws = words[i:i + n]
        i += n
        for w in ws:
            w["beat"] = bid
        if ws:
            beats_t.append({"id": bid, "start": ws[0]["start"], "end": ws[-1]["end"]})
    for w in words[i:]:
        w["beat"] = spans[-1][0]
    return words, beats_t


def flow_report(words: list[dict], beat_times: list[dict], cfg: dict) -> dict:
    """Pauses that break the narration, and when the hook finishes (video time, incl. preroll)."""
    gap_max = (cfg.get("flow") or {}).get("max_gap_sec", 0.9)
    hc = cfg.get("hook") or {}
    pauses = [{"after": words[i]["text"], "before": words[i + 1]["text"], "at": round(words[i]["end"], 2),
               "gap": round(words[i + 1]["start"] - words[i]["end"], 2)}
              for i in range(len(words) - 1) if words[i + 1]["start"] - words[i]["end"] > gap_max]
    hook_end = round(cfg["video"]["preroll_sec"] + (beat_times[0]["end"] if beat_times else 0), 2)
    warns = [f"{p['gap']}s pause between '{p['after']}' and '{p['before']}' at {p['at']}s - the narration stalls here; "
             f"join the sentences (comma / 'and' / 'so') and re-render" for p in pauses]
    if hook_end > hc.get("qa_max_sec", 4.0):
        warns.append(f"hook line ends at {hook_end}s - it must land by {hc.get('qa_max_sec', 4.0)}s; cut hook words and re-render")
    elif hook_end > hc.get("max_sec", 3.0):
        warns.append(f"hook line ends at {hook_end}s (aim <= {hc.get('max_sec', 3.0)}s)")
    return {"hook_end_sec": hook_end, "long_pauses": pauses, "warnings": warns}


def render_lang(slug: str, lang: str, cfg: dict, force: bool, provider: str | None = None) -> dict:
    pdir = project_dir(slug)
    out_dir = pdir / "audio" / lang
    out_dir.mkdir(parents=True, exist_ok=True)
    if (out_dir / "words.json").exists() and not force:
        print(f"{lang}: already rendered (use --force to spend credits again)")
        return json.loads((out_dir / "words.json").read_text())
    beats = load_beats(pdir)
    dcfg = fmt_cfg(cfg, beats)  # long-form limits (duration, hook) when beats.format == "long"; cfg itself is saved
    text, spans = narration_text(beats, lang)
    vc = cfg["voice"][lang]
    prov = provider_for(cfg, lang, provider)
    if prov == "elevenlabs":
        c = credits()
        if c["remaining"] < len(text):
            die(f"not enough ElevenLabs credits: need {len(text)}, have {c['remaining']} (free option: --provider edge)")
        if len(text) > 10000:
            die(f"{lang}: {len(text)} characters - ElevenLabs takes at most 10,000 per request (one take); use --provider edge")
    audio, raw_words, voice_id, model_id, timing = synth(text, lang, cfg, prov)
    raw = out_dir / "vo_raw.mp3"
    raw.write_bytes(audio)
    words, beat_times = assign_beats(raw_words, text, spans)
    dur = ffprobe_duration(raw)

    # free speed-fit if slightly long
    max_sec = dcfg["duration"]["max"] - cfg["video"]["preroll_sec"] - cfg["video"]["tail_sec"] - end_card_sec(cfg)
    factor = 1.0
    if dur > max_sec and dur / max_sec <= cfg["voice"]["max_atempo"]:
        factor = dur / max_sec
        run(["ffmpeg", "-v", "error", "-y", "-i", str(raw), "-filter:a", f"atempo={factor:.4f}", "-b:a", "192k", str(out_dir / "vo.mp3")])
        for w in words:
            w["start"] /= factor; w["end"] /= factor
        for b in beat_times:
            b["start"] /= factor; b["end"] /= factor
        dur = ffprobe_duration(out_dir / "vo.mp3")
    else:
        (out_dir / "vo.mp3").write_bytes(audio)

    flow = flow_report(words, beat_times, dcfg)
    meta = {"lang": lang, "duration": round(dur, 3), "hook_end_sec": flow["hook_end_sec"], "long_pauses": flow["long_pauses"], "atempo": round(factor, 4), "chars": len(text),
            "provider": prov, "timing": timing, "voice_id": voice_id, "model_id": model_id, "beats": beat_times, "words": words}
    (out_dir / "words.json").write_text(json.dumps(meta, ensure_ascii=False, indent=1))

    # calibrate chars/sec (running average, measured on raw speed)
    measured = len(text) / (dur * factor)
    vc["chars_per_sec"] = round(0.5 * vc["chars_per_sec"] + 0.5 * measured, 2)
    save_config(cfg)
    total = dur + cfg["video"]["preroll_sec"] + cfg["video"]["tail_sec"] + end_card_sec(cfg)
    ok = dcfg["duration"]["min"] <= total <= dcfg["duration"]["max"]
    for w in flow["warnings"]:
        print(f"WARN {lang}: {w}")
    print(json.dumps({"lang": lang, "provider": prov, "vo_sec": round(dur, 2), "video_sec": round(total, 2), "in_range": ok,
                      "hook_end_sec": flow["hook_end_sec"], "long_pauses": len(flow["long_pauses"]),
                      "atempo": round(factor, 3), "chars_spent": len(text), "new_chars_per_sec": vc["chars_per_sec"]}))
    return meta


def main():
    ap = argparse.ArgumentParser()
    sub = ap.add_subparsers(dest="cmd", required=True)
    sub.add_parser("credits")
    vo = sub.add_parser("voices"); vo.add_argument("--provider", choices=PROVIDERS)
    r = sub.add_parser("render"); r.add_argument("slug"); r.add_argument("--lang", nargs="*", default=list(LANGS)); r.add_argument("--force", action="store_true")
    r.add_argument("--provider", choices=PROVIDERS)
    s = sub.add_parser("sample"); s.add_argument("text"); s.add_argument("--lang", default="ta"); s.add_argument("--voice"); s.add_argument("--out", required=True)
    s.add_argument("--provider", choices=PROVIDERS)
    a = ap.parse_args()
    cfg = load_config()
    if a.cmd == "credits":
        print(json.dumps(credits()))
    elif a.cmd == "voices":
        prov = a.provider or cfg["voice"].get("provider", "elevenlabs")
        if prov == "edge":
            print("\n".join(tp.edge_voices()))
        else:
            v = _req("GET", "/v1/voices")
            for x in v.get("voices", []):
                print(f"{x['voice_id']}\t{x.get('category')}\t{x['name']}\t{(x.get('labels') or {}).get('accent', '')}")
    elif a.cmd == "render":
        for lang in a.lang:
            render_lang(a.slug, lang, cfg, a.force, a.provider)
    elif a.cmd == "sample":
        audio, _, vid, _, _ = synth(a.text, a.lang, cfg, provider_for(cfg, a.lang, a.provider), a.voice)
        Path(a.out).write_bytes(audio)
        print(json.dumps({"out": a.out, "voice": vid}))


if __name__ == "__main__":
    main()
