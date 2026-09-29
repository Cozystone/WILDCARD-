"""
Television static for the moment before the film: analogue snow, made here
rather than taken from anyone's footage.

    python tools/build-static.py            # public/program/static.mp4 (1.6 s, loops)

What makes it read as a set with no signal, rather than a noise texture:
  - the noise is white across a line but smeared along it — the beam paints
    left to right, so the snow is streaks, not grains;
  - every line has its own gain, and lines are drawn in two fields, so the
    picture shimmers line by line;
  - a slow band of brightness rolls up the picture (the frame not locked);
  - now and then a line tears sideways, and twice the sync drops and a dark
    bar crosses the picture;
  - the odd lines are darker (the scanline raster), and the corners fall off;
  - and it hisses: broadband noise, rolled off top and bottom, as a
    loudspeaker would give it.

Encoded with ffmpeg: H.264 (noise is expensive to encode; 640×360 keeps the
file under a megabyte, and the stage stretches it, which analogue snow
forgives — the set was never sharp) and AAC.
"""
import os
import subprocess
import sys

import numpy as np

SITE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(SITE, "public", "program", "static.mp4")
W, H, FPS, SECONDS = 640, 360, 30, 1.2


def frame(rng, i, total):
    n = rng.standard_normal((H, W)).astype(np.float32)
    # Streaks: smear along the line.
    k = (0.06, 0.12, 0.2, 0.24, 0.2, 0.12, 0.06)
    s = sum(w * np.roll(n, j - 3, axis=1) for j, w in enumerate(k))
    # Line gain, and the two fields.
    gain = 1 + 0.22 * rng.standard_normal((H, 1)).astype(np.float32)
    field = np.where((np.arange(H) + i) % 2 == 0, 1.0, 0.82).astype(np.float32)[:, None]
    # The rolling band.
    y = np.arange(H, dtype=np.float32)[:, None] / H
    band = 0.09 * np.sin(2 * np.pi * (y * 1.3 - i / total * 2.0))
    v = 0.5 + 0.24 * s * gain + band
    # Sparks.
    v = np.where(rng.random((H, W)) < 0.0015, 1.0, v)
    # Tears: a few lines shoved sideways.
    for _ in range(rng.integers(0, 4)):
        row = rng.integers(0, H)
        rows = slice(row, min(H, row + rng.integers(1, 4)))
        v[rows] = np.roll(v[rows], rng.integers(-14, 14), axis=1)
    # Sync loss: a dark bar, twice in the loop.
    if i in (int(total * 0.42), int(total * 0.43), int(total * 0.81)):
        top = int(H * (0.2 if i < total * 0.5 else 0.62))
        v[top:top + 26] *= 0.18
        v[top + 26:top + 34] *= 0.6
    v *= field
    # Corners fall off.
    xx = (np.arange(W, dtype=np.float32)[None, :] / W - 0.5) * 2
    yy = (y - 0.5) * 2
    v *= 1 - 0.3 * np.clip(xx * xx + yy * yy, 0, 1.6) / 1.6
    v = np.clip(v, 0, 1) ** 1.15
    return (v * 255).astype(np.uint8)


def main():
    total = int(FPS * SECONDS)
    rng = np.random.default_rng(7)
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    cmd = [
        "ffmpeg", "-y", "-loglevel", "error",
        "-f", "rawvideo", "-pix_fmt", "gray", "-s", f"{W}x{H}", "-r", str(FPS), "-i", "-",
        "-f", "lavfi", "-i", f"anoisesrc=color=white:amplitude=0.5:d={SECONDS}:r=48000:seed=7",
        "-filter_complex",
        "[1:a]highpass=f=180,lowpass=f=6500,volume=-13dB,afade=t=in:d=0.03,afade=t=out:st=%.2f:d=0.05[a]" % (SECONDS - 0.05),
        "-map", "0:v", "-map", "[a]",
        "-c:v", "libx264", "-preset", "slow", "-crf", "29", "-pix_fmt", "yuv420p",
        "-c:a", "aac", "-b:a", "96k", "-shortest", "-movflags", "+faststart", OUT,
    ]
    p = subprocess.Popen(cmd, stdin=subprocess.PIPE)
    for i in range(total):
        p.stdin.write(frame(rng, i, total).tobytes())
    p.stdin.close()
    if p.wait() != 0:
        sys.exit("ffmpeg failed")
    print("WROTE", OUT, os.path.getsize(OUT), "bytes", f"{total} frames")


if __name__ == "__main__":
    main()
