#!/usr/bin/env python3
"""Synthesize a small, license-clean SFX kit with ffmpeg (no downloads).

  python3 sfx.py            # writes assets/sfx/{whoosh,whoosh2,pop,riser,impact,ding}.wav if missing
  python3 sfx.py --force
"""
from __future__ import annotations

import argparse

from common import ASSETS_DIR, run

SR = 48000
KIT = {
    # filtered noise swell with fast attack/decay
    "whoosh": ["-f", "lavfi", "-i", f"anoisesrc=color=pink:duration=0.5:sample_rate={SR}:amplitude=0.9",
               "-af", "highpass=f=300,lowpass=f=5000,afade=t=in:st=0:d=0.22:curve=exp,afade=t=out:st=0.22:d=0.28:curve=exp,volume=1.6"],
    "whoosh2": ["-f", "lavfi", "-i", f"anoisesrc=color=brown:duration=0.4:sample_rate={SR}:amplitude=0.9",
                "-af", "highpass=f=150,lowpass=f=3200,afade=t=in:st=0:d=0.12,afade=t=out:st=0.12:d=0.28,volume=2.2"],
    "pop": ["-f", "lavfi", "-i", f"aevalsrc='0.9*sin(2*PI*(1100-5000*t)*t)*exp(-38*t)':d=0.16:s={SR}",
            "-af", "afade=t=out:st=0.1:d=0.06"],
    "riser": ["-f", "lavfi", "-i", f"aevalsrc='0.35*(t/1.4)*sin(2*PI*(180+520*t*t)*t)+0.12*(t/1.4)*(random(0)*2-1)':d=1.4:s={SR}",
              "-af", "highpass=f=120,afade=t=out:st=1.32:d=0.08"],
    "impact": ["-f", "lavfi", "-i", f"aevalsrc='0.95*sin(2*PI*(70-45*t)*t)*exp(-5*t)+0.35*(random(0)*2-1)*exp(-30*t)':d=0.9:s={SR}",
               "-af", "lowpass=f=2500,afade=t=out:st=0.7:d=0.2"],
    "ding": ["-f", "lavfi", "-i", f"aevalsrc='0.5*sin(2*PI*1320*t)*exp(-4*t)+0.25*sin(2*PI*2640*t)*exp(-6*t)':d=1.0:s={SR}"],
}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--force", action="store_true")
    a = ap.parse_args()
    out = ASSETS_DIR / "sfx"
    out.mkdir(parents=True, exist_ok=True)
    for name, args in KIT.items():
        f = out / f"{name}.wav"
        if f.exists() and not a.force:
            continue
        run(["ffmpeg", "-v", "error", "-y", *args, "-ac", "2", "-ar", str(SR), str(f)])
        print(f"wrote {f}")
    (ASSETS_DIR / "music").mkdir(parents=True, exist_ok=True)


if __name__ == "__main__":
    main()
