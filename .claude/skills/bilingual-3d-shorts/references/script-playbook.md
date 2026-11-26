# Script playbook: one line → 40-55s curiosity-loop Short

## 1. Research the line (always, before writing)
Use WebSearch (standard mode; extended only if results are thin). Collect into `research.md`:
- The **core mechanism** (how/why it actually works), stated simply.
- 5-8 **surprising, verifiable facts** (numbers, named studies, years, scale comparisons) with source URLs.
- The **common misconception** people hold (fuel for the hook/twist).
- A **visual inventory**: what can be *shown* in 3D (objects, places, cross-sections, scale shots).
- Accuracy flags: anything contested → soften ("scientists think…") or drop it.
Pick ONE angle (state it in research.md):
| Angle | Hook shape | Good for |
|---|---|---|
| Myth-buster | "You've been told X. That's wrong." | everyday beliefs |
| What happens if | "What happens if you … ?" | body, physics, extreme scenarios |
| Hidden mechanism | "This is how X *really* works" | forensics, tech, nature |
| Investigation | "Police couldn't find a fingerprint… until" | crime/forensics, history stories |
| Animal genius | "This bird can do math" | animal behaviour |
Reject angles that are not visual, need on-screen text to understand, or rely on gore. Medical/health: explain, never advise.

## 2. Structure (6-9 beats; 115-150 English words; ≈40-52s)
| # | role | time | job |
|---|---|---|---|
| 1 | hook | 0-3s | Question or shocking claim, ≤ 12 words, no intro, no "In this video". |
| 2 | mechanism | 3-12s | Set up the situation concretely (who/what/where). |
| 3-4 | mechanism / escalation | 12-30s | Step-by-step how it works; each line raises a new question. |
| 5 | twist | 30-38s | "But…" – the counter-intuitive turn. Gets the flash cut + riser. |
| 6-7 | escalation / payoff | 38-50s | Consequence, scale, or real-world result. |
| last | payoff | final 3-5s | Satisfying answer that **echoes the hook** (loop-friendly ending, no "subscribe" in the narration: the automatic channel end card asks for it). |

Rules:
- Every sentence must open a micro-question the next sentence answers ("…which is exactly the problem.").
- Short spoken sentences, 6-14 words. Concrete nouns. Present tense for scenes.
- Numbers as words the TTS will read well ("three times", "ninety percent").
- No filler: "basically", "actually" at most once.
- Each beat = 5-8s of narration = 2-3 shots. Mark 5-8 shots `hero: true` (hook shot, mechanism money shot, twist, payoff are mandatory heroes).

## 2b. Narrative style: explain, don't just list facts
A Short that only *states* facts ("the east side grows faster") leaves the viewer nodding but not understanding.
The narration must make the viewer able to **explain it to a friend afterwards**. Build the explanation first, then the script.

**Step 1: the explanation spine (`explainer` in beats.json, written before any narration).**
- `question`: what the viewer is really asking, in their words ("How does a flower know where the Sun is?").
- `answer`: the whole mechanism in one plain sentence, ≤25 words, words a 12-year-old knows. If you can't write it, research more.
- `chain`: 3-5 cause → effect steps that get from the question to the answer. No step may need a fact the viewer doesn't have.
- `analogy`: one everyday comparison for the hardest step (a bent arm, a light switch, a relay race, a phone's alarm).
- `terms`: every technical word the narration uses, each with the plain meaning that is spoken with it.

**Step 2: write each beat as What → Why → So.**
- Mechanism/escalation beats: state what happens, then **why** it happens, then what that causes. Use real causal links:
  "because", "so", "which means", "that's why", "here's how". A chain of bare facts with no "why" is a list, not an explanation.
- **Define on first use**, in the same sentence: "an inner clock, a twenty-four-hour timer inside every cell". Never leave a term undefined.
- Put the **analogy at the hardest step**, and say it in plain words ("like a banana: the longer side is always the outside of the curve").
- **Bridge every beat** to the one before: "But…", "So…", "That's why…", "Here's the catch…". The viewer must never wonder why we're now talking about this.
- Point at the picture: "watch the stem", "see this side?". The visual and the words explain the same step at the same time.
- One new idea per beat. If a beat teaches two things, split it or cut one.
- A provocative hook ("clocks are lying to you") is fine only if a later beat says literally what it means.
- The payoff restates the `answer` in one sentence and closes the hook's promise; the viewer should feel "oh, *that's* why".

**Before → after** (sunflower, B3 and B5):
- ✗ "The trick is in its stem. By day, the east side grows faster, bending the head west."
- ✓ "The trick is in the stem. By day, its east side grows longer than the west. A stem that's longer on one side has to curve, like a banana, so the head tips west."
- ✗ "Put it under a lamp that never moves, and it still turns. An inner clock runs it."
- ✓ "Put it under a lamp that never moves, and it still turns, because it runs on an inner clock, a twenty-four-hour timer that expects the dawn."

**Self-test before validating:** read only the narration aloud. Could someone who has never seen the video answer `question`
using the `answer`? Is every "how" followed by a "why"? If not, rewrite that beat; cut a fun fact before you cut an explanation.

## 3. Tamil transcreation (not translation)
- Write natural **spoken Tamil** a Chennai/Madurai YouTube narrator would use: friendly, energetic, slightly informal
  (e.g. "தெரியுமா?", "இதுதான் விஷயம்!", "ஆனா…"). Avoid heavy literary Tamil (செந்தமிழ்) and avoid full Tanglish.
- Keep widely used English terms in Tamil script or as-is when Tamil speakers say them that way: DNA, WiFi, lab,
  police, scientist→விஞ்ஞானிகள் (prefer Tamil when common). Digits as Tamil words ("மூன்று முறை").
- Same beat boundaries and same meaning per beat (visual sync depends on it); wording may change freely.
- Keep the same explanation in Tamil: the causal links ("ஏன்னா", "அதனால", "அதான்", "அப்படின்னா"), the term definitions
  ("அதாவது …") and the analogy ("… மாதிரி"). Choose an analogy a Tamil viewer knows; it may differ from the English one.
- Hook in Tamil must be just as punchy – rewrite idiomatically, don't mirror English syntax.
- Overlay `trigger.ta` must be a word that actually appears in that beat's Tamil narration; `label` overlays need a Tamil text.
- Length: Tamil characters per second are lower – `project.py validate` estimates duration from config `chars_per_sec`
  (auto-calibrated after each render). Trim Tamil until est. 40-55s **before** spending credits.

## 4. beats.json schema
```json
{
  "slug": "crows-can-count",
  "title": "Crows Can Actually Count",
  "topic": "one-line idea from the user",
  "angle": "animal genius",
  "style_preset": "realistic-cgi",
  "world": "bright teal-tiled research lab, glossy steel benches, soft overhead strip lights",
  "explainer": {
    "question": "Can a bird really count, or is it just guessing?",
    "answer": "Crows have brain cells that each fire for one number, so they can learn to caw exactly that many times.",
    "chain": ["crows are shown a number", "a matching group of brain cells fires", "they plan the caws before the first one", "so the count comes out right"],
    "analogy": "like a person counting on their fingers before speaking",
    "terms": [{"term": "number neurons", "plain": "brain cells that each light up for one number"}]
  },
  "assets": [
    {"id": "crow", "description": "a sleek black carrion crow with glossy blue-black feathers, sharp grey beak, bright intelligent eyes", "seed": 41721},
    {"id": "scientist_f", "description": "a female scientist in her 30s, white lab coat over a teal t-shirt, dark hair in a low bun"}
  ],
  "beats": [
    {
      "id": "B1", "role": "hook",
      "narration": {"en": "Scientists just proved crows can count out loud.", "ta": "காகம் சத்தமா எண்ணும்னு விஞ்ஞானிகள் நிரூபிச்சுட்டாங்க!"},
      "shots": [
        {"id": "S01", "scene": "a black crow perched in front of a computer monitor showing a large number 3, looking at the screen",
         "asset_refs": ["crow"], "camera_move": "push_in", "hero": true,
         "lighting_camera": "low angle, 35mm lens, bright rim light on feathers",
         "motion_prompt": "the crow tilts its head toward the screen and opens its beak to caw",
         "overlay": {"kind": "number", "text": "3", "trigger": {"en": "count", "ta": "எண்ணும்"}}}
      ]
    }
  ]
}
```
`explainer` is required (see §2b); every `terms[].term` must appear in the English narration.
Optional per shot: `weight` (relative duration within the beat, default 1), `seed`, `background`.
`overlay.text` may be a string (numbers/icons) or `{"en": "...", "ta": "..."}` (labels).
