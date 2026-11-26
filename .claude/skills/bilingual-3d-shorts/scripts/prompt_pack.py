#!/usr/bin/env python3
"""Write prompt_pack.md: copy-paste image-to-video prompts for hero shots (free web tiers).

  python3 prompt_pack.py <slug>
"""
from __future__ import annotations

import argparse

from common import CLIP_EXTS, IMG_EXTS, find_file, iter_shots, load_beats, load_config, project_dir

CAMERA = {
    "push_in": "slow steady camera push-in toward the subject",
    "pull_out": "smooth camera pull-back revealing the wider scene",
    "pan_left": "smooth lateral camera pan to the left",
    "pan_right": "smooth lateral camera pan to the right",
    "tilt_up": "camera tilts up slowly",
    "tilt_down": "camera tilts down slowly",
    "orbit_left": "camera orbits slowly around the subject to the left",
    "orbit_right": "camera orbits slowly around the subject to the right",
    "static_drift": "almost static camera with a gentle handheld drift",
}
MOTION_TAIL = ("Realistic 3D CGI animation, smooth cinematic motion, physically plausible movement, consistent character "
               "design and lighting, keep the exact look of the input image, no text, no subtitles, no morphing, no extra limbs, "
               "vertical 9:16.")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("slug")
    a = ap.parse_args()
    load_config()
    pdir = project_dir(a.slug)
    beats = load_beats(pdir)
    heroes = [(b, s) for b, s in iter_shots(beats) if s.get("hero") and s.get("source") != "code3d"]  # code3d shots already have clips
    L = [f"# Prompt pack - {beats['title']}\n",
         "Generate a **5-second, 9:16** image-to-video clip for each shot below using the free tools in "
         "`references/free-video-tiers.md` (Gemini app / Google Flow Veo, Kling free credits, Meta AI, Hailuo).\n",
         "1. Upload the keyframe image as the **start frame**.\n2. Paste the prompt. Turn audio/sound OFF if offered.\n"
         "3. Download and save as **`clips/<SHOT>.mp4`** in this project folder (exact name).\n"
         "4. Shots you skip are auto-animated (2.5D camera move). When done, tell Claude: `continue " + a.slug + "`.\n",
         f"\nHero shots: **{len(heroes)}** (do the first ones first - they are the hook).\n"]
    for b, s in heroes:
        kf = find_file(pdir / "keyframes", s["id"], IMG_EXTS)
        have = find_file(pdir / "clips", s["id"], CLIP_EXTS)
        motion = s.get("motion_prompt") or s["scene"]
        prompt = f"{CAMERA.get(s['camera_move'], '')}. {motion.strip().rstrip('.')}. {MOTION_TAIL}"
        L.append(f"\n---\n### {s['id']}  ·  beat {b['id']} ({b['role']})  {'✅ clip present' if have else ''}\n")
        L.append(f"- Start frame: `{kf if kf else 'keyframes/' + s['id'] + '.* (missing!)'}`\n")
        L.append(f"- Save as: `{pdir / 'clips' / (s['id'] + '.mp4')}`\n")
        L.append(f"- Narration here (EN): _{b['narration']['en']}_\n\n")
        L.append(f"```text\n{prompt}\n```\n")
    out = pdir / "prompt_pack.md"
    out.write_text("".join(L))
    print(out)


if __name__ == "__main__":
    main()
