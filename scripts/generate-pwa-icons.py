#!/usr/bin/env python3
"""Generate PWA icons for Pardisan (پردیسان)."""

from __future__ import annotations

from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
PUBLIC = ROOT / "public"

BG = (24, 24, 27)  # zinc-950
ACCENT = (124, 58, 237)  # violet-600
TEXT = (237, 233, 254)  # violet-100


def load_font(size: int) -> ImageFont.FreeTypeFont | ImageFont.ImageFont:
    candidates = [
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
        "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf",
    ]
    for path in candidates:
        if Path(path).exists():
            return ImageFont.truetype(path, size)
    return ImageFont.load_default()


def draw_icon(size: int, maskable: bool = False) -> Image.Image:
    image = Image.new("RGBA", (size, size), BG + (255,))
    draw = ImageDraw.Draw(image)

    inset = int(size * (0.18 if maskable else 0.12))
    draw.rounded_rectangle(
        (inset, inset, size - inset, size - inset),
        radius=int(size * 0.18),
        fill=ACCENT + (255,),
    )

    font_size = int(size * 0.34)
    font = load_font(font_size)
    text = "SF"
    bbox = draw.textbbox((0, 0), text, font=font)
    text_w = bbox[2] - bbox[0]
    text_h = bbox[3] - bbox[1]
    x = (size - text_w) / 2
    y = (size - text_h) / 2 - bbox[1]
    draw.text((x, y), text, fill=TEXT + (255,), font=font)
    return image


def save_png(path: Path, size: int, maskable: bool = False) -> None:
    draw_icon(size, maskable).save(path, format="PNG")


def save_favicon(path: Path) -> None:
    sizes = [16, 32, 48]
    images = [draw_icon(size).convert("RGBA") for size in sizes]
    images[0].save(
        path,
        format="ICO",
        sizes=[(size, size) for size in sizes],
        append_images=images[1:],
    )


def main() -> None:
    PUBLIC.mkdir(parents=True, exist_ok=True)
    save_png(PUBLIC / "pwa-192x192.png", 192)
    save_png(PUBLIC / "pwa-512x512.png", 512)
    save_png(PUBLIC / "maskable-icon-512x512.png", 512, maskable=True)
    save_png(PUBLIC / "apple-touch-icon.png", 180)
    save_favicon(PUBLIC / "favicon.ico")
    print("Generated PWA icons in public/")


if __name__ == "__main__":
    main()
