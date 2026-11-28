# Visual style guide (derived from `YT_VIDEOS/References/`)

Measured from the two reference Shorts (ffprobe + frame sampling every 3s):

| Property | Reference | Our target |
|---|---|---|
| Format | 9:16, 30 fps, 27-35s | 1080x1920, 30 fps, **35-90s, hard cap 90s** (shortest that explains it; most 45-70s) |
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
- 4-8 overlays per video. Trigger word must appear in that beat's narration in each language.
- **Infographics** (`counter`, `gauge`, `compare`, `scale`, `pin`; Infographic.tsx): every number the narration states is
  shown moving (at least 2 when the script has numbers). They spring in with overshoot, run their value over the first
  ~55% (ticks play under it), settle with a small bump, fade out. One accent colour per video (`visual_plan.accent`, else the
  grade's: teal/night #7DF9FF, warm-sunlit/neutral #FFD43B) on dark glass panels; white for everything else. `pin` follows a
  3D point from the clip (film.js `pin()`), keeps its label above the caption zone.

## Sound design (the other half of the picture)
Target **≥ 3 deliberate sounds per 10 s** besides the voice (polish.py measures it; reference studios run ~3 per shot):
- automatic: whoosh on whips/zooms, riser + impact + **sub drop** on flash cuts, **ticks** under counters/gauges, pop on callouts, ding at the end
- per shot (`sfx`): 2-3 layered foley per mechanism beat on the action (the hit, a texture, a tail), `offset_ms` to pre-empt hits
- an **ambience bed** (room tone) under every set, changed when the set changes: silence between words sounds empty, room tone sounds real
- **music scored to the story**: the bed drops out just before the twist line and slams back on it; a mood `switch` when the
  story turns; a **stinger** on the payoff word. One loop all the way through sounds like a template.

## Film look (code-rendered shots)
The 3D engines finish every frame like film (core/film.js, `look.json` from `config.grade_presets.<grade>.engine`):
ACES tone curve → the grade's **3D LUT** (`assets/luts`, `make_luts.py`: split-tone + gentle S-curve) → **halation** (warm
glow off bright edges) → light **edge chromatic aberration**. ACES + LUT beat AgX on our sets (AgX came out flat and muddy);
opt into AgX per video with `visual_plan.film: {"tonemap": "agx"}`. Remotion's tint is scaled down when every shot was graded in-engine.

## Camera language and motion (code-rendered shots)
- Camera moves come from core/film.js: `dolly` (walk through the set on a smooth path), `orbitAround`, `craneReveal`
  (low/close → high/wide, for payoffs), `scaleJump` (macro ↔ wide in one move, constant felt speed), `handheld` (subtle noise on top).
- **Rack focus** on the key word (`focus_pull`) and **speed ramps** (`ramp`, ~3x slow motion for ~0.6 s) on hero events.
- Animation principles (core/motion.js): every key action = `anticip` → move → `overshoot`/`spring` settle; every hero moving
  part has one follow-through element (`follow`: tails, hair, cables, splashes, shadows lag); `squash` on impacts;
  `stagger` groups so one thing moves at a time (one focal motion per shot).
- **2D styles (paper-atlas, inside-out, stick-story):** move the camera linearly for the whole shot (not ease-in-out), with at least a
  0.3 scale change or ~150 px of travel on 3-4 s shots, plus parallax layers or a slow rotation. Flat paper gives far less
  frame-to-frame energy than 3D, so an eased move that settles halfway makes polish.py flag the rest of the shot as static.
