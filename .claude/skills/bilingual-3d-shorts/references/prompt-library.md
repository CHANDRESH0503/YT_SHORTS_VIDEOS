# Prompt library

## Keyframe prompt grammar (built by `keyframes.py` into `keyframes/NANO_BANANA.md`)
Nano Banana follows natural sentences better than tag lists:
`Create a vertical 9:16 portrait image. [scene]. The [asset] is [description] - match the uploaded reference image exactly. Style: [preset]. Camera and lighting: [lighting_camera]. Setting: [world]. No text/logos/watermark.`

Write `scene` as one concrete sentence: **who/what + doing what + where in frame**.
Good: "a forensic technician's gloved hands lowering a brass bullet casing into a glass beaker of blue liquid, centered".
Bad: "forensics science stuff", "showing how fingerprints work".

### Style presets (config.json → `style_presets`)
- `realistic-cgi` (default, matches References): UE5-style cinematic CGI, glossy PBR, teal/cyan, rim light, shallow DOF.
- `clay-stylized`: rounded polished clay shaders – for cute/kids/food topics.
- `macro-anatomy`: translucent glossy tissue cross-sections – body/medical topics.
Never put brand names, channel names, creator names, or real people in prompts.

### Shot-type phrases (put in `lighting_camera`)
- Establishing: "wide establishing shot, 24mm lens, eye level, deep background detail"
- Medium: "medium shot, 35mm lens, subject on the left third"
- Macro money shot: "extreme macro close-up, 100mm macro lens, shallow depth of field, tiny particles in the air"
- Cross-section: "cutaway cross-section view revealing the inside, glowing internal parts"
- Drama: "low angle hero shot, strong backlight, volumetric light rays"
- Scale: "top-down aerial view, tiny figures for scale"

### Consistency tactics
1. Describe each recurring asset once in `assets[].description` with 3-5 **distinctive** features (colour + clothing + one prop); the pipeline pastes it verbatim into every shot.
2. Keep one `world` string for the whole video.
3. Prefer shots where recurring characters are small, from behind, or partially framed (hands, silhouettes) – drift is less visible.
4. Nano Banana takes reference images: make `asset_<id>.png` first, then upload it with every shot that lists it in `asset_refs`. This is the main consistency lever.

## Motion prompts (`motion_prompt`, used in prompt_pack.md)
One sentence of **in-shot action** (the camera move is added automatically):
- Subject action: "the crow pecks the red button twice, feathers ruffling"
- Physics: "blue liquid bubbles and fizzes around the casing as tiny sparks of electricity crawl over the metal"
- Reveal: "a fingerprint pattern slowly glows into view on the brass surface"
- Character: "the scientist turns to her colleague in surprise, lowering her clipboard"
Avoid: multiple actions, scene changes, text on screens, fast complex hand motions (models break on these).
The tail appended to every motion prompt asks for realistic CGI animation, consistent look, no text, no morphing, 9:16.
