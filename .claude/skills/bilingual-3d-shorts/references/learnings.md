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

## Visual source & keyframes (Stage 3)
- [2026-11-26 · sunflower] Gemini/Nano Banana frames arrive at 768x1376 with a grey sparkle watermark bottom-right (≈x688-736, y1295-1345). Back up to `keyframes/originals_watermarked/`, then `ffmpeg -vf crop=720:1280:24:0` before `keyframes.py --check`. (why: the watermark survived the plain centre-crop)
- [2026-11-26 · sunflower] The prompt line "Leave some calm space in the lower third" sometimes makes Gemini draw a flat empty band. Check the lower thirds on the contact sheet. (why: S11 came back with a dead band)
- [2026-11-25 · how-a-7-segment-display-works] Tech and geometric topics render well as code-built 3D (three.js + @remotion/three); the user accepted it. (why: the image APIs failed)

## Clips & motion (Stage 4)

## Voice & pacing (Stage 5)
- [2026-11-25 · how-a-7-segment-display-works] ElevenLabs is on the free tier and the key has no `user_read`, so credits can't be read: `voice.py credits` warns and continues. Estimate characters from the script instead. (why: doctor and credits failed on permissions)

## Timeline, render & QA (Stages 6-7)

## Publish kit (Stage 8)

## User preferences
- [2026-11-25] For pipeline changes, add exactly what was asked: no extra tooling or test scaffolds unless the user asks.
