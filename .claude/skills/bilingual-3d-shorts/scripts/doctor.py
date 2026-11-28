#!/usr/bin/env python3
"""Environment check. Never prints secret values.

  python3 doctor.py            # all checks
  python3 doctor.py --tamil    # also render a Tamil caption still -> qa_tamil_test.png (view it to verify shaping)
"""
from __future__ import annotations

import argparse
import json
import os
import shutil
import subprocess
import urllib.request

from common import ASSETS_DIR, LANGS, REMOTION_DIR, ROOT, SKILL_DIR, disk_free_gb, faceless_styles, find_chrome, load_config, load_env


def check(name, ok, detail="", fix=""):
    extra = detail or ""
    if not ok and fix:
        extra = f"{extra} -> fix: {fix}" if extra else f"fix: {fix}"
    print(f"{'OK  ' if ok else 'FAIL'}  {name}{(' - ' + extra) if extra else ''}")
    return ok


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--tamil", action="store_true")
    a = ap.parse_args()
    load_env()
    all_ok = True
    free = disk_free_gb()
    all_ok &= check("disk space", free >= 5, f"{free:.1f} GB free (need >=5, recommend 10+)")
    for tool in ("node", "npx", "ffmpeg", "ffprobe", "python3"):
        all_ok &= check(f"{tool} on PATH", bool(shutil.which(tool)))
    if shutil.which("node"):
        v = subprocess.run(["node", "--version"], capture_output=True, text=True).stdout.strip()
        all_ok &= check("node >= 18", int(v.lstrip("v").split(".")[0]) >= 18, v)
    filt = subprocess.run(["ffmpeg", "-hide_banner", "-filters"], capture_output=True, text=True).stdout
    for f in ("loudnorm", "ebur128", "blackdetect", "freezedetect", "tile", "atempo"):
        all_ok &= check(f"ffmpeg filter {f}", f" {f} " in filt)
    all_ok &= check("remotion installed", (REMOTION_DIR / "node_modules" / "remotion").exists(),
                    fix="cd remotion && npm install (Chrome for Testing downloads on first render)")
    all_ok &= check("sfx kit", len(list((ASSETS_DIR / "sfx").glob("*.wav"))) >= 6, fix="python3 scripts/sfx.py")
    music = [p.name for p in (ASSETS_DIR / "music").glob("*") if p.suffix.lower() in (".mp3", ".wav", ".m4a")]
    check("background music (optional)", True, music[0] if music else "none - add a royalty-free track to assets/music/")

    # voice providers (references/voice-and-captions.md §Providers): only the ones in use can FAIL
    vcfg = load_config()["voice"]
    used = {vcfg[l].get("provider") or vcfg.get("provider", "elevenlabs") for l in LANGS}
    check("voice provider", True, ", ".join(f"{l}={vcfg[l].get('provider') or vcfg.get('provider', 'elevenlabs')}" for l in LANGS))
    try:
        import edge_tts  # noqa: F401, PLC0415
        has_edge = True
    except ImportError:
        has_edge = False
    if "edge" in used:
        all_ok &= check("edge voice (edge-tts)", has_edge, "installed" if has_edge else "", fix="python3 -m pip install edge-tts")
    else:
        check("edge voice (optional)", True, "installed" if has_edge else "not installed - python3 -m pip install edge-tts to use it")
    key = os.environ.get("ELEVENLABS_API_KEY")
    if "elevenlabs" in used:
        all_ok &= check("ELEVENLABS_API_KEY", bool(key), "present (hidden)" if key else "", fix="copy YT_VIDEOS/.env.example to .env and paste your key")
    else:
        check("ElevenLabs (optional)", True, "key present (hidden)" if key else "no key - only needed for provider elevenlabs")
    if key and "elevenlabs" in used:
        try:
            req = urllib.request.Request("https://api.elevenlabs.io/v1/user/subscription", headers={"xi-api-key": key})
            s = json.loads(urllib.request.urlopen(req, timeout=20).read())
            rem = s["character_limit"] - s["character_count"]
            all_ok &= check("ElevenLabs credits", rem > 2000, f"tier={s.get('tier')} remaining={rem} chars (~{rem // 1900} bilingual videos)")
        except Exception as e:  # noqa: BLE001
            body = e.read().decode(errors="replace") if hasattr(e, "read") else ""
            if getattr(e, "code", None) == 401 and "user_read" in body:
                check("ElevenLabs API reachable", True, "restricted key (no user_read) - credits unknown, check the dashboard")
            else:
                all_ok &= check("ElevenLabs API reachable", False, str(e)[:200])
    check("Keyframes", True, "Nano Banana (manual, free) - keyframes.py writes the prompt sheet")
    # faceless-shorts engine (source: "faceless") - only needed when a project uses it, so it never FAILs the preflight
    fs_styles = faceless_styles()
    node_major = int(subprocess.run(["node", "--version"], capture_output=True, text=True).stdout.strip().lstrip("v").split(".")[0] or 0) if shutil.which("node") else 0
    chrome = find_chrome()
    fs_ok = bool(fs_styles) and node_major >= 22 and chrome
    check("faceless-shorts engine (optional)", True,
          f"ready - styles: {', '.join(fs_styles)}" if fs_ok else
          "not usable for source 'faceless': " + ", ".join(x for x, bad in (("skill missing", not fs_styles), (f"node {node_major} < 22", node_major < 22),
                                                                            ("Google Chrome missing", not chrome)) if bad))
    gi = ROOT / ".gitignore"
    check(".env is git-ignored", gi.exists() and ".env" in gi.read_text(), fix="add '.env' to YT_VIDEOS/.gitignore")

    if a.tamil and (REMOTION_DIR / "node_modules" / "remotion").exists():
        out = SKILL_DIR / "qa_tamil_test.png"
        r = subprocess.run(["npx", "remotion", "still", "src/index.ts", "TamilTest", str(out), "--log=error"],
                           cwd=REMOTION_DIR, capture_output=True, text=True)
        all_ok &= check("Tamil caption still rendered", r.returncode == 0 and out.exists(),
                        str(out) if r.returncode == 0 else r.stderr[-400:])
    print("\nALL GOOD" if all_ok else "\nFix the FAIL items above.")
    raise SystemExit(0 if all_ok else 1)


if __name__ == "__main__":
    main()
