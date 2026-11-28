# QA checklist (Gate 4)

Automated (`qa.py`, must all PASS):
- duration 35-55s (config) · 1080x1920 · 30 fps · audio present
- integrated loudness −14 ±1 LUFS · true peak ≤ −0.5 dBFS
- no black gaps ≥0.3s · no frozen stretches >1.5s · longest shot ≤3.25s
- every spoken word appears in a caption · caption position inside safe area
- channel end card present at the very end, with that language's logo file
- background music present (unless `music_mood: "none"`) · caption highlight colour differs from the base colour
- WARN (fix if you can): first picture change after 2.5s · music not ducked · >25% of frames soft (blurdetect; threshold
  `video.soft_blur`, a starting guess: calibrate it on the first real Short) · info lines show grade and foley count

Visual review (Claude views `qa/contact_en.jpg`, `qa/contact_ta.jpg`, `qa/reference_sheet.jpg`):
- [ ] First frame is striking and readable as a thumbnail
- [ ] **Muted 3-second test:** watch only 0-3s with the sound off. The picture alone makes you curious, and the picture
  changes at least once by 2.5s. If not, re-order or replace shot 1 (the cold open)
- [ ] One look across the whole video: same hero character, no photoreal/stylised mix, grade consistent
- [ ] Grade/palette feels like the references (teal/cyan, glossy, not muddy or oversaturated)
- [ ] No AI artefacts that read as errors (melted hands, garbled text in image, extra limbs) – regenerate those keyframes
- [ ] Caption size consistent; Tamil glyphs fully shaped (no dotted circles ◌, no broken vowel signs)
- [ ] Overlays land on the right words and don't cover faces/captions
- [ ] Last frames show the **right channel's** logo + name (EN → How is this, TA → How is this - Tamil) and the Subscribe button; Tamil CTA glyphs intact
- [ ] Recurring character looks like the same character across shots

Listening spot-check (extract 5 words per language via timestamps in `audio/<lang>/words.json`):
- [ ] caption highlight (yellow word) visible and within ~80 ms of the spoken word
- [ ] Tamil pronunciation natural; no English-accented mangling of key words (else adjust spelling/voice)
- [ ] **Music present** (from `assets/music/<music_mood>/`) and clearly under the voice; if the folder was empty, say so at Gate 4
- [ ] SFX not louder than voice; they sound real (library files), not synthetic beeps
- [ ] The ending flows back into the opening line (loop), so a replay feels natural

Content:
- [ ] Explanation check (script-playbook §2b): after one listen, you could answer `explainer.question` in one sentence; every mechanism beat says *why*, every technical term is defined when it is first said, and the analogy lands on the matching shot
- [ ] Every fact traceable to `research.md` sources; nothing contested stated as certain
- [ ] metadata_{en,ta}.md has title options, description (with sources), hashtags, **ElevenLabs attribution**
- [ ] No real people's likeness, logos, brand names, or another channel's name/branding
