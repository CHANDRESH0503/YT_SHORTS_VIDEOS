# Visual source decision: code-built 3D or Nano Banana?

Decide **per shot**, right after beats.json is written and before Gate 1. Record it in beats.json, and show it at Gate 1
so the user knows exactly which frames they will have to make in Nano Banana.

```json
"visual_plan": {"mode": "code3d | nano | hybrid", "code3d": 9, "nano": 6,
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
- **Score ≤ 4 → `nano`.**
- **5-6:** choose by the beat's neighbours, keeping a beat's shots on one source where possible.
- **Hard rule:** any shot that needs a realistic person, face, animal, food or landscape is always `nano`.

## Video-level mode
- **`code3d`** when ≥ 70% of shots score ≥ 7. Re-imagine the remaining shots abstractly so the whole video keeps one look
  (for example, the "brain" in the 7-segment Short became time-slices merging).
- **`nano`** when ≤ 30% of shots qualify. Don't bother building a 3D rig for one or two shots.
- **`hybrid`** otherwise. Group sources by beat (whole beats in one source) and match the grade (teal/cyan, red/cyan
  accents) in both the Nano Banana prompts and the 3D `Stage`, so the cuts don't jar.

## Efficiency budget
Code-built 3D is efficient only if the whole 3D set fits in about **90 minutes of build + review** (about 6 min per shot on
average). Reuse the rigs: one hero object component with props (state, explode, level) should drive several shots.
If the estimate is over budget, move the lowest-scoring code3d shots to `nano`.

## Examples
| Topic | Decision |
|---|---|
| 7-segment display, QR codes, binary, logic gates, how a lock/gear/engine works | **code3d** (precision + process) |
| Solar system scale, sound waves, magnetism field lines, DNA helix (stylised) | **code3d**, or hybrid for a realistic hero shot |
| Crows counting, forensic fingerprints, human body organs, history stories | **nano** (organic/realistic), with code3d only for a diagram or counting insert |
| How noise-cancelling headphones work | **hybrid**: a person wearing them (nano) + wave cancellation (code3d) |
