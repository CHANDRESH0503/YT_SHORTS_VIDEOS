# Visual style guide (derived from `YT_VIDEOS/References/`)

Measured from the two reference Shorts (ffprobe + frame sampling every 3s):

| Property | Reference | Our target |
|---|---|---|
| Format | 9:16, 30 fps, 27-35s | 1080x1920, 30 fps, **35-55s** (aim ~45s) |
| Look | Realistic game-engine 3D (UE-style): forensic lab, crow, scientists, macro bullet casing | `realistic-cgi` preset |
| Palette | Teal / cyan clinical, glossy whites, metallic accents | One grade preset per video (`visual_plan.grade`): `teal` (tint #00B4C8, the reference look), `warm-sunlit` (deep-dive / tall-tale), `night` (mysteries), `neutral` (2D styles) |
| Shot length | 2-3s, camera **always** moving | 2-3s (auto-split above 3s) |
| Cuts | Hidden by whip-pans / zoom-blurs / motion; hard cut + flash on the twist | whip_left/right inside a beat, zoom at beat change, flash on twist & payoff |
| Overlays | Floating glowing 3D numbers ("3", "6"), ✗/✓, ⚡, 🚫 on key words | `overlay` per shot: number / icon / label, popped on the trigger word |
| Captions | 2-3 words, white bold sans, soft shadow, no box, ~75-80% down | EN 1-3 words Inter Black; TA 1-2 words Noto Sans Tamil ExtraBold; y=70% (clear of Shorts UI); **the spoken word turns yellow `#FFD43B`** |
| Audio | Fast, energetic narrator (~3 words/s), loud master, music bed, close-up sounds | ElevenLabs, speed ~1.05-1.08, −14 LUFS; music from `assets/music/<music_mood>/` well under the voice; real (library) whoosh/pop/riser/impact SFX (`assets/DOWNLOADS.md`) |

## Shot grammar
- **Every beat opens on a new idea visually.** Beat change = new location/scale (wide → macro or vice versa).
- Alternate scale: establishing wide → medium → **macro insert** (the "money shot": cross-section, fingerprint, inside an organ).
- Show, don't tell: if the narration says "three times", the frame shows three of something and an overlay "3".
- Humans: stylized-realistic (game-cinematic), never photoreal faces of real people, never celebrities/brands/logos.
- Keep one consistent **world** per video (`beats.world`) – e.g. "bright teal-tiled research lab" – so stills feel like one film.
- First frame must be visually striking on its own (it is also the thumbnail/scroll-stopper). Shot 1 is the cold open
  (script-playbook §2c): the most extreme image of the video, `hero: true`, never `static_drift`.
- **One look per video.** Don't mix photoreal `nano` people with stylised `faceless`/`code3d` people in the same video; keep one
  hero character (same clothes, hair, skin) in every shot they appear in, one set per beat, and the same key-light direction.
- **Sound moments:** every mechanism beat has one shot built around an action with a clear, close-up sound.

## Camera moves (`camera_move`)
`push_in, pull_out, pan_left, pan_right, tilt_up, tilt_down, orbit_left, orbit_right, static_drift`.
Never use the same move on two consecutive shots. Hook shot: `push_in` or `orbit_*`. Reveal shots: `pull_out`.
Macro shots: `orbit_*` or `push_in`. Payoff: `pull_out` (ends wide, satisfying).

## Overlays
- `number`: chrome digits with cyan glow (counts, percentages, years: "3", "90%", "1912").
- `icon`: a single glyph: ✓ ✗ ⚡ 🚫 ⚠️ ❓ ❤️ 🔥 💧 – max 1 per 2 beats.
- `label`: short word/phrase pill, **per language** (`{"en": "Blank!", "ta": "காலி!"}`), ≤ 14 chars.
- 4-7 overlays per video. Trigger word must appear in that beat's narration in each language.
