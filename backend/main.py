import io
import time
import zipfile
import tempfile
from pathlib import Path

from fastapi import FastAPI, File, Form, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse

from compressor import compress_image, compress_video, is_image, is_video

app = FastAPI(title="Media Reducer API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["POST", "GET"],
    allow_headers=["*"],
    expose_headers=["Content-Disposition"],
)


@app.get("/")
def health():
    return {"status": "ok"}


@app.post("/api/reduce")
async def reduce_files(
    files: list[UploadFile] = File(...),
    convert_to_webp: str = Form("false"),
):
    if not files:
        raise HTTPException(status_code=400, detail="No files provided.")

    do_webp = convert_to_webp.lower() == "true"
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
                    compress_image(input_path, output_dir, convert_to_webp=do_webp)
                elif is_video(filename):
                    compress_video(input_path, output_dir)
                else:
                    errors.append(f"{filename}: unsupported type")
            except Exception as exc:
                errors.append(f"{filename}: {exc}")

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
