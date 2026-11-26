---
name: bilingual-3d-shorts
description: Turn a one-line idea into two production-ready 40-55s vertical 3D explainer YouTube Shorts, one in English and one in Tamil, each with its own voiceover and burned-in word-synced captions (plus SRTs). It researches the topic, writes a curiosity-loop script, transcreates it into spoken Tamil, generates 3D keyframes, writes a free image-to-video prompt pack, and renders and QA-checks both videos. Use when the user gives a short idea, question or topic and wants a Short, Reel or 3D explainer video made from it, says "make a short about …", or asks to continue an existing short project.
---

# Bilingual 3D Explainer Shorts (EN + TA)

One line in, two finished 9:16 Shorts out: `final/<slug>_en.mp4` and `final/<slug>_ta.mp4`, plus SRTs, thumbnails and metadata.
The look follows `YT_VIDEOS/References/`: realistic game-engine 3D, teal/cyan grade, an always-moving camera, 2-3s shots,
whip/zoom transitions, glowing number/icon overlays, and 2-3 word white captions.
**Budget is $0.** You make the stills in Nano Banana (Gemini app / AI Studio, free) from a prompt sheet, the ElevenLabs free tier does the voices, hero clips come from free web tools
(added by the user by hand), and Remotion renders.

Paths: `SK=YT_VIDEOS/.claude/skills/bilingual-3d-shorts`, scripts in `$SK/scripts` (run them with `python3`, cwd = scripts),
projects in `YT_VIDEOS/projects/<slug>/`. Read these when you reach the step that needs them:
`references/script-playbook.md`, `references/style-guide.md`, `references/prompt-library.md`,
`references/voice-and-captions.md`, `references/free-video-tiers.md`, `references/qa-checklist.md`.
`references/learnings.md` is the feedback-loop log of lessons from past Shorts: read it at Stage 0, update it at Stage 9.

## Invocation
- `/bilingual-3d-shorts <one-line idea>` starts a new project.
- `/bilingual-3d-shorts continue <slug>` resumes. Run `python3 project.py status <slug>` and continue from the first incomplete stage.
  If every stage is done but `projects/<slug>/retro.md` is missing, run Stage 9.
- `/bilingual-3d-shorts doctor` runs `python3 doctor.py --tamil`, then view `$SK/qa_tamil_test.png` and check the Tamil shaping.

## Stage 0: Preflight (each new project)
Run `python3 doctor.py`. If disk, Remotion, the ElevenLabs key or the SFX kit FAILs, stop and tell the user the exact fix.
Never print or echo the contents of `.env`.
Then read `references/learnings.md` and apply every lesson that fits this project (prompt fixes, pacing, visual-source choices,
user preferences). At Gate 1, add one line saying which past lessons you applied.

## Stage 1: Research and angle
1. `python3 project.py init "<idea>"` → slug.
2. Research the idea following script-playbook §1. Use WebSearch in standard mode, sending parallel queries in one turn:
   the mechanism, surprising numbers, the misconception, and recent findings.
3. Write `research.md`: the chosen angle and why, 5-8 facts each with a source URL, the misconception, a visual inventory, and accuracy flags.
   Research until you can explain the **mechanism**, not just the facts: write a draft explanation spine (script-playbook §2b:
   question, one-sentence answer, 3-5 cause → effect steps, one everyday analogy, the terms to define).
4. Improve the user's line into a sharper hook. Note in research.md how the original line was improved.

## Stage 2: Script → `beats.json`
Write `beats.json` following script-playbook §2, §2b and §4 and style-guide (shot grammar, camera moves, overlays):
- **Narrative style (§2b, required):** fill the `explainer` spine first, then write each mechanism beat as What → Why → So.
  Define every technical term in the sentence it first appears, say the analogy at the hardest step, bridge each beat to the last,
  and make the payoff restate the answer. The test: from the narration alone, a viewer could explain it to a friend.
- 6-9 beats, hook first and payoff last, with at least one twist. Use 2-3 shots per beat, 14-20 shots in total, and 5-8 `hero` shots.
- English narration should be 115-150 words. Write the Tamil narration per beat as a **transcreation** (§3), not a translation.
- Each shot needs a concrete `scene`, `asset_refs`, a `camera_move` (never the same one twice in a row) and `lighting_camera`.
  Hero shots also need a `motion_prompt`. Add 4-7 `overlay`s with triggers that appear in both languages.
**Visual source decision (required):** before validating, score every shot against `references/visual-source-decision.md` and decide
whether code-built 3D can do it efficiently. Set `"source": "code3d" | "nano"` and a one-line `source_reason` on every shot, plus a top-level
`visual_plan` {mode, reason}. Code-built 3D suits precision, process and geometric subjects. Anything needing a realistic person,
face, animal, food or landscape is always `nano`. Keep it within the ~90 min build budget. If code3d shots are few (1-2), use nano instead.
Then run `python3 project.py validate <slug>`. Fix every error and re-run until `ok: true`. Resolve warnings unless there is a reason not to.

### GATE 1: script approval (stop and wait)
Show the user:
- the improved hook
- the **explanation spine** (question, one-sentence answer, chain, analogy, defined terms; it heads `script_en.txt`)
- both scripts beat by beat (from `script_en.txt` and `script_ta.txt`)
- the estimated seconds per language
- how many characters the voices will use, against the ElevenLabs credits left (`python3 voice.py credits`)
- 2-3 key sources
- the **visual plan**: mode, which shots are code-built 3D and which you make in Nano Banana (with counts), and the one-line reason

Ask for approval or edits. **Do not spend credits before approval.**

## Stage 3: Keyframes (code-built 3D first, then Nano Banana)
**3a. Code-built shots** (`source: code3d`): Claude builds these as three.js + Remotion scenes and renders each to
`clips/Sxx.mp4` (5s) plus `keyframes/Sxx.png`. Reference: `projects/how-a-7-segment-display-works/scenes3d/`.

**3b. Nano Banana shots** (`source: nano`), made by the user (skip this if there are none):
1. Run `python3 keyframes.py <slug>`. It writes `keyframes/NANO_BANANA.md`: one ready-to-paste prompt per asset reference sheet and per
   nano shot (code3d shots are listed as "skip"), with the exact filename and which reference image to upload. Give the user the path.
2. **Wait for the user** to drop the frames in. Never call an image API.
3. When the user says `continue <slug>`, run `python3 keyframes.py <slug> --check`. It renames loose names (`s1.png`, `S01 (1).jpg`),
   centre-crops to 9:16, normalises to 1080x1920 PNG (originals kept in `keyframes/originals/`), flags low-resolution frames and builds
   `qa/keyframes_sheet.jpg` across both sources. It exits non-zero while any nano frame is missing or any code3d shot is unrendered.
4. View the contact sheet. Flag clear failures with a fix for that shot's prompt: text or letters in the image, a visible watermark,
   broken anatomy, the wrong subject, a mismatched world, a frame that lost its subject in the 9:16 crop, or a look that clashes with the 3D shots.

### GATE 2: look approval (stop and wait)
Show the contact sheet path and your notes. Ask which shots to redo, if any. The user replaces `keyframes/Sxx.png` and you re-run `--check`.

## Stage 4: Prompt pack (hybrid clips)
Run `python3 prompt_pack.py <slug>` (code3d shots are skipped because they already have clips). Give the user the path of `prompt_pack.md` and a short summary of the steps: which hero shots
need clips, which free tools to use (free-video-tiers.md), and the exact filenames.

### GATE 3 (optional)
The user either generates clips and says `continue <slug>`, or says skip, in which case every shot is animated as 2.5D.
Do not wait idle. If the user says skip, or wants a preview first, go straight on to Stage 5.
Clips can be added later and only Stages 6-7 need re-running.

## Stage 5: Voices
`python3 voice.py render <slug>` renders both languages, checking credits first.
- If a language comes back `in_range: false` and is too long even after the automatic atempo: shorten that language's narration in
  beats.json, re-validate, and re-render only that language with `--lang ta --force`. Tell the user that this spends credits.
- If it is too short (<40s), add one concrete fact line to a mechanism beat and re-render that language.
- Listen-proxy check: read `audio/<lang>/words.json`. Every beat has words, and timings are monotonic.

## Stage 6: Timeline and render
1. `python3 timeline.py <slug>`. The longest shot must be ≤4s and every hero clip present must show up in `clip_segments`.
2. Optional fast draft: `python3 render.py <slug> --preview`. Extract 2-3 frames with ffmpeg and view them.
   Every video ends with the **channel end card** (`config.json → end_card`, ~2.5s after the last word): that language's channel
   logo (`YT_VIDEOS/brand/icon_en.png` → How is this, `brand/icon_ta.png` → How is this - Tamil), the channel name and an animated
   "Subscribe" button. It is visual only (no extra voice credits) and its length is already in the duration budget. Never skip it.
3. `python3 render.py <slug>` renders both languages at 1080x1920, normalizes loudness, and writes the SRTs and thumbnails. It takes a few minutes per language on an M4.

## Stage 7: QA and delivery
1. Run `python3 qa.py <slug>` (it also FAILs if the channel end card is missing). Fix any FAIL (re-run the relevant stage) before delivering.
2. View `qa/contact_en.jpg`, `qa/contact_ta.jpg` and `qa/reference_sheet.jpg`, and go through the visual checklist in qa-checklist.md.
   Especially check that the Tamil glyphs are intact.
   Also run the explanation check: listen to each language once and confirm the "why" in every mechanism beat is audible, not lost to fast pacing.
3. Run Stage 8 below before Gate 4. It replaces the old hand-written `metadata_<lang>.md`.
4. **GATE 4.** Show the final paths (videos, SRTs, `thumbnail_<lang>.jpg` (9:16) and `thumbnail_<lang>_16x9.jpg` (16:9), `publish_<lang>.md`), the chosen titles, QA results, a one-line summary of anything you could not verify, and the remaining ElevenLabs credits.
   Also ask: "Anything you'd want done differently next time?" (optional, feeds Stage 9).
   Never upload or publish anything. The user publishes.

## Stage 8: Publish kit (after QA passes)
Invoke the **shorts-publish-kit** skill for `<slug>`, or follow `../shorts-publish-kit/SKILL.md` directly. It produces branded
thumbnails, titles, descriptions, tags and hashtags for both channels: English → **How is this**, Tamil → **How is this - Tamil**.
Its files are `final/thumbnail_<lang>.jpg` (9:16), `final/thumbnail_<lang>_16x9.jpg` (16:9) and `final/publish_<lang>.md`.
Only start it once `qa.py` has no FAIL.

## Stage 9: Feedback loop (last step of every project, after Gate 4)
This makes every Short better than the last one. Do it even when the project went smoothly.
1. **Collect** what this project taught, from the whole session and the project files: user edits and rejections at Gates 1-4,
   keyframes redone (and the prompt fix that worked), QA FAILs and their fixes, voice re-renders for length, render or timeline errors,
   free-tool failures and workarounds, things the user praised, and the user's answer to the Gate 4 question.
2. **Filter.** Keep a lesson only if it is reusable on another topic, verified in this project, and not already a rule.
   Drop topic-specific facts.
3. **Write `projects/<slug>/retro.md`:** what went well, what cost retries (with the root cause), and the lessons kept.
   This file also marks Stage 9 as done.
4. **Update the skill:**
   - Add each kept lesson to the right section of `references/learnings.md` in its line format. Refine an existing line instead of duplicating it.
   - If a lesson is firm (it happened twice or more, or the user stated it as a rule), promote it: edit the reference file it belongs to
     (prompt-library, style-guide, script-playbook, voice-and-captions, qa-checklist, visual-source-decision, or this SKILL.md),
     and leave a `→ promoted to …` pointer in learnings.md.
   - Publish-kit lessons (thumbnails, titles, SEO) go in learnings.md "Publish kit" and, when firm, in `../shorts-publish-kit/references/seo-playbook.md`.
   - Lessons that need a **script/code change** are not applied silently: list them for the user as proposals and change code only if they approve.
   - Never weaken a Hard rule through a lesson.
5. **Report** to the user in 3-6 lines: the lessons added or refined, any rule promoted (file and section), and any code changes proposed.

## Hard rules
- $0: never call paid APIs or add paid services. If a free source fails, report it and offer the manual drop-in path.
- No real people's likenesses, celebrities, logos, brand names, or another creator's name or branding, in prompts, titles or metadata.
- Facts must trace to research.md sources. Medical and safety topics are explanatory only.
- Free-tier ElevenLabs output is non-commercial and needs attribution. Remind the user at Gate 4 if they mention monetizing.
- Keep `.env` secret. Never paste keys into chat, logs or URLs.
