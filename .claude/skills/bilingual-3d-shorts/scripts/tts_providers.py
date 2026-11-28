"""Alternative voice for voice.py (references/voice-and-captions.md §Providers). It returns (mp3 bytes, words) where
words = [{text, start, end}] has exactly one entry per whitespace token of the text sent, in the script's spelling, so
voice.py maps them to beats the same way as for ElevenLabs.

  edge    Microsoft Edge's online neural voices through the `edge-tts` package (python3 -m pip install edge-tts).
          Free, no account, no character limit; real per-word timings (WordBoundary). Unofficial route: it can change
          or stop without notice, and its terms for commercial use are unclear.
(Google Cloud TTS was tried and dropped on 2026-11-28: it needs a billing account even for its free tier.)
"""
from __future__ import annotations

import asyncio
from difflib import SequenceMatcher

from common import die, norm_word


# ---------------------------------------------------------------- word timing helpers
def align_to_script(tokens: list[str], heard: list[tuple[str, float, float]], t0: float, t1: float) -> list[dict]:
    """Give every script token the time of the heard word it matches; unmatched runs share the time between their
    matched neighbours by length (numbers or symbols the engine reads differently)."""
    a = [norm_word(w) for w in tokens]
    b = [norm_word(h[0]) for h in heard]
    times: list[tuple[float, float] | None] = [None] * len(a)
    for blk in SequenceMatcher(None, a, b, autojunk=False).get_matching_blocks():
        for k in range(blk.size):
            times[blk.a + k] = (heard[blk.b + k][1], heard[blk.b + k][2])
    i = 0
    while i < len(a):
        if times[i] is not None:
            i += 1
            continue
        j = i
        while j < len(a) and times[j] is None:
            j += 1
        lo = times[i - 1][1] if i > 0 else t0
        hi = times[j][0] if j < len(a) else t1
        if hi <= lo:
            hi = lo + 0.05 * (j - i)
        L = [max(1, len(a[k])) for k in range(i, j)]
        tot, c = sum(L), lo
        for k, n in zip(range(i, j), L):
            d = (hi - lo) * n / tot
            times[k] = (c, c + d * 0.9)
            c += d
        i = j
    return [{"text": w, "start": round(s, 3), "end": round(e, 3)} for w, (s, e) in zip(tokens, times)]


# ---------------------------------------------------------------- edge
def _edge():
    try:
        import edge_tts  # noqa: PLC0415
    except ImportError:
        die("the edge voice needs the edge-tts package: python3 -m pip install edge-tts")
    return edge_tts


def edge_tts_words(text: str, vc: dict) -> tuple[bytes, list[dict]]:
    edge_tts = _edge()

    async def go():
        c = edge_tts.Communicate(text, vc["voice"], rate=vc.get("rate", "+0%"), pitch=vc.get("pitch", "+0Hz"),
                                 volume=vc.get("volume", "+0%"), boundary="WordBoundary")
        audio, heard = bytearray(), []
        async for ch in c.stream():
            if ch["type"] == "audio":
                audio += ch["data"]
            elif ch["type"] == "WordBoundary":
                heard.append((ch["text"], ch["offset"] / 1e7, (ch["offset"] + ch["duration"]) / 1e7))
        return bytes(audio), heard

    err = None
    for _ in range(2):  # one retry: the service drops a connection now and then
        try:
            audio, heard = asyncio.run(go())
            break
        except Exception as e:  # noqa: BLE001
            err = e
    else:
        die(f"edge voice '{vc['voice']}' failed ({type(err).__name__}: {str(err)[:200]}). The 'Multilingual' voices return "
            "no audio; use a plain one (voice.py voices --provider edge), or switch provider (--provider elevenlabs)")
    if not heard:
        die("edge returned audio but no word timings - update edge-tts (python3 -m pip install -U edge-tts)")
    return audio, align_to_script(text.split(), heard, 0.0, heard[-1][2])


def edge_voices(langs=("en", "ta")) -> list[str]:
    edge_tts = _edge()
    vs = asyncio.run(edge_tts.list_voices())
    pre = tuple(f"{l}-" for l in langs)
    return [f"{v['ShortName']}\t{v['Gender']}\t{', '.join(v.get('VoiceTag', {}).get('VoicePersonalities', []))}"
            for v in vs if v["ShortName"].startswith(pre)]
