# Learnings log (feedback loop)

Lessons from past Shorts that make the next one better. **Read at Stage 0 of every new project**; **updated at Stage 9** of every project.

Rules for entries:
- One line per lesson: `- [YYYY-MM-DD · <slug>] <what to do differently> (why: <what happened>)`.
- Only reusable, verified lessons: something that cost a retry, a user correction at a gate, a QA FAIL, or something the user praised.
  Skip one-off topic facts.
- Before adding, look for an existing line that covers it and refine it; never duplicate. Delete lines that turn out wrong.
- When a lesson is firm enough to be a rule, move it into the reference file it belongs to (prompt-library, style-guide,
  script-playbook, voice-and-captions, qa-checklist, visual-source-decision, or SKILL.md) and leave a pointer here:
  `→ promoted to <file> §<section>`.

## Research & script (Stages 1-2)
- [2026-11-28 · one-hill-two-shrines-how-thiruparankundram-s-mur] Multi-era history scripts: draft at ≤190 EN words / ≤1150 TA chars, since every extra era costs about 8 s; for live disputes, mark contested claims "by tradition", state only court-recorded facts and claim no outcome. (why: first draft 98 s EN / 112 s TA, 3 trim rounds) → promoted to script-playbook §1 (live/contested topics) and §2 (multi-era stories)
- [2026-11-28 · why-the-world-s-fastest-trains-and-planes-copy-a] Check the user's premise during research and turn a false half into the twist instead of repeating it (the request said planes copied the beak; they copied wingtips → winglets). (why: no source supported a beak-nosed airliner)
- [2026-11-28 · mother-birds-touched-chick-myth] Write the first Tamil draft at ≈0.9× the English character count (target ≤ 720 chars for ~50 s); a free transcreation came out 35% longer and needed two trims. (why: TA est 69 s → 57 s → OK)

## Visual source & keyframes (Stage 3)
- [2026-11-28 · one-hill-two-shrines-how-thiruparankundram-s-mur] For faceless shots, render the voices first and run timeline.py on a scratch copy with placeholder keyframes to read real shot lengths (1.1-4.4 s) and trigger offsets, then write shots.js so every action fits its cut. Make events continuous (repeated taps, staggered pops), because triggers often land in the neighbouring shot. (why: shots split a beat evenly) → promoted to SKILL.md Stage 3a-2 step 2
- [2026-11-28 · one-hill-two-shrines-how-thiruparankundram-s-mur] paper-atlas suits multi-era history: one project hill set + map + court props drove all 28 shots with no Nano Banana stills. (why: QA passed first time) → promoted to visual-source-decision §Examples
- [2026-11-28 · why-the-world-s-fastest-trains-and-planes-copy-a] Deep-dive outdoor sets: use a saturated sky (top ≈#2A6CCB, horizon ≈#CFE0EE, `pow(y,0.4)`) or white subjects vanish; light from the camera side (a backlit far bank goes black); colour animals with soft ellipsoid masks, not axis boxes; splash droplets ≤1 cm; in 9:16 frame long subjects (tunnels, trains) as three-quarter views down their length. (why: 6 frame-review rounds)
- [2026-11-28 · why-the-world-s-fastest-trains-and-planes-copy-a] Faceless clips play from frame 0 at each shot's start: render the voices, build the timeline, then re-time each clip's key event to its trigger word (use `weight` to move shot starts) and re-export only those shots. (why: the S04 boom, S07 burst and S10 splash now hit their words in both languages)
- [2026-11-28 · mother-birds-touched-chick-myth] Animal/nature topics can go fully `faceless` deep-dive with stylised SDF animals in a project-local `faceless/src/<kit>.js` (bird, chick, nest, cat, garden set built in ~1 h), giving real motion in every shot instead of manual Nano Banana stills. (why: user asked for proper animation; all 18 shots rendered as clips)
- [2026-11-28 · mother-birds-touched-chick-myth] Deep-dive 9:16 at fov 30 shows only ≈0.3 m of width per metre of distance: stack subjects vertically (face above the nest, nest above the walker) and solve hand placement per frame (search the shoulder angle, then shift the body) rather than guessing poses. Keep foliage in the canopy: low leaf clusters trap close cameras. Keep x-ray glass eyes at opacity ≤0.4 / emissive ≤0.2 or bloom whites them out. (why: 4 frame-review rounds)
- [2026-11-28 · pipeline upgrade] Deep-dive: put wall-mounted planes (chalkboard, mirror) ≥2 cm in front of their frame box, or they z-fight. Inside-the-body sets need lower light than you'd guess: a point light near the camera plus bloom blows them out. (why: the first set test sheet had both)
- [2026-11-28 · pipeline upgrade] `faceless.py --mb 4` costs ~35 s per 5 s shot on this Mac (vs ~10 s without): fine for finals, skip for drafts. (why: measured)
- [2026-11-26 · sunflower] Gemini/Nano Banana frames arrive at 768x1376 with a grey sparkle watermark bottom-right (≈x688-736, y1295-1345). Back up to `keyframes/originals_watermarked/`, then `ffmpeg -vf crop=720:1280:24:0` before `keyframes.py --check`. (why: the watermark survived the plain centre-crop)
- [2026-11-26 · sunflower] The prompt line "Leave some calm space in the lower third" sometimes makes Gemini draw a flat empty band. Check the lower thirds on the contact sheet. (why: S11 came back with a dead band)
- [2026-11-25 · how-a-7-segment-display-works] Tech and geometric topics render well as code-built 3D (three.js + @remotion/three); the user accepted it. (why: the image APIs failed)

- [2026-11-28 · pipeline upgrade 2] In-engine film finish tested on deep-dive sets: ACES + LUT is richer than AgX + LUT (AgX came out flat and muddy). Keep ACES; AgX only per video for blown saturated lights. (why: side-by-side frames of S04/S10/S17)

## Clips & motion (Stage 4)

## Voice & pacing (Stage 5)
- [2026-11-25 · how-a-7-segment-display-works] ElevenLabs is on the free tier and the key has no `user_read`, so credits can't be read: `voice.py credits` warns and continues. Estimate characters from the script instead. (why: doctor and credits failed on permissions)

## Timeline, render & QA (Stages 6-7)
- [2026-11-28 · one-hill-two-shrines-how-thiruparankundram-s-mur] 2D faceless styles: use linear camera moves that last the whole shot (≥0.3 scale change on 4 s shots); eased moves that settle early make polish flag the second half as static, since flat paper gives less frame energy than 3D. Keep frame-0 subjects between y≈700 and y≈1250 in the clip, because the hook title plus Remotion's extra ~10% push-in hides anything higher. (why: 12 static flags; the dargah was under the hook title) → promoted to style-guide §Camera language and motion (2D styles) and SKILL.md Stage 3a-2 step 3 (safe zone)
- [2026-11-28 · pipeline upgrade 2] polish.py thresholds were calibrated on the bullet-train Short: only outliers flag (luma ±40%, chroma > max(30, 2.5x median)); it caught the washed-out near-static jet shot (S16). Recalibrate in config.polish after the next real Short. (why: first pass flagged 24 normal scene changes)
- [2026-11-28 · mother-birds-touched-chick-myth] qa.py's soft-frame WARN (≈65%) is expected on deep-dive clips with DOF + `--mb 4`; don't chase it, the threshold needs calibrating (proposal in retro.md). With `assets/sfx/foley/` empty, ffmpeg-synthesised foley (aevalsrc sweeps / filtered noise, normalised to -3 dB) works as a stopgap. (why: measured)

## Publish kit (Stage 8)
- [2026-11-28 · why-the-world-s-fastest-trains-and-planes-copy-a] The thumbnail crop is tighter than the shot: check that the key detail (a beak) is not cut, and pick `thumb_time` late in an orbiting shot. (why: the first S17 crop cut the beak off)
- [2026-11-28 · mother-birds-touched-chick-myth] For a human + animal story, the payoff frame (person + subject, face low, sky above) beats the cold-open frame for the thumbnail: the cold open had the bird's head in the text zone. (why: S16 chosen over S01)

## Long-form (4-12 min)
- [2026-11-28 · long-form added] Reference teardown (19:48 animated story-doc): 158 wpm, median shot 2.4 s held to the end, 6 chapters opened by 2-3 s black cards over a ~2.7 s voice pause, a black text card every ~24 s, dialogue skits every 20-60 s, one everyday analogy per hard idea, numbers made per-person, the midpoint reveal at 50 %, the ending calls back to the cold-open image. → promoted to references/long-form-playbook.md, config `long_form`, project.py `init --long` / `plan` / long-form validate.
- [2026-11-28] Budget reality: a 9-min EN + TA video needs ~16k ElevenLabs characters (the free month is ~10k), and a language over 10,000 characters can't be one request. Raise it at Gate L, not at Stage 5.

- [2026-11-28 · voice providers] `voice.provider` elevenlabs | edge added (tts_providers.py). Edge: free, 10+ min single takes and exact EN/TA word timings tested. Google Cloud TTS was built then dropped: the user can't have a billing account, which Google needs even for its free tier, so never propose billing-account services. If a TTS without word timings is ever needed: faster-whisper alignment was accurate (0.07 s EN); timing from pauses drifts on number-heavy English (0.6 s mean). → promoted to voice-and-captions.md §Providers.

- [2026-11-28 · the-2025-crypto-crash] Long-form Tamil on the edge voice (ta-IN-ValluvarNeural): plan at ~14 chars/s with rate +15 %, and trim its fixed ~0.86 s full-stop pauses to ~0.55 s in the timeline; at +0 % a 9.7k-char script ran 12:49, over the 12:00 cap. (why: TA re-render)
- [2026-11-28 · the-2025-crypto-crash] Market / data / mechanism stories go fully code-built as 16:9 2D motion graphics (~60 reusable scene types for ~200 shots, project-local Remotion `src/long/` + tools/long_timeline.py + tools/render_long.py). Before the full render, review one frame per unique scene on a contact sheet. Keep scene text above y≈830 (captions sit at the bottom), and give AbsoluteFill-based rows an explicit `flexDirection: 'row'` (the default is column). (why: one review pass caught 3 clipped layouts and 6 caption collisions)
- [2026-11-28 · the-2025-crypto-crash] With < 3 GB free, render long videos in 60 s muted chunks and mux the loudness-normalised mix in the concat step. (why: 1.6 GB free)

## User preferences
- [2026-11-28 · pipeline upgrade 2] Studio-grade upgrade built after researching madeovernight.com (dense shot-by-shot sound, score that follows the story, moving numbers/gauges/maps, one film grade, a polish pass): ambience beds, layered foley + sweeteners (tick, sub drop), music cues (drop before the twist, switch, stinger), infographic overlays (counter, gauge, compare, scale, pin tracked from 3D), in-engine film finish (LUT, halation, edge CA via core/film.js + look.json), speed ramps + rack focus (shot `ramp` / `focus_pull`), camera helpers (dolly, orbitAround, craneReveal, scaleJump, handheld), motion helpers (core/motion.js), polish.py (Stage 6b). Plan: ~/.claude/plans/recursive-tickling-kazoo-of-b53b8c8f-066c-4760-b1fa-09dcc0f9c0ca.md
- [2026-11-28 · pipeline upgrade] User: the narration felt discontinuous; Shorts may run up to 90 s, never longer; the first 2-4 s must stop the scroll. Diagnosis on the bullet-train Short: 0.4-0.75 s stops after every fragment, beats that start cold (B4's engineer), a topic switch at the twist, and music swelling in every gap. → promoted to script-playbook §2c (three-layer hook, hook_text) and §2d (narration flow), voice-and-captions (one take, steadier settings), config `duration.max` 90 / `hook` / `flow`, and validate/voice/timeline/qa checks.
- [2026-11-25] For pipeline changes, add exactly what was asked: no extra tooling or test scaffolds unless the user asks.
- [2026-11-26] "Don't build" from the user means: don't make new content or videos (no pilot Shorts, no credit spend). Building pipeline code for an approved plan is fine. (why: the user clarified after the quality-upgrade build was wrongly deferred)
- [2026-11-28] Quality upgrade built: grade presets, music ducking, foley on trigger words, yellow word pop, organic handheld, directional whip blur, PNG/x264-slow render, 1.3x sharpened stills, retention + audio validation, new QA checks; deep-dive engine: GTAO + SMAA, MB motion blur, brow/mouth expressions + blink, 8 new sets, cast.js. Not done: a bone-macro set and mesh smoothing (the body mesh is already fine, step 0.005-0.007). Plan: ~/.claude/plans/distributed-hopping-bubble-of-36cec9d4-40c1-43a6-abb4-ed69b74cd7c9.md
