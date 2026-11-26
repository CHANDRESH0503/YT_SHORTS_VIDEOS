# Visual style guide (derived from `YT_VIDEOS/References/`)

Measured from the two reference Shorts (ffprobe + frame sampling every 3s):

| Property | Reference | Our target |
|---|---|---|
| Format | 9:16, 30 fps, 27-35s | 1080x1920, 30 fps, **40-55s** |
| Look | Realistic game-engine 3D (UE-style): forensic lab, crow, scientists, macro bullet casing | `realistic-cgi` preset |
| Palette | Teal / cyan clinical, glossy whites, metallic accents | Grade tint #00B4C8 soft-light + vignette |
| Shot length | 2-3s, camera **always** moving | 2-4s (auto-split above 4s) |
| Cuts | Hidden by whip-pans / zoom-blurs / motion; hard cut + flash on the twist | whip_left/right inside a beat, zoom at beat change, flash on twist & payoff |
| Overlays | Floating glowing 3D numbers ("3", "6"), ✗/✓, ⚡, 🚫 on key words | `overlay` per shot: number / icon / label, popped on the trigger word |
| Captions | 2-3 words, white bold sans, soft shadow, no box, ~75-80% down | EN 1-3 words Inter Black; TA 1-2 words Noto Sans Tamil ExtraBold; y=70% (clear of Shorts UI) |
| Audio | Fast, energetic narrator (~3 words/s), loud master | ElevenLabs, speed ~1.05-1.08, −14 LUFS, whoosh/pop/riser/impact SFX |

## Shot grammar
- **Every beat opens on a new idea visually.** Beat change = new location/scale (wide → macro or vice versa).
- Alternate scale: establishing wide → medium → **macro insert** (the "money shot": cross-section, fingerprint, inside an organ).
- Show, don't tell: if the narration says "three times", the frame shows three of something and an overlay "3".
- Humans: stylized-realistic (game-cinematic), never photoreal faces of real people, never celebrities/brands/logos.
- Keep one consistent **world** per video (`beats.world`) – e.g. "bright teal-tiled research lab" – so stills feel like one film.
- First frame must be visually striking on its own (it is also the thumbnail/scroll-stopper).

## Camera moves (`camera_move`)
`push_in, pull_out, pan_left, pan_right, tilt_up, tilt_down, orbit_left, orbit_right, static_drift`.
Never use the same move on two consecutive shots. Hook shot: `push_in` or `orbit_*`. Reveal shots: `pull_out`.
Macro shots: `orbit_*` or `push_in`. Payoff: `pull_out` (ends wide, satisfying).

## Overlays
- `number`: chrome digits with cyan glow (counts, percentages, years: "3", "90%", "1912").
- `icon`: a single glyph: ✓ ✗ ⚡ 🚫 ⚠️ ❓ ❤️ 🔥 💧 – max 1 per 2 beats.
- `label`: short word/phrase pill, **per language** (`{"en": "Blank!", "ta": "காலி!"}`), ≤ 14 chars.
- 4-7 overlays per video. Trigger word must appear in that beat's narration in each language.
