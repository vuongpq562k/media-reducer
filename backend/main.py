import io
import os
import time
import shutil
import zipfile
import tempfile
from pathlib import Path

# ---------------------------------------------------------------------------
# FFmpeg path resolution
# Priority 1: imageio-ffmpeg bundled binary (always present when built with
#             PyInstaller — no system install required for end users).
# Priority 2: WinGet symlinks folder (dev convenience on Windows).
# ---------------------------------------------------------------------------
try:
    import imageio_ffmpeg as _iio_ffmpeg
    _bundled_ffmpeg_dir = os.path.dirname(_iio_ffmpeg.get_ffmpeg_exe())
    if _bundled_ffmpeg_dir not in os.environ.get("PATH", ""):
        os.environ["PATH"] = _bundled_ffmpeg_dir + os.pathsep + os.environ.get("PATH", "")
except Exception:
    pass

_winget_links = os.path.expandvars(r"%LOCALAPPDATA%\Microsoft\WinGet\Links")
if os.path.isdir(_winget_links) and _winget_links not in os.environ.get("PATH", ""):
    os.environ["PATH"] = _winget_links + os.pathsep + os.environ.get("PATH", "")

from fastapi import FastAPI, File, Form, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from fastapi.staticfiles import StaticFiles

from compressor import compress_image, compress_video_async, is_image, is_video

app = FastAPI(title="Media Reducer API")
print(f"[STARTUP] ffmpeg path: {shutil.which('ffmpeg')}")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["POST", "GET"],
    allow_headers=["*"],
    expose_headers=["Content-Disposition"],
)


@app.get("/api/health")
def health():
    return {"status": "ok"}


MAX_FILES_PER_REQUEST = 10
MAX_FILE_SIZE_MB = 100


@app.post("/api/reduce")
async def reduce_files(
    files: list[UploadFile] = File(...),
    convert_to_webp: str = Form("false"),
    aggressive: str = Form("false"),
    video_size: str = Form("1280"),
):
    if not files:
        raise HTTPException(status_code=400, detail="No files provided.")

    if len(files) > MAX_FILES_PER_REQUEST:
        raise HTTPException(
            status_code=400,
            detail=f"Too many files. Maximum {MAX_FILES_PER_REQUEST} per request.",
        )

    for upload in files:
        if upload.size and upload.size > MAX_FILE_SIZE_MB * 1024 * 1024:
            raise HTTPException(
                status_code=400,
                detail=f"{upload.filename} exceeds the {MAX_FILE_SIZE_MB} MB per-file limit.",
            )

    do_webp = convert_to_webp.lower() == "true"
    do_aggressive = aggressive.lower() == "true"
    do_video_size = video_size if video_size in ("original", "1280", "480") else "1280"
    ts = int(time.time())
    folder_name = f"reduced_{ts}"

    with tempfile.TemporaryDirectory() as tmp:
        tmp_path = Path(tmp)
        input_dir = tmp_path / "input"
        output_dir = tmp_path / folder_name
        input_dir.mkdir()
        output_dir.mkdir()

        errors: list[str] = []

        for upload in files:
            filename = upload.filename or "file"
            input_path = input_dir / filename

            # Save uploaded file to disk
            content = await upload.read()
            input_path.write_bytes(content)

            try:
                if is_image(filename):
                    compress_image(input_path, output_dir, convert_to_webp=do_webp, aggressive=do_aggressive)
                elif is_video(filename):
                    await compress_video_async(input_path, output_dir, video_size=do_video_size)
                else:
                    errors.append(f"{filename}: unsupported type")
            except Exception as exc:
                errors.append(f"{filename}: {exc}")

        if errors:
            print(f"[DEBUG] Compression errors: {errors}")

        if not any(output_dir.iterdir()):
            raise HTTPException(
                status_code=422,
                detail=f"No files were compressed. Errors: {errors}",
            )

        # Build ZIP in memory
        zip_buffer = io.BytesIO()
        with zipfile.ZipFile(zip_buffer, "w", zipfile.ZIP_DEFLATED) as zf:
            for output_file in output_dir.iterdir():
                zf.write(output_file, arcname=f"{folder_name}/{output_file.name}")
        zip_buffer.seek(0)

        zip_filename = f"{folder_name}.zip"

        return StreamingResponse(
            zip_buffer,
            media_type="application/zip",
            headers={
                "Content-Disposition": f'attachment; filename="{zip_filename}"',
            },
        )


# Serve React frontend when dist/ exists (single-app deploy on Render/Fly.io)
# Must be mounted AFTER all API routes so /api/* routes take priority.
_dist = Path(__file__).parent / "dist"
if _dist.exists():
    app.mount("/", StaticFiles(directory=_dist, html=True), name="static")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)
