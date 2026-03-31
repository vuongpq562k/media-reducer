from pathlib import Path
from PIL import Image
import ffmpeg

IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".gif"}
VIDEO_EXTENSIONS = {".mp4", ".mov", ".avi", ".mkv"}


def compress_image(input_path: Path, output_dir: Path, convert_to_webp: bool = False) -> Path:
    ext = input_path.suffix.lower()
    img = Image.open(input_path)

    if convert_to_webp:
        out = output_dir / f"{input_path.stem}.webp"
        if getattr(img, "is_animated", False):
            img.save(out, "WEBP", save_all=True, quality=80)
        else:
            img.convert("RGBA").save(out, "WEBP", quality=80)
    else:
        out = output_dir / input_path.name
        if ext in (".jpg", ".jpeg"):
            # Convert to RGB to drop alpha channel if present (JPEG doesn't support alpha)
            img.convert("RGB").save(out, "JPEG", quality=75, optimize=True, progressive=True)
        elif ext == ".png":
            img.save(out, "PNG", optimize=True)
        elif ext == ".webp":
            img.save(out, "WEBP", quality=75)
        elif ext == ".gif":
            img.save(out, "GIF", optimize=True)

    return out


def compress_video(input_path: Path, output_dir: Path) -> Path:
    out = output_dir / f"{input_path.stem}.mp4"
    (
        ffmpeg
        .input(str(input_path))
        .output(
            str(out),
            vcodec="libx264",
            crf=23,
            vf="scale='min(1920,iw)':-2",
            audio_bitrate="128k",
            preset="fast",
        )
        .overwrite_output()
        .run(quiet=True)
    )
    return out


def is_image(filename: str) -> bool:
    return Path(filename).suffix.lower() in IMAGE_EXTENSIONS


def is_video(filename: str) -> bool:
    return Path(filename).suffix.lower() in VIDEO_EXTENSIONS
