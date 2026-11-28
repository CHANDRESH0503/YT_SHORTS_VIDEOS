---
name: shorts-publish-kit
description: Make the publish kit for a finished bilingual Short (thumbnail, title, description and tags) in English for the "How is this" channel and in Tamil for "How is this - Tamil". Use it after QA passes in bilingual-3d-shorts (Stage 8), or when the user asks for a thumbnail, title, description, tags or SEO for a Short or project slug.
---

# Shorts publish kit (EN + TA)

For a QA-passed project in `YT_VIDEOS/projects/<slug>/`, this produces:
- `final/thumbnail_en.jpg` and `final/thumbnail_ta.jpg`: 1080x1920 9:16, branded with the channel badge
- `final/thumbnail_<lang>_16x9.jpg`: 1280x720 variants
- `final/publish_en.md` and `final/publish_ta.md`: title, alternative titles, full description, tag string and hashtags, ready to paste

Channels (from `config.json`): **en → "How is this"**, **ta → "How is this - Tamil"**.

Paths: `PK=YT_VIDEOS/.claude/skills/shorts-publish-kit`. Run the scripts as `python3 $PK/scripts/publish_kit.py <cmd> <slug>`.
The thumbnail is rendered by the `Thumbnail` Still in `bilingual-3d-shorts/remotion` (same fonts as the video, so Tamil shaping is correct).
Read `references/seo-playbook.md` before writing any copy.
Also read the "Publish kit" section of `../bilingual-3d-shorts/references/learnings.md` (lessons from past kits).

## Steps
1. **Precondition:** `final/<slug>_en.mp4` and `final/<slug>_ta.mp4` exist and `qa_report.md` has no FAIL.
   If they don't, stop and say which stage to re-run.
2. **Frames:** run `publish_kit.py frames <slug>`, then view `qa/thumb_candidates.jpg`. The candidates are clean hero keyframes in
   the printed order, left to right and top to bottom. Pick the most striking one (one clear subject, high contrast, room at the top for text).
3. **Copy:** read `research.md`, `beats.json`, `script_en.txt` and `script_ta.txt`, then write `publish.json` in the project dir
   (the schema is in the script docstring). Use `sources` from research.md. Write the Tamil as a transcreation in spoken Tamil.
4. **Validate:** run `publish_kit.py validate <slug>`, fix every error, and re-run until `ok: true`. Resolve warnings where sensible.
5. **Thumbnails:** run `publish_kit.py thumbs <slug>`, then view both thumbnails. Check that the Tamil glyphs are intact, the text
   sits in the upper third, the badge shows the right channel, nothing hits the bottom 20%, and it still reads at phone size
   (look at a 270px-wide downscale too). If the text is too long or the frame too busy, edit `thumb_text`/`thumb_shot` and re-run.
6. **Finalize:** run `publish_kit.py finalize <slug>` (or `all` for steps 4-6 in one go).
7. **Report:** give the user the 4 thumbnail paths and the 2 publish files, with the chosen titles and one line on why that frame
   was picked. Never upload or publish anything; the user does that.
8. **Feedback loop:** run bilingual-3d-shorts Stage 9 (`../bilingual-3d-shorts/SKILL.md`). Record thumbnail, title and SEO lessons
   from this kit (frames rejected, text that didn't fit, user edits) in learnings.md "Publish kit".

## Rules
- Titles and thumbnails must be true to the video: no clickbait the video doesn't pay off.
- No real people, celebrities, brands, logos or other creators' names in any field.
- Keep the ElevenLabs attribution while the voices come from the free tier (`config.json → attribution.enabled`). It is added only
  for a language whose narration ElevenLabs made (`audio/<lang>/words.json → provider`); the edge voice needs no credit line.
  Set it to false only if the user confirms a paid plan.
- To change a channel name, edit `config.json → channels` (and `channel_lines`/`cross_links`).
