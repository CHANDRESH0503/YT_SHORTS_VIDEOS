#!/usr/bin/env python3
"""Synthesize a small, license-clean SFX kit with ffmpeg (no downloads). Stopgaps: real CC0 files (assets/DOWNLOADS.md) win.

  python3 sfx.py            # writes assets/sfx/{whoosh,whoosh2,pop,riser,impact,ding,tick,subdrop}.wav if missing,
                            # assets/sfx/ambience/{room-hum,wind,river,night,outdoor}.wav (20 s loops) and
                            # assets/music/stingers/stinger-01.wav if missing
  python3 sfx.py --force    # rewrite them all (never touches files you downloaded under other names)
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
    # soft UI tick for counters / gauges (one per step), and a sub drop under flash cuts
    "tick": ["-f", "lavfi", "-i", f"aevalsrc='0.7*sin(2*PI*2400*t)*exp(-160*t)+0.3*(random(0)*2-1)*exp(-400*t)':d=0.05:s={SR}",
             "-af", "highpass=f=900"],
    "subdrop": ["-f", "lavfi", "-i", f"aevalsrc='0.9*sin(2*PI*(62*t-14*t*t))*exp(-2.6*t)':d=1.2:s={SR}",
                "-af", "lowpass=f=180,afade=t=in:st=0:d=0.01,afade=t=out:st=1.0:d=0.2"],
}
AMB_SEC = 20
# room tone / ambience beds (seamless enough for a 20 s loop; real recordings sound better: assets/DOWNLOADS.md §4)
AMBIENCE = {
    "room-hum": ["-f", "lavfi", "-i", f"anoisesrc=color=brown:duration={AMB_SEC}:sample_rate={SR}:amplitude=0.35",
                 "-f", "lavfi", "-i", f"aevalsrc='0.05*sin(2*PI*100*t)+0.02*sin(2*PI*200*t)':d={AMB_SEC}:s={SR}",
                 "-filter_complex", "[0]lowpass=f=400[a];[a][1]amix=inputs=2:normalize=0,volume=0.8"],
    "wind": ["-f", "lavfi", "-i", f"anoisesrc=color=pink:duration={AMB_SEC}:sample_rate={SR}:amplitude=0.6",
             "-af", "bandpass=f=500:width_type=h:w=600,tremolo=f=0.15:d=0.6,lowpass=f=1800,volume=1.2"],
    "river": ["-f", "lavfi", "-i", f"anoisesrc=color=white:duration={AMB_SEC}:sample_rate={SR}:amplitude=0.4",
              "-af", "bandpass=f=1400:width_type=h:w=1800,tremolo=f=5.5:d=0.25,tremolo=f=0.7:d=0.3,lowpass=f=5000,volume=0.9"],
    "night": ["-f", "lavfi", "-i", f"anoisesrc=color=brown:duration={AMB_SEC}:sample_rate={SR}:amplitude=0.25",
              "-f", "lavfi", "-i", f"aevalsrc='0.05*sin(2*PI*4300*t)*gt(sin(2*PI*28*t),0.2)*gt(sin(2*PI*0.9*t),0.3)':d={AMB_SEC}:s={SR}",
              "-filter_complex", "[0]lowpass=f=300[a];[a][1]amix=inputs=2:normalize=0"],
    "outdoor": ["-f", "lavfi", "-i", f"anoisesrc=color=pink:duration={AMB_SEC}:sample_rate={SR}:amplitude=0.3",
                "-af", "highpass=f=200,lowpass=f=3500,tremolo=f=0.2:d=0.3,volume=0.8"],
}
STINGERS = {
    # payoff stinger: low hit + bright major chord that rings out
    "stinger-01": ["-f", "lavfi", "-i", f"aevalsrc='0.6*sin(2*PI*(80-40*t)*t)*exp(-6*t)+0.18*(sin(2*PI*523*t)+sin(2*PI*659*t)+sin(2*PI*784*t))*exp(-2.2*t)':d=2.0:s={SR}",
                   "-af", "aecho=0.8:0.6:120|240:0.3|0.18,afade=t=out:st=1.6:d=0.4"],
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
    for folder, kit in ((out / "ambience", AMBIENCE), (ASSETS_DIR / "music" / "stingers", STINGERS)):
        folder.mkdir(parents=True, exist_ok=True)
        for name, args in kit.items():
            f = folder / f"{name}.wav"
            if f.exists() and not a.force:
                continue
            tmp = f.with_suffix(".raw.wav")
            run(["ffmpeg", "-v", "error", "-y", *args, "-ac", "2", "-ar", str(SR), str(tmp)])
            # beds sit at one level (-30 LUFS) so config volumes mean the same for every bed; stingers louder
            lufs = "-30" if kit is AMBIENCE else "-16"
            run(["ffmpeg", "-v", "error", "-y", "-i", str(tmp), "-af", f"loudnorm=I={lufs}:TP=-3:LRA=11", "-ar", str(SR), str(f)])
            tmp.unlink()
            print(f"wrote {f}")
    (ASSETS_DIR / "music").mkdir(parents=True, exist_ok=True)


if __name__ == "__main__":
    main()
