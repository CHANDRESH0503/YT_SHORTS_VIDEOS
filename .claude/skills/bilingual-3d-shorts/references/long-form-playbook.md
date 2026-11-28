# Long-form playbook (4-12 min videos)

Read this for any request for a long video (over ~3 minutes, "a full video", "a documentary", "a 10-minute video").
Long-form is a **format** of this pipeline: same EN + TA outputs, same visual sources (code3d / faceless / nano), same voice,
timeline, polish and QA stages, but it is **planned first in `outline.json`** (chapters, time budget, open loops, re-hooks,
recurring cast and sets, production budget) and approved at **Gate L** before any `beats.json` is written.
Limits live in `config.json → long_form` and apply when `beats.json` / `outline.json` has `"format": "long"`.

## 1. What the reference video does (teardown, 2026-11-28)
Reference: an animated business/spy story documentary in the repo root (19:48, 1920x1080, 30 fps). Measured by scene
detection, Whisper transcription and a frame every 6 s. Use it as the **format** model, never its script, characters or shots.

| part | time | what happens |
|---|---|---|
| Cold open | 0:00-0:39 | In medias res: the most dramatic scene of the whole story (a dinner), who the two people are, the stakes, a dramatic-irony fact ("agents are taking pictures… he has no idea"), then the central question ("…and who was watching?") and the door into the story ("It starts with a phone call…"). |
| Title sting | 0:40-0:42 | The video title on a hero still (one word redacted), ~2.5 s, silent. |
| Ch 1 "The Man With the Key" | 0:42-4:31 | Origin backstory of the protagonist: underdog childhood, a funny human detail, the company born in a diner, a near-death moment ("30 days from going out of business"), the core mechanism explained with an everyday analogy (one chef vs 10,000 line cooks). Ends by raising the stakes: "That made him the one man [the antagonist] needed most." |
| Ch 2 "The Locked Door" | 4:31-6:01 | The problem the antagonist faces (a ban), numbers made concrete ("a new car per chip"), the antagonist's plan in one line ("It doesn't crack the safe. It befriends the man with the key."). |
| Ch 3 "The Cover" | 6:01-10:20 | How the plan works: front company, analogy (rent cars parked over the border), the first meeting, money growing 90x (lemonade-stand analogy), an inspector who finds nothing. **Midpoint reveal at ~9:51 (50%)**: "American spies were already listening to her." |
| Ch 4 "The Pipeline" | 10:20-11:49 | Where the goods came from; scale vs a real smuggling case ("didn't need lobsters, it had invoices"). |
| Ch 5 "What She Was After" | 11:49-15:38 | The real goal (the person, not the chips); the policy whiplash shown as a repeated mini-scene (blocked → 15 % → 25 %); "Now look at it from Beijing." |
| Ch 6 "The Memo" | 15:38-19:48 | The proof surfaces, the public fallout, an **unanswered question** ("Why did nobody tell him?"), what it means **for the viewer's own wallet**, then a **callback to the cold-open scene** (the empty chair) and a closing question that loops. |

Measured craft rules:
- **Pace:** 3,138 words in 19.8 min = **158 wpm** overall (187 wpm while speaking; the rest is music beats and silent cards).
- **Picture changes:** 389 shots, **median 2.4 s**, mean 3.05 s, 90 % under 6.1 s. The cut rate holds at 15-34 cuts per minute
  from the first minute to the last minute, so pacing never relaxes after the opening.
- **Chapter cards:** 6 chapters of 1.5-4.3 min, each opened by a **2-3 s black card** with a 2-5 word title ("The Cover").
  A ~2.7 s pause in the voice sits under each card, and these are the only long silences.
- **Text cards:** ~50 short black typewriter cards (about one every 24 s) carry the punch lines and numbers ("Nvidia had about one month of payroll").
  They work as visual pattern interrupts that cost nothing to make.
- **Dialogue skits:** every 20-60 s the narration hands over to 3-8 lines of character dialogue (short, funny, in-world).
  It explains the mechanism *as a scene* ("Can we buy your chips?" "No. But you can rent them." "By the hour?" "By the warehouse.").
- **One analogy per hard idea**, always from everyday life (chef/line cooks, renting cars, lemonade stand, older cousin buying beer).
- **Numbers made personal:** "$4.5 billion… about $13 from every person in America", "a parking lot of 60,000 new cars".
- **Running callbacks / motifs:** a repeated line ("Dishes first", "We make friends"), recurring sets (diner, spy office with a
  numbered door, the whiteboard office whose numbers keep getting crossed out) and a recurring prop (the empty chair).
- **Teasers that keep loops open:** "Nobody looks at those photos twice. Later, someone will." "Hold that thought."
- **Date / place tags** on every time jump ("JUNE 2024 · TAIPEI"), so a non-linear story never confuses.
- **Recurring cast** with fixed looks: 2 leads + ~10 side characters, all in one flat-2D cartoon style in 2.5D sets.
- **Ending:** resolution → open question → "here's where it reaches *you*" → callback to the cold-open image → final line from a key character.

## 2. What the research says (web, 2026-11-28)
- **Cold open 0:00-0:45, outcome or most dramatic moment first, no logo, no intro**. Business-documentary teardowns put the arc
  as Setup → The decision (the beat where retention holds or collapses) → Unravel → Aftermath → Lesson for a ~11-min video
  ([OutlierKit format teardown](https://outlierkit.com/resources/faceless-business-documentary-channels/)).
- **Script length:** 1,400-1,800 words for 10-11 min (≈ 130-165 wpm); plan at **150 wpm** (OutlierKit; [mysocial](https://mysocial.io/blog/make-youtube-script/) uses ~150 wpm).
- **First interrupt at 25-35 s**, a visual change every 5-7 s at minimum, an interrupt every 30-60 s and a **re-hook every 2-3 min**. Mid-video
  decline comes from flat pacing with no re-hooks; cliffs come from tangents and "before we start" detours. Smooth chapter seams with L-cuts and continuous music ([Pixflow retention guide](https://pixflow.net/blog/?p=93140)).
- **Chapters** 3-4 in a short doc, each ending on a mini-cliffhanger; stitch beats with **"but / therefore", never "and then"**
  ([Tony Zhou / South Park rule](https://nofilmschool.com/2015/04/tony-zhou-storytelling-video-essay-f-fake-therefore-but-and-then); [Ken Burns: story is conflict and not knowing how it ends](https://www.masterclass.com/classes/ken-burns-teaches-documentary-filmmaking/chapters/structuring-a-documentary-narrative)).
- **Retention benchmarks:** ~24-30 % average view percentage is typical; 40-50 %+ is strong for long-form
  ([vidIQ](https://vidiq.com/blog/post/increase-audience-retention-youtube/)). The Intro metric is the share still watching at 0:30.
- **YouTube chapters:** at least 3 timestamps, the first at 00:00, each chapter at least 10 s ([YouTube Help: video chapters](https://support.google.com/youtube/answer/9884579?hl=en)).
- **Mid-roll ads** only on videos **8:00 or longer**. YouTube favours natural breaks (pauses, transitions), so put breaks at chapter
  cards, right *after* a cliffhanger line, never after a resolved point ([YouTube Help: mid-roll](https://support.google.com/youtube/answer/6175006); Pixflow).
- **ElevenLabs** `eleven_multilingual_v2`: **10,000 characters per request** ([models](https://elevenlabs.io/docs/models)). At ~15 chars/s a
  single take tops out near **11 min**, and a 9-min EN + TA video needs ~16k characters, more than a free month (~10k).
- **Free voice alternatives** (tested 2026-11-28, voice-and-captions.md §Providers): the Microsoft Edge voices (edge-tts) rendered
  a 10,260-character English take (10:22) in one request with all 2,185 word timings, and Tamil (ta-IN-Valluvar/Pallavi) with exact
  word timings over 13.9 KB of text.

## 3. Structure template (fill `outline.json` from this)
1. **Cold open (20-60 s).** Start on the most dramatic or most surprising moment of the story, already in motion. Name who it is about
   and the stakes, and plant one dramatic-irony fact or a contradiction. End on the **central question** and a door line
   ("It starts with…"). No logo, no "in this video". The spoken first line still follows §2c (no warm-up opener).
2. **Title sting (2-3 s).** The video title over a hero still, no voice.
3. **Chapters (3-7, 45-180 s each; table below).** Each chapter has:
   - a **2-5 word title** card (a noun phrase with a little mystery: "The Cover", "The Locked Door"),
   - a **goal**: what the viewer understands by the end,
   - a **turn** ("but / therefore") that changes the situation,
   - at least one **re-hook** inside it (a question, "Hold that thought", "Later, someone will", a reveal), so no stretch runs over ~90 s without one,
   - an **analogy** for its hardest idea and **numbers made concrete** (per person, in cars, in everyday money),
   - a **cliffhanger** last line that pulls into the next chapter (all chapters but the last).
4. **Midpoint twist (35-70 % of the runtime).** A reveal that reframes everything before it (the example's lands at 50 %).
5. **Ending.** Resolve the central question, admit the open one if real, say **what it means for the viewer**, then **call back
   to the cold-open image** and close on a line that loops. One sentence of lesson at most. Never "to recap".

| length | chapters | words (150 wpm) | shots (~3 s) | re-hooks (≤ 90 s apart) |
|---|---|---|---|---|
| 4-6 min | 3-4 | 600-900 | 80-120 | 4-6 |
| 7-9 min | 4-6 | 1,050-1,350 | 140-180 | 6-9 |
| 10-12 min | 5-7 | 1,500-1,800 | 200-240 | 8-12 |

## 4. Visual plan for long-form
- **Aspect 16:9 (1920x1080).** YouTube long-form is landscape. Keep Shorts at 9:16.
- **Budget comes from reuse.** 150-240 shots cannot each be a new world. Plan **4-8 recurring sets** and a **cast bible**
  (`recurring.cast`, the same look in every shot), plus 1-3 **motifs** (a prop or line that comes back). Every chapter names
  the sets it uses. The faceless-shorts engines fit best: `tall-tale` (flat 2D cartoon people in a 3D world, the closest
  match to the reference), `night-file` (spy/crime scenes), `paper-atlas` (maps, dates, routes), `inside-out` (mechanism cutaways).
  Use `nano` for the few photoreal hero stills, and `code3d` for mechanisms and data.
- **Cheap interrupts** for long-form: black **text cards** (one punch line or number each, about every 20-40 s), **date/place tags**
  on every time jump, **maps** with a route line, infographic overlays for every number, and **chapter cards** (2-3 s).
- **Dialogue skits.** The pipeline has one narrator voice per language, so write skits as *narrated quotes* or as speech
  bubbles / on-screen text over the scene. Mark them `"skit": true` in the outline so the shot list gives them a scene.
- **Cut rate** stays 2-4 s on average (`long_form.avg_shot_sec`), and a single shot may run up to 6 s for a slow reveal
  (`overrides.video.max_shot_sec`). The rate must not drop after minute 2.

## 5. Production budget (the plan prints this)
- **Voice characters:** ≈ seconds × `voice.<lang>.chars_per_sec` per language. The plan warns per provider: ElevenLabs over
  `long_form.voice_free_chars_month` (10k) or over 10,000 characters in one language (one request).
  For long-form the **edge** voice is the default recommendation (free, no limit, one continuous take, exact word timings);
  set `voice.provider` (or `voice.<lang>.provider`) before Gate L. Never spend credits without approval.
- **Shots and sets:** shots ≈ seconds / `avg_shot_sec`; the plan counts distinct sets and warns above `max_sets`.

## 6. Packaging (Stage 8 for long-form)
- Title: the outcome or the mystery ("How a … got inside …"), with the thumbnail showing the cold-open moment.
- Description: the YouTube **chapters** list (`project.py plan` writes `chapters_<lang>.txt` from the real audio once voices exist).
- Mid-roll (≥ 8:00): put ad breaks at the chapter cards right after a cliffhanger. The plan lists them.
- **Shorts cut-downs:** plan 2-3 Shorts from chapters whose turn stands alone (`shorts_cutdowns`), each re-made as a 9:16 Short
  through the normal pipeline and pointing to the long video.

## 7. `outline.json` (written at Stage L2, checked by `python3 project.py plan <slug>`)
```json
{
  "format": "long", "minutes_target": 9, "aspect": "16:9",
  "title_working": "How a … got inside …",
  "promise": "what the title + thumbnail promise, delivered in the cold open",
  "central_question": "Who was watching?",
  "cold_open": {"scene": "the most dramatic moment, in motion", "line": "first spoken line", "stakes": "…",
                "irony": "what we know that they don't", "question": "the central question", "est_sec": 40},
  "chapters": [
    {"id": "C1", "title": "The Man With the Key", "goal": "…", "turn": "but / therefore …", "analogy": "…",
     "rehooks": ["Hold that thought…"], "numbers": ["$600 → $8 billion"], "skit": true, "sets": ["diner"],
     "cliffhanger": "That made him the one man they needed most.", "est_sec": 110}
  ],
  "midpoint_twist": {"chapter": "C3", "what": "the reveal that reframes everything"},
  "loops": [{"question": "Who was watching?", "opened_in": "cold_open", "closed_in": "C3"}],
  "ending": {"resolution": "…", "you_angle": "what it means for the viewer", "callback": "the cold-open image again",
             "final_line": "…", "est_sec": 40},
  "recurring": {"cast": [{"id": "hero", "who": "…", "look": "…"}], "sets": [{"id": "diner", "desc": "…"}], "motifs": ["the empty chair"]},
  "visual_plan": {"mode": "faceless|hybrid|…", "faceless_style": "tall-tale", "reason": "…"},
  "shorts_cutdowns": [{"chapter": "C2", "hook": "…"}]
}
```

## 8. From outline to `beats.json`
After Gate L, write `beats.json` with `"format": "long"` and an `"outline_ref": true`. Every beat gets `"chapter": "C1"` (or
`"cold_open"` / `"ending"`). Beats may carry up to `long_form.max_shots_per_beat` shots. The first beat is only the cold open's **first line** (`role: hook`, `chapter: cold_open`, ≤ 18 words, said by ~6 s); the rest
of the cold open follows in more `cold_open` beats,
the last is the ending (`role: payoff`), and there is at least one `twist`. Put the chapter title card on the chapter's first beat as
`"chapter_card": {"en": "The Cover", "ta": "…"}`. (The 16:9 render, chapter cards and text cards are
not built yet: see SKILL.md "Long-form mode → not built yet".) All Short rules still apply (§2b explanation, §2d flow, one take per language,
numbers on screen), except the hook can run up to ~6 s and `hook_text` is optional. `project.py validate` checks the chapter
budget against the outline.
