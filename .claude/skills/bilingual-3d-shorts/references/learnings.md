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
- [2026-11-28 · why-the-world-s-fastest-trains-and-planes-copy-a] Check the user's premise during research and turn a false half into the twist instead of repeating it (the request said planes copied the beak; they copied wingtips → winglets). (why: no source supported a beak-nosed airliner)
- [2026-11-28 · mother-birds-touched-chick-myth] Write the first Tamil draft at ≈0.9× the English character count (target ≤ 720 chars for ~50 s); a free transcreation came out 35% longer and needed two trims. (why: TA est 69 s → 57 s → OK)

## Visual source & keyframes (Stage 3)
- [2026-11-28 · why-the-world-s-fastest-trains-and-planes-copy-a] Deep-dive outdoor sets: use a saturated sky (top ≈#2A6CCB, horizon ≈#CFE0EE, `pow(y,0.4)`) or white subjects vanish; light from the camera side (a backlit far bank goes black); colour animals with soft ellipsoid masks, not axis boxes; splash droplets ≤1 cm; in 9:16 frame long subjects (tunnels, trains) as three-quarter views down their length. (why: 6 frame-review rounds)
- [2026-11-28 · why-the-world-s-fastest-trains-and-planes-copy-a] Faceless clips play from frame 0 at each shot's start: render the voices, build the timeline, then re-time each clip's key event to its trigger word (use `weight` to move shot starts) and re-export only those shots. (why: the S04 boom, S07 burst and S10 splash now hit their words in both languages)
- [2026-11-28 · mother-birds-touched-chick-myth] Animal/nature topics can go fully `faceless` deep-dive with stylised SDF animals in a project-local `faceless/src/<kit>.js` (bird, chick, nest, cat, garden set built in ~1 h), giving real motion in every shot instead of manual Nano Banana stills. (why: user asked for proper animation; all 18 shots rendered as clips)
- [2026-11-28 · mother-birds-touched-chick-myth] Deep-dive 9:16 at fov 30 shows only ≈0.3 m of width per metre of distance: stack subjects vertically (face above the nest, nest above the walker) and solve hand placement per frame (search the shoulder angle, then shift the body) rather than guessing poses. Keep foliage in the canopy: low leaf clusters trap close cameras. Keep x-ray glass eyes at opacity ≤0.4 / emissive ≤0.2 or bloom whites them out. (why: 4 frame-review rounds)
- [2026-11-28 · pipeline upgrade] Deep-dive: put wall-mounted planes (chalkboard, mirror) ≥2 cm in front of their frame box, or they z-fight. Inside-the-body sets need lower light than you'd guess: a point light near the camera plus bloom blows them out. (why: the first set test sheet had both)
- [2026-11-28 · pipeline upgrade] `faceless.py --mb 4` costs ~35 s per 5 s shot on this Mac (vs ~10 s without): fine for finals, skip for drafts. (why: measured)
- [2026-11-26 · sunflower] Gemini/Nano Banana frames arrive at 768x1376 with a grey sparkle watermark bottom-right (≈x688-736, y1295-1345). Back up to `keyframes/originals_watermarked/`, then `ffmpeg -vf crop=720:1280:24:0` before `keyframes.py --check`. (why: the watermark survived the plain centre-crop)
- [2026-11-26 · sunflower] The prompt line "Leave some calm space in the lower third" sometimes makes Gemini draw a flat empty band. Check the lower thirds on the contact sheet. (why: S11 came back with a dead band)
- [2026-11-25 · how-a-7-segment-display-works] Tech and geometric topics render well as code-built 3D (three.js + @remotion/three); the user accepted it. (why: the image APIs failed)

## Clips & motion (Stage 4)

## Voice & pacing (Stage 5)
- [2026-11-25 · how-a-7-segment-display-works] ElevenLabs is on the free tier and the key has no `user_read`, so credits can't be read: `voice.py credits` warns and continues. Estimate characters from the script instead. (why: doctor and credits failed on permissions)

## Timeline, render & QA (Stages 6-7)
- [2026-11-28 · mother-birds-touched-chick-myth] qa.py's soft-frame WARN (≈65%) is expected on deep-dive clips with DOF + `--mb 4`; don't chase it, the threshold needs calibrating (proposal in retro.md). With `assets/sfx/foley/` empty, ffmpeg-synthesised foley (aevalsrc sweeps / filtered noise, normalised to -3 dB) works as a stopgap. (why: measured)

## Publish kit (Stage 8)
- [2026-11-28 · why-the-world-s-fastest-trains-and-planes-copy-a] The thumbnail crop is tighter than the shot: check that the key detail (a beak) is not cut, and pick `thumb_time` late in an orbiting shot. (why: the first S17 crop cut the beak off)
- [2026-11-28 · mother-birds-touched-chick-myth] For a human + animal story, the payoff frame (person + subject, face low, sky above) beats the cold-open frame for the thumbnail: the cold open had the bird's head in the text zone. (why: S16 chosen over S01)

## User preferences
- [2026-11-28 · pipeline upgrade] User: the narration felt discontinuous; Shorts may run up to 90 s, never longer; the first 2-4 s must stop the scroll. Diagnosis on the bullet-train Short: 0.4-0.75 s stops after every fragment, beats that start cold (B4's engineer), a topic switch at the twist, and music swelling in every gap. → promoted to script-playbook §2c (three-layer hook, hook_text) and §2d (narration flow), voice-and-captions (one take, steadier settings), config `duration.max` 90 / `hook` / `flow`, and validate/voice/timeline/qa checks.
- [2026-11-25] For pipeline changes, add exactly what was asked: no extra tooling or test scaffolds unless the user asks.
- [2026-11-26] "Don't build" from the user means: don't make new content or videos (no pilot Shorts, no credit spend). Building pipeline code for an approved plan is fine. (why: the user clarified after the quality-upgrade build was wrongly deferred)
- [2026-11-28] Quality upgrade built: grade presets, music ducking, foley on trigger words, yellow word pop, organic handheld, directional whip blur, PNG/x264-slow render, 1.3x sharpened stills, retention + audio validation, new QA checks; deep-dive engine: GTAO + SMAA, MB motion blur, brow/mouth expressions + blink, 8 new sets, cast.js. Not done: a bone-macro set and mesh smoothing (the body mesh is already fine, step 0.005-0.007). Plan: ~/.claude/plans/distributed-hopping-bubble-of-36cec9d4-40c1-43a6-abb4-ed69b74cd7c9.md
