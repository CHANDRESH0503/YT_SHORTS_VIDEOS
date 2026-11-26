# Voice & captions

## ElevenLabs (free tier)
- ~10,000 characters / month. One bilingual video ≈ 700-900 EN + 900-1,300 TA chars ≈ **~1,900 chars** → ~5 videos/month.
- **Free tier = non-commercial + attribution required.** Every `metadata_*.md` must include the attribution line
  ("Voice generated with ElevenLabs" / "குரல்: ElevenLabs") and the videos must not be monetized. Audio generated on the
  free plan stays non-commercial even after upgrading – regenerate on a paid plan before monetizing.
- Endpoint: `POST /v1/text-to-speech/{voice_id}/with-timestamps` → `audio_base64` + per-character `alignment`.
  `voice.py` groups characters into words on whitespace and maps them back to beats by word count.
- Model: `eleven_multilingual_v2` (supports Tamil, stable alignment). `eleven_v3` is more expressive; switch in
  config.json `voice.model_id` only after `voice.py sample` confirms Tamil quality + timestamps on your key.
- Free tier API can use **premade voices** only (library voices need a paid plan). `python3 voice.py voices` lists them.
  Audition Tamil before the first real video: `python3 voice.py sample "<one Tamil sentence>" --lang ta --voice <id> --out /tmp/x.mp3`
  (costs ~60 chars). Put the chosen ids into `config.json → voice.en.voice_id / voice.ta.voice_id`.
- Settings: stability 0.40-0.45 (lively), similarity 0.8, style 0.25-0.3, speed 1.05-1.08.
- Never re-render to fix small length overruns: `voice.py` speeds up ≤10% with `atempo` for free and rescales timings.
- Credits are checked before every render; a render is refused if credits are insufficient.

## Captions
- Built from real word timings (no guessing). EN: up to 3 words / 18 chars per chunk; TA: up to 2 words / 16 chars.
- Chunks break at sentence punctuation and at beat boundaries; trailing commas/periods are hidden, ?/! kept.
- Style: white, heavy weight, black stroke + soft shadow, no box, pop-in spring, centered at 70% height
  (keeps clear of the Shorts title/description area and the right-side action buttons).
- Tamil uses Noto Sans Tamil (Google Fonts, loaded by Remotion → Chromium/HarfBuzz shaping = correct conjuncts and vowel signs).
- `final/<slug>_<lang>.srt` is also written: upload the *other* language's SRT as a CC track on each video
  (Tamil video gets English CC and vice versa).
