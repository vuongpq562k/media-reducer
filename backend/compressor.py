import asyncio
from functools import partial
from pathlib import Path
from PIL import Image
import ffmpeg
 
IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".gif"}
VIDEO_EXTENSIONS = {".mp4", ".mov", ".avi", ".mkv"}
 
# Longest edge cap for aggressive mode
AGGRESSIVE_MAX_PX = 2000
 
 
def _resize_if_large(img: Image.Image, max_px: int) -> Image.Image:
    if max(img.size) > max_px:
        img = img.copy()
        img.thumbnail((max_px, max_px), Image.LANCZOS)
    return img
 
 
def compress_image(
    input_path: Path,
    output_dir: Path,
    convert_to_webp: bool = False,
    aggressive: bool = False,
) -> Path:
    ext = input_path.suffix.lower()
    img = Image.open(input_path)
 
    if convert_to_webp:
        out = output_dir / f"{input_path.stem}.webp"
        quality = 70 if aggressive else 80
        if getattr(img, "is_animated", False):
            img.save(out, "WEBP", save_all=True, quality=quality)
        else:
            if aggressive:
                img = _resize_if_large(img, AGGRESSIVE_MAX_PX)
            img.convert("RGBA").save(out, "WEBP", quality=quality)
    else:
        out = output_dir / input_path.name
        if aggressive:
            img = _resize_if_large(img, AGGRESSIVE_MAX_PX)
 
        if ext in (".jpg", ".jpeg"):
            quality = 65 if aggressive else 75
            img.convert("RGB").save(out, "JPEG", quality=quality, optimize=True, progressive=True)
        elif ext == ".png":
            if aggressive:
                # Lossy: reduce to 256-color palette — big savings on photos
                img = img.convert("P", palette=Image.ADAPTIVE, colors=256)
            img.save(out, "PNG", optimize=True)
        elif ext == ".webp":
            quality = 65 if aggressive else 75
            img.save(out, "WEBP", quality=quality)
        elif ext == ".gif":
            img.save(out, "GIF", optimize=True)
 
    return out
 
 
# video_size: "original" | "1280" | "480"
VIDEO_PRESETS: dict[str, dict] = {
    "original": {"crf": 20, "max_width": 1920, "audio_bitrate": "192k"},
    "1280":     {"crf": 23, "max_width": 1280, "audio_bitrate": "128k"},
    "480":      {"crf": 28, "max_width": 854,  "audio_bitrate": "96k"},
}
 
 
def _run_ffmpeg(input_path: Path, out: Path, preset: dict) -> None:
    """Synchronous ffmpeg call — must be run in a thread pool from async context."""
    (
        ffmpeg
        .input(str(input_path))
        .output(
            str(out),
            vcodec="libx264",
            crf=preset["crf"],
            vf=f"scale='min({preset['max_width']},iw)':-2",
            audio_bitrate=preset["audio_bitrate"],
            preset="fast",
        )
        .overwrite_output()
        .run(quiet=True)
    )
 
 
def compress_video(input_path: Path, output_dir: Path, video_size: str = "1280") -> Path:
    preset = VIDEO_PRESETS.get(video_size, VIDEO_PRESETS["1280"])
    out = output_dir / f"{input_path.stem}.mp4"
    _run_ffmpeg(input_path, out, preset)
    return out
 
 
async def compress_video_async(input_path: Path, output_dir: Path, video_size: str = "1280") -> Path:
    """Non-blocking wrapper — offloads ffmpeg to a thread so the event loop stays free."""
    preset = VIDEO_PRESETS.get(video_size, VIDEO_PRESETS["1280"])
    out = output_dir / f"{input_path.stem}.mp4"
    loop = asyncio.get_event_loop()
    await loop.run_in_executor(None, partial(_run_ffmpeg, input_path, out, preset))
    return out
 
 
def is_image(filename: str) -> bool:
    return Path(filename).suffix.lower() in IMAGE_EXTENSIONS
 
 
def is_video(filename: str) -> bool:
    return Path(filename).suffix.lower() in VIDEO_EXTENSIONS