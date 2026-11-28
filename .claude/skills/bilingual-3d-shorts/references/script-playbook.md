# Script playbook: one line → 35-90s curiosity-loop Short (90 s hard cap)

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

## 2. Structure (35-90 s, hard cap 90 s including the end card)
**Length:** use the shortest length that fully explains the idea; never pad to fill time. Most topics land at 45-70 s
(≈ 110-190 English words). Go to 75-90 s (≤ 230 words) only when the mechanism genuinely needs the extra steps; past
~60 s every extra second must earn itself with a re-hook (§2c). Scale the structure with the length:

| Length | beats | shots (a new picture every 2-3 s) | EN words |
|---|---|---|---|
| 35-55 s | 6-9 | 14-20 | 100-140 |
| 55-75 s | 8-11 | 20-27 | 140-190 |
| 75-90 s | 10-13 | 26-33 | 190-230 |

The table below is for a ~45 s Short; for longer ones add mechanism/escalation beats in the middle, never a longer hook or payoff.

| # | role | time | job |
|---|---|---|---|
| 1 | hook | 0-3s | Question or shocking claim, **≤ 9 words, finished by 3 s**, no intro, no "In this video" (see §2c). |
| 2 | mechanism | 3-12s | Set up the situation concretely (who/what/where). |
| 3-4 | mechanism / escalation | 12-30s | Step-by-step how it works; each line raises a new question. |
| 5 | twist | 30-38s | "But…" – the counter-intuitive turn. Gets the flash cut + riser. |
| 6-7 | escalation / payoff | 38-50s | Consequence, scale, or real-world result. |
| last | payoff | final 3-5s | Satisfying answer that **echoes the hook** (loop-friendly ending, no "subscribe" in the narration: the automatic channel end card asks for it). |

Rules:
- Every sentence must open a micro-question the next sentence answers ("…which is exactly the problem.").
- Spoken sentences of 8-18 words that run into each other (§2d); never a string of 3-word fragments. Concrete nouns. Present tense for scenes.
- Numbers as words the TTS will read well ("three times", "ninety percent").
- No filler: "basically", "actually" at most once.
- Each beat = 4-7s of narration = 2-3 shots (a new picture every 2-3s; shots are capped at 3s). Mark 5-8 shots `hero: true` (hook shot, mechanism money shot, twist, payoff are mandatory heroes).

## 2c. Retention format (what high-retention 3D explainer Shorts do; write it in our own words)
Research (Nov 2026): 50-60% of viewers who leave do so in the first 3 seconds, and a hook in the first 1-2 seconds keeps
noticeably more of them. Replays count toward retention, so a loop ending pays off.

### The first 2-4 seconds: the three-layer hook (required)
Creator and tool guides (vidIQ, Opus, CapCut, Social Media Examiner; 2026) agree on one model: the viewer decides in the
first frame and the first sentence, so **picture, voice and on-screen text must fire together and make the same promise**.
1. **Visual (frame 0):** the most extreme or strangest moment, already moving. Never an establishing wide, a logo, a title
   card or a slow fade-in. The hook beat gets **2 shots** so the first cut (a pattern interrupt) lands by ~1.5 s.
2. **Spoken (0.15 s → ≤ 3 s):** `B1` is **≤ 9 words** and must be finished by 3 s (validate errors past ~3.6 s; qa.py FAILs
   past 4 s). Tamil too: shorten the Tamil hook first, it runs longer.
3. **On-screen hook title (`hook_text`, frame 0 → when the spoken hook ends):** 3-6 words for sound-off viewers. It adds
   the stakes or poses the question; it does not repeat the caption word for word (`"Stolen from a bird?"` over the spoken
   "This bullet train stole its nose from a bird."). timeline.py shows it from frame 0 with a pop; other callouts wait until it clears.
4. **Sound on frame 0:** the hook title's pop lands at frame 0, plus a foley `sfx` on the hook shot when the image has a sound.

**Hook formulas** (write 3 in `hook_options`, each a different formula, then pick the strongest for B1; show them at Gate 1):
| Formula | Example |
|---|---|
| Shocking claim | "This bullet train stole its nose from a bird." |
| You-in-danger / what-if | "Swallow this, and your stomach starts eating itself." |
| Contradiction | "Sunflowers don't follow the Sun. Not the old ones." |
| Number shock | "A crow just counted to four, out loud." |
| Mid-action question | "Why is this mother bird attacking a cat?" |
**Banned openers** (validate errors): "Did you know", "In this video", "Hey guys", "Welcome", "Today we…", "Let's talk
about", "Have you ever wondered", "So basically". **Open a loop, don't close it:** the hook raises the question; the
answer comes only in the payoff. **Never over-promise:** the payoff must deliver exactly what the hook claimed, or viewers
feel the bait and the retention curve drops.

### Keeping them after the hook
- **Re-hook every ~10-15 s** (validate warns past ~18 s without one): a twist, a new question, a time jump or
  "But here's the catch…". In a 75-90 s Short, plan 4-5 of them; each one opens the next mini-loop.

Rules:
- **Cold open on the most extreme moment.** Shot 1 shows the consequence or the strangest image, not the setup.
  Never open on an establishing wide, a logo or a title.
- **Second person, present tense:** "What happens if you…", "You swallow…", "Your heart…". It puts the viewer in the body.
- **Hook ≤ 10 words, spoken from 0.15 s.** The first picture already matches the first words.
- **Escalate every beat:** each beat is bigger, stranger or closer than the last (time jumps: "after 10 seconds…",
  "after 2 minutes…" work well).
- **One sound moment per mechanism beat:** write a line whose action has a clear, close-up sound (a crack, a gulp, a
  heartbeat), so the edit can land a sound on it.
- **Loop ending:** the last line flows back into the first ("…which is why you should never hold your breath.").
  The payoff restates the answer *and* repeats a key word from the hook.
- **Pick a `music_mood`** in beats.json: `tension` (body/danger), `curious` (science/how-it-works), `upbeat` (funny
  stories), `mystery` (unexplained/true crime).
- Never copy another creator's scripts, shots, titles or name, even when imitating a format.

## 2d. Narration flow: one continuous spoken story (required)
The voice is rendered in **one take** per language from all beats joined together, so the script itself decides whether it
sounds like a storyteller or like a stack of slides. Discontinuity comes from the writing: fragments, beats that start a new
topic cold, new characters with no introduction, and a full stop every four words (each one is a 0.4-0.8 s stall).
**Write the narration as one paragraph first**, read it aloud start to finish, and only then cut it into beats at natural
breath points. Rules:
- **Every beat starts from the last one.** Open with a bridge (But / So / That's why / Here's the trick / Now / Within
  seconds / Which means…) or end the previous beat on a question the next one answers. validate warns on a cold start.
- **One storyline.** Introduce people and objects before they act ("one engineer on the team was a birdwatcher…", not
  "A birdwatching engineer thought of…" out of nowhere). A twist turns the same story; it never switches topic.
- **No fragments.** "Here's why." / "A dive, not a belly flop." / "Ten percent." are fragments: fold them into the sentence
  with a comma, a dash or "and". Sentences of 8-18 words; at most ~2-3 sentences per beat; vary the length so it has rhythm.
- **Write for the ear, not the eye:** no ALL-CAPS words (BOOM → "boom", let the SFX hit), no brackets, slashes, "&", or
  "e.g."; numbers as words; one em-dash or comma where a speaker would breathe, not a full stop.
- **Keep the energy line rising**, then land: short punchy sentence only at the twist and the payoff.
- **Read-aloud test (before Gate 1):** read `script_en.txt` without the beat labels, in one go, at speaking pace. Anywhere
  you stumble, stop, or think "wait, who?" is a discontinuity: fix it. Do the same for Tamil.
- After the voice render, `voice.py` and `qa.py` list any pause over `flow.max_gap_sec` (0.7 s): join those sentences.

**Before → after** (bullet-train Short, B3-B5):
- ✗ "Here's why. The train squeezes tunnel air like a pump. That makes a pressure wave, a wall of air that bursts out the far end. / A birdwatching engineer thought of the kingfisher, which dives in with barely a splash."
- ✓ "Here's why: the train shoves tunnel air ahead of it like a pump, building a pressure wave, a wall of squeezed air that bursts out the far end. / So the team needed a nose that slips in quietly, and one of their engineers, a birdwatcher, knew a bird that does exactly that: the kingfisher, which dives into water with barely a splash."

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
  (auto-calibrated after each render). Trim Tamil until est. ≤ 90 s (and within ~10% of the English) **before** spending credits.
- Flow applies in Tamil too (§2d): open each beat with a bridge (ஆனா, அதனால, அப்போ, இப்போ, அதான்…), avoid one-word
  sentences, and keep the Tamil hook short enough to finish by 3 s.

## 4. beats.json schema
```json
{
  "slug": "crows-can-count",
  "title": "Crows Can Actually Count",
  "topic": "one-line idea from the user",
  "angle": "animal genius",
  "music_mood": "curious",
  "cast": {"hero": {"skin": "#E3A988", "shirt": "#3E7CC9", "hair": "#3A2618"}},
  "style_preset": "realistic-cgi",
  "world": "bright teal-tiled research lab, glossy steel benches, soft overhead strip lights",
  "hook_text": {"en": "Crows can COUNT?", "ta": "காகம் எண்ணுமா?"},
  "hook_options": ["Scientists just proved crows can count out loud.", "This bird can count to four, out loud.", "Why is this crow cawing exactly three times?"],
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
`hook_text` is required (§2c: the 3-6 word on-screen title from frame 0); `hook_options` holds the 3 candidate hooks shown at Gate 1.
Optional per shot: `weight` (relative duration within the beat, default 1), `seed`, `background`.
Top level: `music_mood` (`tension|curious|upbeat|mystery|none`, a folder in `assets/music/`); optional `music` (`"tension/tension-02.mp3"`) picks one exact track;
`cast` (faceless shots: one consistent person); `visual_plan.grade` (`teal|warm-sunlit|night|neutral`).
Per shot, optional `sfx`: `[{"name": "gulp", "trigger": {"en": "swallow", "ta": "முழுங்க"}, "volume": 0.6, "offset_frames": 0}]`
(a close-up sound from `assets/sfx/foley/<name>.*`, placed on the trigger word).
`overlay.text` may be a string (numbers/icons) or `{"en": "...", "ta": "..."}` (labels).
