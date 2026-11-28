#!/usr/bin/env python3
"""Write the film-grade 3D LUTs (assets/luts/<grade>.cube, 33^3, display-referred sRGB in -> out), one per grade preset.

  python3 make_luts.py            # (re)write all four: teal, warm-sunlit, night, neutral
  python3 make_luts.py --sheet    # also write qa/lut_sheet.png in the scratch dir given by --out (a ramp + hue swatches per LUT)

Generated here so no third-party LUT licences are involved. The 3D engines (faceless-shorts deep-dive, night-file,
tall-tale) apply them after tone mapping (core/film.js); faceless.py copies the video's LUT into the project.
Each look = gentle filmic S-curve + split-tone (shadows / highlights pushed toward two hues, weighted by luma)
+ saturation, kept small so whites stay white and skin stays skin.
"""
from __future__ import annotations

import argparse
import colorsys
from pathlib import Path

from common import ASSETS_DIR

N = 33
LOOKS = {
    # name: contrast (S-curve strength), lift (black level), shadow hue rgb + amount, highlight hue rgb + amount, saturation
    "teal": dict(s=0.18, lift=0.015, sh=(0.00, 0.62, 0.70), sh_k=0.10, hi=(1.00, 0.86, 0.72), hi_k=0.06, sat=1.05),
    "warm-sunlit": dict(s=0.14, lift=0.02, sh=(0.36, 0.24, 0.20), sh_k=0.07, hi=(1.00, 0.84, 0.60), hi_k=0.08, sat=1.07),
    "night": dict(s=0.22, lift=0.0, sh=(0.05, 0.12, 0.45), sh_k=0.14, hi=(0.70, 0.88, 1.00), hi_k=0.05, sat=0.86),
    "neutral": dict(s=0.10, lift=0.01, sh=(0.5, 0.5, 0.5), sh_k=0.0, hi=(0.5, 0.5, 0.5), hi_k=0.0, sat=1.03),
}


def scurve(x: float, s: float) -> float:
    # smoothstep blend: s = 0 identity, s = 1 full smoothstep; pivot at mid-grey
    return x + s * (x * x * (3 - 2 * x) - x)


def apply(rgb: tuple[float, float, float], k: dict) -> tuple[float, float, float]:
    r, g, b = (scurve(c, k["s"]) for c in rgb)
    luma = 0.2126 * r + 0.7152 * g + 0.0722 * b
    ws = (1 - luma) ** 2  # shadow weight
    wh = luma ** 2        # highlight weight
    out = []
    for c, sc, hc in zip((r, g, b), k["sh"], k["hi"]):
        c = c + k["sh_k"] * ws * (sc - 0.5) + k["hi_k"] * wh * (hc - 0.5)
        out.append(c)
    h, l, s = colorsys.rgb_to_hls(*(min(1, max(0, c)) for c in out))
    out = colorsys.hls_to_rgb(h, l, min(1, s * k["sat"]))
    return tuple(min(1.0, max(0.0, k["lift"] + c * (1 - k["lift"]))) for c in out)


def write_cube(name: str, k: dict, path: Path) -> None:
    lines = [f'TITLE "{name}"', f"LUT_3D_SIZE {N}", "DOMAIN_MIN 0 0 0", "DOMAIN_MAX 1 1 1"]
    for bi in range(N):          # .cube order: red changes fastest
        for gi in range(N):
            for ri in range(N):
                o = apply((ri / (N - 1), gi / (N - 1), bi / (N - 1)), k)
                lines.append(f"{o[0]:.5f} {o[1]:.5f} {o[2]:.5f}")
    path.write_text("\n".join(lines) + "\n")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--sheet", action="store_true")
    ap.add_argument("--out", default="", help="folder for lut_sheet.png (with --sheet)")
    a = ap.parse_args()
    d = ASSETS_DIR / "luts"
    d.mkdir(exist_ok=True)
    for name, k in LOOKS.items():
        write_cube(name, k, d / f"{name}.cube")
        print(f"wrote {d / (name + '.cube')}")
    if a.sheet:
        import struct
        import zlib
        out = Path(a.out or ".") / "lut_sheet.png"
        sw = [(i / 15, i / 15, i / 15) for i in range(16)] + [colorsys.hsv_to_rgb(h / 16, 0.6, 0.8) for h in range(16)] + \
             [(0.95, 0.8, 0.68), (0.55, 0.38, 0.28), (0.98, 0.98, 0.98), (0.2, 0.42, 0.8)]
        cell, rows = 24, [("source", None)] + list(LOOKS.items())
        w, h = cell * len(sw), cell * len(rows)
        raw = bytearray()
        for _, k in rows:
            row = [apply(c, k) if k else c for c in sw]
            for _y in range(cell):
                raw.append(0)
                for c in row:
                    raw += bytes(int(v * 255) for v in c) * cell
        png = b"\x89PNG\r\n\x1a\n"
        chunk = lambda t, b: struct.pack(">I", len(b)) + t + b + struct.pack(">I", zlib.crc32(t + b) & 0xFFFFFFFF)  # noqa: E731
        png += chunk(b"IHDR", struct.pack(">IIBBBBB", w, h, 8, 2, 0, 0, 0)) + chunk(b"IDAT", zlib.compress(bytes(raw))) + chunk(b"IEND", b"")
        out.write_bytes(png)
        print(f"sheet {out} (rows: source, {', '.join(LOOKS)})")


if __name__ == "__main__":
    main()
