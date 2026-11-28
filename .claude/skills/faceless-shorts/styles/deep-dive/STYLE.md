# Deep Dive 3D: stylized 3D "What happens if…?" explainers, 9:16 (the flagship)

Real 3D, rendered in the browser with three.js: sculpted stylized people in warm sunlit sets, glowing x-ray cutaways,
camera journeys through blood vessels, shallow focus, a camera that never stops moving. Curious, shocking, satisfying.
Example: `example/` = **WHAT HAPPENS IF YOU HOLD YOUR BREATH?** (37 s, 11 shots). Style sheet: `style-sheet.png`
(regenerate it by opening `example/sheet.html` through `node tools/capture.mjs preview`).

## 1. The look (rules)
- **Three worlds, and every video moves between them:** (A) the real world: a person in a warm, sunlit set (kitchen),
  (B) the x-ray: the same body as cyan glass with a glowing skeleton and organs, (C) inside the body: macro shots
  (blood vessel, organs) in deep red with bloom. Real world → x-ray → inside → back out for the ending.
- **Warm low sun outside, cyan inside the body.** X-ray cyan `#4FD1E8` only for x-ray glass; red `#B8283A` for blood.
- **Shallow focus always:** focus on the subject, soft background (`aperture` 0.003-0.006 in the real world).
- **The camera always moves:** every shot pushes in, orbits or drifts (lerp the camera between two points over the shot).
- **No gore.** Injury or danger is shown as x-ray, glow, red alarm colour or a warning sign, never wounds.
- People: one sculpted body, many looks (`new Human({ skin, shirt, pants, shoes, hair, iris })`). Faces are calm and
  readable; avoid hand close-ups (hands are simple mittens).
- Captions: sentence case, 1-3 words, white with a dark outline, one yellow word (`src/core/captions.js`, y 1480).
  Labels: small dark pills with a leader line (`label()`), counters/facts as pills (`pill()`), `warning()` for danger.

## 2. Format
- 1080x1920, 24 fps (cinematic, and faster to render), 30-45 s. Narration `am_michael` x1.0, conversational.
- One line = one shot (cut just before the line: `cut(i)`), and a long line can hold a second shot starting on a word
  (`Wd('blood', 2)`), e.g. x-ray lungs → cut on "blood" → inside the vessel.
- Music: `"tension"` (low drone + slow pulse) for body/danger topics, `"bed"` for light ones.

## 3. Engine map (`example/src/`)
| file | gives you |
|---|---|
| `core/engine.js` | `makeEngine(canvas, { w, h, samples })` → `E.render(scene, cam, look)`: ACES tone, soft shadows, room environment light, **GTAO ambient occlusion** (contact shadows), depth of field, bloom, vignette + grain, **SMAA**. `look = { focus, aperture, maxblur, bloom, bloomThreshold, exposure, vignette, grain, warm, ao }`; `ao` defaults to `scene.userData.ao` (real-world sets ≈0.85; x-ray and inside-the-body sets 0). `?ao=0` turns it off for drafts. `lightRig(scene, {...})`, `camera(fov)` |
| `core/sdf.js` | sculpting: `sphere, ellipsoid, capsule, rbox, torus, smin/smax/ssub, noise3`, `mesh(sdf, bounds, step, colorFn)` (surface nets → smooth BufferGeometry with vertex colours). Use it for any new organ, prop or set piece so everything shares the soft clay look |
| `core/human.js` | `new Human(look)`: `.group` (feet at y 0, faces +z), `.pose({ spine, head, shL, elL, shR, elR, hipL, knL, hipR, knR, lid, look, brow, mouth })` (degrees; lid -0.4 wide … 1 closed; `brow` neutral/raised/worried/angry or `{up, tilt}`; `mouth` closed/open/O/grimace/smile or `{open, wide}`), `Human.blink(t, seed)` → a `lid` value with natural blinks, `.walk(phase, amt)`, `.setBodyMaterial(m)` (x-ray), `.parts[0]` = torso (scale it to breathe), `.spine` (attach insides), `.hips.position.y` (sit: 0.66 + hips 88°, knees 88°) |
| `core/sets.js` | real world: `kitchen(E)`, `bathroom(E)`, `bedroom(E)` (`.lamp.light`), `street(E)` (sunny pavement + buildings), `classroom(E)` (`.update(t)` turns the clock). X-ray: `xrayStage(E)`, `xrayMaterial(color)`, `insides()` → `{ group, stomach, heart, lungs }`. Inside the body: `vessel(E)` (`.update(t, camZ, co2, dark)`), `stomachInside(E)` (`.update(t, acidLevel)`), `brainNeurons(E)` (`.update(t, fire)` pulses along fibres), `lungAlveoli(E)` (`.update(t, breath)` swells the air sacs), `skinMacro(E, { skin })` (pores + hairs, camera low over it) |
| `src/cast.js` | (bilingual pipeline) `CAST` from `beats.json` → `cast`: `new Human(CAST.hero)` in every shot, so the person never changes |
| `core/look2d.js` | 2D layer over the 3D: `caption`, `label(text, x, y, tx, ty, scale)`, `pill(text, x, y, scale, colour)`, `warning(x, y, s)`, `blackout(k)` |
| `src/shots.js` | the per-video file. `screen(vec3, cam)` gives the 2D point of a 3D spot (aim labels at organs) |
| `src/main.js` | renders the 3D frame into the hidden `#gl` canvas, copies it to `#cv`, then 2D + captions |

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

## 4. A shot
```js
add({ id: 'S03', at: cut(2), note: 'x-ray chest, lungs full', draw(lt, d, t, blit) {
  reset(); lungs(1);                                                     // pose everything as a pure function of time
  cam.position.copy(lerpV(V3(0.55, 1.5, 1.6), V3(0.3, 1.42, 1.1), eio(lt / d))); cam.lookAt(0, 1.33, 0);
  E.render(X.scene, cam, { ...XLOOK, focus: cam.position.distanceTo(V3(0, 1.33, 0)) }); blit();
  label('LUNGS: FULL', 760, 520, ...screen(V3(0.1, 1.42, 0.05), cam), eob(seg(lt, 0.2, 0.45)));
} });
```
Keep 2D pills and labels off faces (y 1150-1250 over the torso, or top y 300 when the head is low in frame).

## 5. Rendering speed
Motion blur: `MB=4 node tools/capture.mjs video …` averages 4 sub-frames over a 180° shutter (`SHUTTER=0.5`). Measured on
an M-series Mac: a 5 s shot takes ~10 s without blur and ~35 s with `MB=4`. Use it for final exports only (`faceless.py --mb 4`).

3D frames are heavy without a graphics card. On a normal computer with a GPU it renders at full quality. On a machine
without one (or a cloud sandbox) render with `SOFTWARE_GL=1 QS='&res=0.6&aa=0&shadow=1024' FPS=24` (≈2 s per frame,
~30 min for a 37 s short) and check with `sheet ... 1` (one frame per second) before the full render.

## 6. QA pitfalls we've hit
- A camera inside a light's glow cone washes the frame flat (cones are volumetric meshes): keep cameras out of them.
- Seat backs / props between camera and subject: keep the camera in clear space (centre of an aisle).
- Overlays on faces: check every frame where a pill or warning appears.
- The x-ray body must be x-ray everywhere except the head (`setBodyMaterial`).

## 7. Quality rules when used as the `faceless` source of the bilingual pipeline
- **Cold open:** the first shot is the most extreme image of the video (the consequence, the x-ray, the inside), with the
  camera already moving. No establishing kitchen wide as shot 1.
- **Faces carry the story:** every real-world shot of the hero has a readable reaction: `brow` + `mouth` + `lid` + `look`,
  e.g. shock = `brow: 'raised', mouth: 'O', lid: -0.3`; strain = `brow: 'worried', mouth: 'grimace', lid: 0.5`;
  relief = `mouth: 'smile'`. Change the reaction on the trigger word, not at the cut, and add `lid: Human.blink(t)` when the
  face holds still for over a second.
- **One hero per video:** `new Human(CAST.hero)` from `src/cast.js` in every set and in the x-ray (same proportions).
- **New set per beat:** pick the set that matches the story (bathroom, bedroom, street, classroom, kitchen), then move inside
  (x-ray, vessel, stomach, neurons, alveoli, skin) for the mechanism, and come back out for the ending.
- **Frames on walls:** keep a wall-mounted plane (board, mirror, picture) at least 2 cm in front of its frame, or it flickers (z-fighting).
- **Always a sound moment:** in each mechanism beat, stage one clear close-up action (a twitch, a gulp, a heartbeat pulse)
  that lasts ≥ 0.5 s, so the edit can land a sound on it.
- **Clear lower third:** no pills or labels in y 1250-1550 (the pipeline's captions sit there) and none over the face.
- **Shot length:** slots are 5 s, but the pipeline uses only 2-3 s of each. Put the important motion in the first 2.5 s.
