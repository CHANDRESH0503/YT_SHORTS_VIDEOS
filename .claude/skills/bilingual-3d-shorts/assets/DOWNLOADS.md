# What to download (all free) and where to put it

All paths are relative to `.claude/skills/bilingual-3d-shorts/assets/`.
Only use sounds you may use **commercially without attribution**:
- **Pixabay** (pixabay.com/music, pixabay.com/sound-effects): Pixabay Content License.
- **Freesound** (freesound.org): turn on the **CC0** license filter. Never use CC-BY-NC.
- **Kenney** (kenney.nl/assets, audio packs): CC0.

For every file, write one line in the `LICENSES.md` of its folder: `filename - page URL - license`.

## 1. Background music: `music/<mood>/` (2-3 tracks per mood)
| folder | used for | search terms (Pixabay Music) |
|---|---|---|
| `music/tension/` | body / danger "what happens if" | `dark cinematic tension pulse`, `suspense documentary` |
| `music/curious/` | science, how-it-works | `curious science documentary`, `light pizzicato investigation` |
| `music/upbeat/` | funny or clever true stories | `quirky upbeat comedy`, `playful pizzicato` |
| `music/mystery/` | mysteries, true crime, unexplained | `mystery ambient drone`, `dark mystery documentary` |

What to pick:
- Instrumental only (no vocals), at least 60 s long, mp3 or wav.
- An even energy level for the first 50 s, with no long silent intro.
- Name files simply, e.g. `tension-01.mp3`.
- **Skip any track whose page mentions Content ID.** Those tracks can get claims on YouTube.

The pipeline picks a track from the folder named in `beats.json` `"music_mood"`. Setting `"music": "tension/tension-02.mp3"` picks one exact file.

## 2. Replace the synthesized SFX kit: `sfx/` (same names, WAV)
The current six sounds are synthesized and sound thin. Drop real ones in with **exactly these names**; the pipeline uses them automatically.
If you only have MP3s, put them in `sfx/incoming/` with the same names (e.g. `whoosh.mp3`), and Claude converts them at Stage 0.

| file | what it should sound like | length | search terms |
|---|---|---|---|
| `whoosh.wav` | fast swish for whip cuts | 0.3-0.6 s | `whoosh short`, `swoosh transition` |
| `whoosh2.wav` | deeper swoosh for zoom cuts and the end card | 0.5-0.8 s | `cinematic swoosh low`, `zoom whoosh` |
| `pop.wav` | soft pop when a number or label appears | < 0.3 s | `ui pop`, `bubble pop short` |
| `riser.wav` | tension build into the twist | about 1.4 s | `cinematic riser short`, `reverse whoosh riser` |
| `impact.wav` | the twist hit | 0.8-1.5 s | `cinematic boom impact`, `deep hit` |
| `ding.wav` | bright end ding | < 1 s | `soft ding`, `bright bell notification` |

## 3. Foley library: `sfx/foley/` (close-up sounds on trigger words)
These are the close-up "satisfying" sounds that make Zack D.-style videos feel real. A shot's `"sfx": [{"name": "crack", …}]`
in beats.json plays `sfx/foley/crack.wav` (or .mp3) exactly on its trigger word. Missing files are skipped with a warning.
Names: `squish`, `crack` (knuckle or bone), `gulp`, `heartbeat`, `breath-in`, `breath-out`, `fizz`, `splash`, `tick` (clock),
`stomach-gurgle`, `crunch`, `drip`. Search each name on Pixabay or Freesound (CC0); WAV or MP3 are both fine.

## 4. Ambience beds: `sfx/ambience/` (room tone under every set)
`python3 sfx.py` made synthetic stopgaps (`room-hum`, `wind`, `river`, `night`, `outdoor`). Real recordings sound far
better: same names, 20-60 s, loopable, no voices or music. Search: `room tone`, `wind ambience`, `river stream ambience`,
`night crickets ambience`, `countryside birds ambience`. Add more names freely (e.g. `city`, `lab`, `underwater`); beats.json
`ambience` uses the file name.

## 5. Stingers: `music/stingers/` and kit additions
- `music/stingers/`: 1-3 s musical hits for the payoff (`music_cues` mode `stinger`). Search `cinematic stinger`, `reveal hit`,
  `logo sting short`. The synthetic `stinger-01.wav` is a stopgap.
- `sfx/tick.wav` (UI tick under counters, < 0.1 s, `ui tick`, `clock tick single`) and `sfx/subdrop.wav` (low boom under
  flash cuts, about 1 s, `sub drop`, `bass drop impact`): same names replace the synthetic ones.

## 6. Hero video clips (per project, not here)
See `../references/free-video-tiers.md`. Those go in `projects/<slug>/clips/Sxx.mp4`.
