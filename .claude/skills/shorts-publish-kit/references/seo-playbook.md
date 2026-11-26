# SEO playbook: titles, thumbnails, descriptions and tags for Shorts

Channels: **How is this** (English) and **How is this - Tamil** (Tamil). Each language goes to its own channel, so every
field is written natively for that audience. Tamil is **transcreated**, never translated word for word.

## Title (`title`, plus 3 `title_options`)
- ≤60 chars (the hard limit is 100). The first 40 chars carry the curiosity, because mobile truncates the rest.
- It echoes the video's hook: a surprising claim, a question, or "the hidden X". It must be **true**: no promise the video doesn't keep.
- Put the main search keyword in naturally ("7-Segment Display", "crows", "fingerprints").
- No ALL-CAPS sentences (one caps word is fine), no "<" or ">", no emoji spam (0-1 emoji), no #hashtags in the title.
- Shapes that work: "Your X Is Lying To You" · "Why X Never Y" · "How X Really Works" · "X Can Do Y?!"
- **Tamil:** spoken, punchy Tamil ("…ஏமாத்துது!", "…தெரியுமா?", "…எப்படி?"). You may keep ONE English search keyword
  as people type it (7-Segment, LED, DNA). The validator requires ≥40% Tamil script.

## Thumbnail text (`thumb_text`)
- 2-4 words, ≤34 chars, **different from the title** (the two work together; don't repeat).
- `|` breaks lines, and `*word*` marks the one accent word (cyan glow). Example: `Your clock is|*LYING*`.
- Tamil: 1-3 short words, for example `கடிகாரம்|*ஏமாத்துது!*`. Long Tamil words shrink automatically.
- Frame (`thumb_shot`): the most striking clean frame. Run `frames` and pick from the sheet. Prefer one clear subject,
  high contrast, and space in the upper third for the text. `thumb_time` (sec) grabs a frame from `clips/Sxx.mp4` instead.

## Description
The script assembles it in this order, so write only `hook_line` and `body`:
1. `hook_line`: one line restating the hook, with the main keyword in the first ~100 chars (that's what shows in search).
2. `body`: 2-3 short lines that explain the answer (the payoff), with 1-2 secondary keywords.
3. Sources (from research.md → `sources`), the channel line, a cross-link to the other-language channel, and the ElevenLabs
   attribution (while on the free tier).
4. Hashtags (from `hashtags`).

## Hashtags (`hashtags`)
3-5 hashtags, `#shorts` first. Only the first 3 show above the title, so #2 and #3 are the strongest topic tags.
Tamil: include `#tamil` plus a Tamil-audience tag (for example `#tamilscience`).

## Tags (`tags`)
10-20 tags, ≤500 chars in total (YouTube counts commas). In order:
1. exact topic ("7 segment display", "seven segment display")
2. how/why phrasing ("how 7 segment display works", "how digital clocks work")
3. related concepts ("multiplexing", "persistence of vision", "led display")
4. broad ("electronics", "engineering", "science shorts")
5. the channel name ("How is this" / "How is this - Tamil")
Tamil tags mix Tamil and the English/Tanglish people search: "7 segment display tamil", "electronics in tamil",
"எலக்ட்ரானிக்ஸ்", "டிஜிட்டல் கடிகாரம்".
No commas, no "<" or ">", no other creators' or brands' names, and nothing misleading.

## Never
Real people, celebrities, brand names or other channels' names; clickbait that the video doesn't pay off; medical advice.
