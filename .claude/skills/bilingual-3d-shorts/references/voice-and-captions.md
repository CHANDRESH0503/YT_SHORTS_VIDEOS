# Voice & captions

## ElevenLabs (free tier)
- ~10,000 characters / month. A ~45 s bilingual video ≈ 750 EN + 800 TA chars ≈ **~1,600 chars** → ~6 videos/month;
  a 90 s one ≈ 1,350 + 1,400 ≈ **~2,800 chars** → ~3 videos/month. Another reason to use the shortest length that explains it.
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
- **One take per language.** voice.py sends the whole narration (all beats joined) in a single request, so pitch, energy and
  pace stay continuous. Never render beats or sentences separately and stitch them: that is what makes AI narration sound
  disjointed. Continuity problems are then fixed in the **text** (script-playbook §2d), not in the audio.
- Settings: stability 0.50-0.52, similarity 0.8, style 0.12-0.15, speed 1.02-1.04 (2026-11-28). ElevenLabs suggests starting at
  stability ~0.5 and style 0: lower stability and higher style give more varied delivery, but the voice then swings in pitch and
  energy from sentence to sentence, which sounds like separate takes. The older lively settings (0.40 / 0.3 / 1.08), plus
  atempo, sounded rushed and uneven.
- Punctuation drives pacing: a full stop is a ~0.4-0.8 s stop, a comma or em-dash a short breath. Use full stops only where a
  speaker would really stop; join the rest (§2d). Write ALL-CAPS words in lower case.
- Small length overruns: `voice.py` speeds up ≤6% (`max_atempo` 1.06) with `atempo` for free and rescales timings. More than that
  sounds hurried: cut words instead.
- After each render voice.py reports `hook_end_sec` and every pause > `flow.max_gap_sec`; fix the text and re-render if the
  hook ends after 4 s or the narration stalls mid-idea.
- Credits are checked before every render; a render is refused if credits are insufficient.

## Captions
- Built from real word timings (no guessing). EN: up to 3 words / 18 chars per chunk; TA: up to 2 words / 16 chars.
- Chunks break at sentence punctuation and at beat boundaries; trailing commas/periods are hidden, ?/! kept.
- **Hook title** (`hook_text`): shown from frame 0 until the spoken hook ends (2.0-3.5 s) in the overlay zone (22% height), big
  white text on a dark, yellow-bordered panel; its pop SFX is the frame-0 sound hit. Other overlays wait until it clears.
- Music stays ducked through normal sentence pauses (`flow.duck_hold_sec` 1.2 s) so it doesn't swell between sentences, and
  whooshes that land on a spoken word play at `flow.whoosh_under_voice` (45%) volume so they don't cut into the sentence.
- Style: white, heavy weight, black stroke + soft shadow, no box, pop-in spring, the word being spoken turns yellow
  (`captions.highlight_color` #FFD43B), centered at 70% height
  (keeps clear of the Shorts title/description area and the right-side action buttons).
- Tamil uses Noto Sans Tamil (Google Fonts, loaded by Remotion → Chromium/HarfBuzz shaping = correct conjuncts and vowel signs).
- `final/<slug>_<lang>.srt` is also written: upload the *other* language's SRT as a CC track on each video
  (Tamil video gets English CC and vice versa).
