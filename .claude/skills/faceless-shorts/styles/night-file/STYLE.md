# Night File 3D: unsolved mysteries and true crime, 9:16

Quiet, uneasy, investigative. Dark 3D places with ONE light source, faceless people: witnesses are near-black with a
thin red rim light, the person the story is about glows solid red. Typewriter dates and captions, evidence inserts
(case files, tickets, polaroids, red circles), film grain, slow camera.
Example: `example/` = **THE MAN WHO JUMPED OUT OF A PLANE** (D.B. Cooper, 1971; 36 s, 11 shots). Sheet: `style-sheet.png`.

## 1. Rules
- One light per scene; everything else falls into darkness. Lamps come with a soft visible light cone.
- **Red means the subject.** Nothing else on screen is red except evidence marks (red circle, UNSOLVED stamp, string).
- No faces, no gore, no weapons shown (mention them in words only if the record needs it). Real cases: facts checked
  against primary sources (FBI, court records, major outlets) and listed in `script.json` "sources"; treat victims and
  families with respect; never accuse a real living person.
- Slow: 3-5 s shots, push-ins and drifts. Pauses between sentences are longer (`gap` 0.4).
- Captions: FreeMono typewriter, sentence case, 2-5 words, cream with one red word, typed on letter by letter (y 1560).
- Dates type on top-left: `K.dateStamp('NOV 24, 1971', 'FLIGHT 305 · PORTLAND', p, 80, 300)`.
- Narration: low and calm, `am_onyx` x0.95. Music `"tension"`.

## 2. Engine map (`example/src/`)
The 3D core (`engine.js`, `sdf.js`, `human.js`) is shared with Deep Dive 3D (see its STYLE.md). Night File adds:
| file | gives you |
|---|---|
| `core/sets3d.js` | `corridor()`, `houseNight()`, `caseWall(photoCanvases)`, `planeCabin()` (`.update(t, { door, rain, flash })`); `witnessMat()`, `subjectMat()`, `lightCone()` |
| `core/kit.js` | 2D evidence inserts: `caseFile(x, y, s, label, stamp)`, `polaroid(x, y, s, rot, 'glow'│'dark'│'house')`, `clock`, `cassette`, `marker`, `redacted`, `redCircle(x, y, rx, ry, p)`, `dateStamp`, `captionMono`, `filmLook` |
People: `new Human({ face: false })` then `.setAllMaterial(SETS.subjectMat())` or `witnessMat()`. Sitting: hips y 0.66,
`hipL/hipR [88, 0, 2]`, `knL/knR 88`.

## Film, camera and motion (core/film.js, core/motion.js)
Shared by the 3D styles (identical copies in deep-dive, night-file and tall-tale: edit them together).
- **Film finish**: `look.json` in the project root (written by the bilingual pipeline's `faceless.py`, or by hand:
  `{"tonemap": "aces", "lut": "look/lut.cube", "lut_mix": 0.9, "halation": 0.35, "ca": 0.8}`) turns on a 3D LUT, halation
  and edge chromatic aberration after the grade pass. Without it the engine looks exactly as before. Per render:
  `E.render(scene, cam, { ...LOOK, lutMix, halation, ca })`. ACES + LUT beats AgX on these sets.
- **Camera language**: `dolly(cam, [p0, p1, p2], p, lookAt)` (walk through the set), `orbitAround(cam, target, {r, h, a0, a1}, p)`,
  `craneReveal(cam, target, {from, to}, p)` (payoffs), `scaleJump(cam, target, dir, near, far, p)` (macro ↔ wide),
  `handheld(cam, t, 0.008)` after any move. `p` = 0..1 shot progress; the helpers ease it.
- **Animation principles** (`motion.js`, pure functions of time): `anticip(t, t0, dur)` (dip back, then go),
  `overshoot(t, t0, dur)` / `spring(t, t0)` (settle), `follow(fn, t, lag)` (secondary parts lag: tails, hair, cables, splash),
  `squash(t, impactT)` → `{y, xz}` scale (volume kept), `stagger(t, t0, i)` (one element at a time).
  Rule: every key action = anticipation → move → overshoot; one follow-through element per hero moving part; one focal motion per shot.
- **Speed ramp / rack focus**: `lt = ramp(lt, fx('S04').ramp)` at the top of a shot plays its event in slow motion and keeps
  it on the same wall time; `focus: focusPull(lt, fx('S10').focus_pull, 3)` pulls focus on the key word. `fx(id)` reads
  `slots.json` (bilingual pipeline) or returns nulls.
- **Pins**: `pin('beak', vec3)` right after `E.render` logs where that point lands on screen; `capture.mjs video` writes
  `<clip>.pins.json` and the pipeline's `pin` overlay sticks a label to it as the camera moves.

## 3. Story shape
Date + place → the person (subject glowing) → the strange event, step by step, each step an evidence insert or a slow
3D shot → the moment it goes wrong (one hard sound) → what was found later (case wall, date) → the open question,
UNSOLVED stamp. End on silence and the drone.

## 4. QA pitfalls we've hit
- Camera inside a light cone = flat brown frame. Seats or walls between camera and subject = blocked view.
- Too-tight framing on a dark doorway reads as an empty frame: use a wider lens (`fov: 58`) for dark spaces.
- Rendering speed: see Deep Dive STYLE.md section 5.
