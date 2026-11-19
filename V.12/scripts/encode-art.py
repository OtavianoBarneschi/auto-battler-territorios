"""Generate lossless browser copies of the approved PNG art.

Requires Pillow. Original files remain the reference for Impacto geometry.
"""
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

from PIL import Image


def encode(source):
    with Image.open(source) as original:
        rgba = original.convert("RGBA")
        target = source.with_suffix(".webp")
        rgba.save(target, lossless=True, exact=True, method=4)
        with Image.open(target) as encoded:
            if rgba.tobytes() != encoded.convert("RGBA").tobytes():
                raise ValueError(f"Pixel mismatch: {source.name}")
        return source.stat().st_size, target.stat().st_size


if __name__ == "__main__":
    root = Path(__file__).resolve().parents[1]
    with ThreadPoolExecutor(max_workers=6) as pool:
        sizes = list(pool.map(encode, sorted((root / "assets" / "cartas").glob("*.png"))))
    print(f"{len(sizes)} images, {sum(a for a, _ in sizes)} PNG bytes, {sum(b for _, b in sizes)} WebP bytes")
