"""Shared helpers for the bilingual-3d-shorts pipeline (stdlib only)."""
from __future__ import annotations

import json
import os
import re
import shutil
import subprocess
import sys
from pathlib import Path

SKILL_DIR = Path(__file__).resolve().parent.parent
ROOT = SKILL_DIR.parent.parent.parent  # YT_VIDEOS/
REMOTION_DIR = SKILL_DIR / "remotion"
ASSETS_DIR = SKILL_DIR / "assets"
LANGS = ("en", "ta")
CAMERA_MOVES = ("push_in", "pull_out", "pan_left", "pan_right", "tilt_up", "tilt_down", "orbit_left", "orbit_right", "static_drift")
ROLES = ("hook", "mechanism", "escalation", "twist", "payoff")
IMG_EXTS = (".png", ".jpg", ".jpeg", ".webp")
CLIP_EXTS = (".mp4", ".mov", ".webm")
SOURCES = ("code3d", "nano", "faceless")  # visual source per shot (references/visual-source-decision.md)
CODE_SOURCES = ("code3d", "faceless")     # rendered by Claude in code -> clips/Sxx.mp4 + keyframes/Sxx.png
FACELESS_SKILL = SKILL_DIR.parent / "faceless-shorts"


def find_chrome() -> str | None:
    """Chrome for the faceless-shorts engine: $CHROME, an installed Chrome/Chromium, else Remotion's Chrome for Testing."""
    cands = [os.environ.get("CHROME", ""), "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
             "/Applications/Chromium.app/Contents/MacOS/Chromium"]
    cands += sorted(map(str, (REMOTION_DIR / "node_modules/.remotion/chrome-for-testing").glob(
        "*/*/chrome-*/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing")), reverse=True)
    return next((c for c in cands if c and os.path.exists(c)), None)


def faceless_styles() -> list[str]:
    """Styles of the faceless-shorts skill (each has styles/<style>/example)."""
    d = FACELESS_SKILL / "styles"
    return sorted(p.name for p in d.iterdir() if (p / "example").is_dir()) if d.exists() else []


def load_config() -> dict:
    return json.loads((SKILL_DIR / "config.json").read_text())


def save_config(cfg: dict) -> None:
    (SKILL_DIR / "config.json").write_text(json.dumps(cfg, indent=2, ensure_ascii=False) + "\n")


def load_env() -> None:
    """Load YT_VIDEOS/.env into os.environ without printing anything."""
    env = ROOT / ".env"
    if not env.exists():
        return
    for line in env.read_text().splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        k, v = line.split("=", 1)
        os.environ.setdefault(k.strip(), v.strip().strip('"').strip("'"))


def projects_dir() -> Path:
    p = ROOT / load_config()["projects_dir"]
    p.mkdir(parents=True, exist_ok=True)
    return p


def project_dir(slug: str) -> Path:
    p = projects_dir() / slug
    if not p.exists():
        die(f"project '{slug}' not found at {p}")
    return p


def slugify(text: str) -> str:
    s = re.sub(r"[^a-z0-9]+", "-", text.lower()).strip("-")
    return s[:48] or "short"


def load_beats(pdir: Path) -> dict:
    f = pdir / "beats.json"
    if not f.exists():
        die(f"{f} missing - write beats.json first")
    return json.loads(f.read_text())


def iter_shots(beats: dict):
    for b in beats["beats"]:
        for s in b["shots"]:
            yield b, s


def find_file(folder: Path, stem: str, exts) -> Path | None:
    for e in exts:
        p = folder / f"{stem}{e}"
        if p.exists() and p.stat().st_size > 0:
            return p
    return None


def run(cmd: list[str], cwd: Path | None = None, capture: bool = True) -> subprocess.CompletedProcess:
    r = subprocess.run(cmd, cwd=cwd, capture_output=capture, text=True)
    if r.returncode != 0:
        tail = (r.stderr or r.stdout or "")[-2500:] if capture else ""
        die(f"command failed ({r.returncode}): {' '.join(cmd[:6])} ...\n{tail}")
    return r


def ffprobe_duration(path: Path) -> float:
    r = run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "default=nw=1:nk=1", str(path)])
    return float(r.stdout.strip())


def narration_text(beats: dict, lang: str) -> tuple[str, list[tuple[str, int, int]]]:
    """Join beat narrations into one string; return text and (beat_id, start_char, end_char)."""
    parts, spans, pos = [], [], 0
    for b in beats["beats"]:
        t = " ".join(b["narration"][lang].split())
        if parts:
            parts.append(" ")
            pos += 1
        spans.append((b["id"], pos, pos + len(t)))
        parts.append(t)
        pos += len(t)
    return "".join(parts), spans


def norm_word(w: str) -> str:
    return re.sub(r"[\s\.,!?;:\"'“”‘’()\[\]—–-]+", "", w).lower()


def disk_free_gb(path: Path = ROOT) -> float:
    return shutil.disk_usage(path).free / 1e9


def die(msg: str, code: int = 1):
    print(f"ERROR: {msg}", file=sys.stderr)
    sys.exit(code)


def end_card_sec(cfg: dict) -> float:
    """Seconds the channel-logo + subscribe end card adds after the narration (0 when disabled)."""
    ec = cfg.get("end_card") or {}
    return float(ec.get("dur_sec", 0)) if ec.get("enabled") else 0.0
