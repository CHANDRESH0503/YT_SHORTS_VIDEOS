# Visual source decision: code-built 3D, Nano Banana, or faceless-shorts?

Decide **per shot**, right after beats.json is written and before Gate 1. Record it in beats.json, and show it at Gate 1
so the user knows exactly which frames they will have to make in Nano Banana.

There are three sources:
| source | who makes it | what it is good at |
|---|---|---|
| `code3d` | Claude, custom three.js + @remotion/three scenes | precise geometric/technical subjects: devices, digits, circuits, orbits, waves |
| `faceless` | Claude, with the **faceless-shorts** skill's ready-made engines (`faceless.py`) | stylised **people, bodies and stories** in code: sculpted clay-look humans, x-ray bodies, inside-the-body journeys, dark mystery rooms, stick figures, cut-paper maps, cartoon people in a 3D town |
| `nano` | the user, by hand in Nano Banana (Gemini) | anything **photoreal**: realistic people, animals, food, landscapes, real-world textures |

```json
"visual_plan": {"mode": "code3d | nano | faceless | hybrid", "code3d": 9, "nano": 6, "faceless": 0,
                "faceless_style": "deep-dive",   // required when any shot is faceless (one style per video)
                "reason": "one or two sentences: why this split, and what the effort is"},
"shots": [{"id": "S01", "source": "code3d", "source_reason": "exact 7-seg digits + lighting sequence", ...}]
```

## Score each shot (0-2 per question, max 10)
| # | Question | 0 | 1 | 2 |
|---|---|---|---|---|
| 1 | **Buildable from primitives?** (boxes, cylinders, spheres, extrusions, tubes along curves, planes, particles) | organic: faces, hands, animals, food, plants, fabric, terrain | stylised organic or a single simple organic form (an eye, a cell, a planet) | pure geometry: devices, parts, displays, circuits, gears, graphs, molecules, orbits, waves |
| 2 | **Does precision matter?** (exact digits, counts, segment patterns, sequence order, a labelled part) | no | helpful | essential: an AI image would get it wrong |
| 3 | **Does it animate a process?** (states switching, flow, assembly, sequencing, timing) | still mood shot | some motion | the motion IS the explanation |
| 4 | **Reuse?** (same object or rig used in 3+ shots) | single use | 2 shots | 3+ shots: consistency for free |
| 5 | **Effort to look good** | L: complex surfaces, realism hinges on textures (>2h) | M: custom curves/shapes (~20-40 min) | S: assemble helpers + glow (~10-15 min) |

- **Score ≥ 7 → `code3d`.**
- **Score ≤ 4 → `faceless` if a faceless-shorts style fits the shot (table below), otherwise `nano`.**
- **5-6:** choose by the beat's neighbours, keeping a beat's shots on one source where possible.
- **Hard rule:** any shot that needs a **realistic (photoreal)** person, face, animal, food or landscape is always `nano`.
  A **stylised** person or body (clay-look 3D human, x-ray body, stick figure, cartoon or cut-paper figure) can be `faceless`.

## When to use `faceless` (the faceless-shorts styles)
Read the chosen style's `STYLE.md` and look at its `style-sheet.png` (`../faceless-shorts/styles/<style>/`) before planning.
| style (`faceless_style`) | fits | it gives you for free |
|---|---|---|
| `deep-dive` | body / health / science "what happens if", how an organ works | sculpted 3D people in a sunlit kitchen, x-ray glass body with skeleton and organs, inside-a-blood-vessel journey, DOF + bloom |
| `night-file` | mysteries, true crime, unexplained events | dark 3D rooms with one light, faceless people, case-file inserts |
| `inside-out` | a lighter, flat 2D "what happens if" | flat hero, x-ray cutaways |
| `stick-story` | survival steps, "what would you do if" | stick people with acting eyes, flat rooms day and night |
| `paper-atlas` | history, "how X happened", routes and places | parchment maps, routes, date ribbons, period figures |
| `tall-tale` | funny or clever true stories, a con, a loophole | flat cartoon people acting in a sunny 3D town |

Choose `faceless` when the shot is a **person, body or story moment** that one of these looks already covers, and the user
would otherwise have to make it by hand in Nano Banana. Keep `nano` when the shot must look photoreal, or when no style fits.
The faceless engine renders **visuals only**: the voice (ElevenLabs), captions, overlays, grade, end card and Tamil version
stay in this pipeline. Its own Kokoro voice, captions and music are never used here.

## Video-level mode
- **`faceless`** when ≥ 70% of shots fit one faceless style (people/body/story topics). One `faceless_style` per video.
- **`code3d`** when ≥ 70% of shots score ≥ 7. Re-imagine the remaining shots abstractly so the whole video keeps one look
  (for example, the "brain" in the 7-segment Short became time-slices merging).
- **`nano`** when ≤ 30% of shots qualify for `code3d` or `faceless`. Don't set up a 3D rig or a faceless scene set for one or two shots.
- **`hybrid`** otherwise. Group sources by beat (whole beats in one source) and match the grade (teal/cyan, red/cyan
  accents) in the Nano Banana prompts, the 3D `Stage` and the faceless shots (its `look` and colours), so the cuts don't jar.
  Avoid mixing `faceless` with photoreal `nano` people in the same beat: the clay/cartoon look next to a photoreal face jars.

## Efficiency budget
Code-built 3D is efficient only if the whole 3D set fits in about **90 minutes of build + review** (about 6 min per shot on
average). `faceless` shots usually cost less than `code3d` (the sets, people and looks already exist; ~5 min per shot to
write the shot), and rendering is ~30 s per 5 s shot with a GPU. The same 90-minute budget covers both together. Reuse the rigs: one hero object component with props (state, explode, level) should drive several shots.
If the estimate is over budget, move the lowest-scoring code3d shots to `nano`.

## Examples
| Topic | Decision |
|---|---|
| 7-segment display, QR codes, binary, logic gates, how a lock/gear/engine works | **code3d** (precision + process) |
| Solar system scale, sound waves, magnetism field lines, DNA helix (stylised) | **code3d**, or hybrid for a realistic hero shot |
| What happens if you hold your breath / crack your knuckles, how the heart pumps | **faceless** `deep-dive` (x-ray body + inside the body), code3d only for a precise diagram |
| An unsolved mystery, a famous disappearance | **faceless** `night-file` |
| How the Great Fire of London spread, a trade route, a historical event | **faceless** `paper-atlas` |
| A place's history across eras (a temple hill, a city, a disputed site) | **faceless** `paper-atlas`: build one project set of the place (reused in most shots) + a map + document props; no manual stills needed |
| A funny true story, a clever loophole | **faceless** `tall-tale` |
| Crows counting, forensic fingerprints, food, wildlife, real landscapes | **nano** (photoreal), with code3d only for a diagram or counting insert |
| How noise-cancelling headphones work | **hybrid**: a person wearing them (nano) + wave cancellation (code3d) |
