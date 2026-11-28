# Voice & captions

## Providers (config.json → voice.provider; voice.<lang>.provider for one language; `voice.py … --provider` for one run)
Both write the same `audio/<lang>/vo.mp3` + `words.json` (one entry per script word, mapped to beats), so the timeline,
captions and QA don't care which one made the voice. words.json records `provider` and `timing`.

| provider | cost | Tamil | word timing | limits / catches |
|---|---|---|---|---|
| `elevenlabs` | free tier ~10k chars/month | yes | engine (per character) | ≤ 10,000 chars per request (one take ≈ 11 min); free tier non-commercial + attribution |
| `edge` | free, no account | ta-IN-ValluvarNeural (m), ta-IN-PallaviNeural (f) | engine (WordBoundary) | unofficial route to Microsoft's Edge "Read Aloud" voices: can change or stop without notice, commercial terms unclear; 24 kHz 48 kbps mono mp3; the *Multilingual* voices return no audio |

Tested 2026-11-28 (scratch fixtures, no project):
- **edge**: a 10,260-character English take came back in one request (10:22 of audio, 2,185 of 2,185 words timed, ~4 min to render);
  13.9 KB of Tamil kept continuous, monotonic timings (last word 0.17 s before the audio end). Edge pauses ~0.85 s at a Tamil full stop,
  so the §2d flow check (`flow.max_gap_sec` 0.7) flags them: join sentences with commas, or try `voice.edge.ta.rate` "+5%".
- Before the first real render with a new provider, audition both languages: `python3 voice.py sample "<one line>" --lang ta
  --provider edge --out /tmp/x.mp3` (`voice.py voices --provider edge` lists names). chars_per_sec calibration is shared:
  the first render after a switch may land a little off the estimate, then it re-calibrates.
- Recommended: **edge** for long-form and when ElevenLabs credits run out; **elevenlabs** stays the default for Shorts.
- Not used: Google Cloud TTS (Chirp 3 HD) needs a billing account even for its free tier, which the user can't have (2026-11-28).

## ElevenLabs (free tier, provider `elevenlabs`)
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

## Sound bed, score and sweeteners (timeline.py)
- **Ambience** (`ambience` top level or per beat): a looping room-tone bed at `audio.sfx.ambience` (0.35 of a -30 LUFS file),
  6-frame crossfades at set changes, ducked to `audio.ambience_duck` (60%) under speech.
- **Music in segments** (`music_cues`): drops, mood switches (15-frame crossfade) and stingers. A drop resumes the same track
  where it would have been (`trimBefore`), so it feels like the music held its breath, not restarted. The last segment
  plays out under the end card. Each segment keeps the speech duck curve.
- **Sweeteners**: `tick.wav` every 3 frames while a counter/gauge runs, then a pop when it lands; `subdrop.wav` under every
  flash cut (felt more than heard). `python3 sfx.py` synthesises stopgaps for all of these; real CC0 files (DOWNLOADS.md) sound better.

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
