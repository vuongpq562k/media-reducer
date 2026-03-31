---
name: media-reducer
description: >-
  Project conventions and architecture for the media-reducer web app (React frontend + Python FastAPI backend).
  Use when writing any code, creating components, API routes, compression logic, or deployment config for this project.
  Ensures consistent tech stack, file naming, compression settings, and structure across all prompts.
---

# Media Reducer — Project Skill

## Project Overview

A full-stack web app that compresses images and videos.
- **Frontend**: React 18 + TypeScript + Vite + Tailwind CSS → deployed to **GitHub Pages**
- **Backend**: Python 3.11 + FastAPI + Uvicorn → deployed to **Render.com (free tier)**
- No database required.

## Folder Structure

```
media-reducer/
├── frontend/                     # React + TypeScript + Vite
│   ├── src/
│   │   ├── components/
│   │   │   ├── DropZone.tsx
│   │   │   ├── FileList.tsx
│   │   │   └── ProgressBar.tsx
│   │   ├── api.ts                # axios calls to backend
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── vite.config.ts
│   └── package.json
├── backend/
│   ├── main.py                   # FastAPI app + routes
│   ├── compressor.py             # Image + video logic
│   ├── requirements.txt
│   └── render.yaml
├── .github/workflows/deploy.yml  # Build + publish to GitHub Pages
└── README.md
```

## Output File Naming Convention

Compressed files keep their **original filename**. All outputs are placed inside a timestamped folder, which is zipped and returned.

```
reduced_{unix_timestamp}/
├── photo.jpg          ← same name as uploaded
├── vacation.mp4       ← same name as uploaded
└── logo.png           ← or logo.webp if convert_to_webp=true
```

Downloaded ZIP filename: `reduced_{unix_timestamp}.zip`

Rules:
- Original filename and extension are preserved by default
- If `convert_to_webp=true`, image extension changes to `.webp` (stem unchanged)
- Videos always output as `.mp4` (stem unchanged)

Always use a **single** `ts = int(time.time())` per request — shared across all files in that batch — so the folder name and all files belong to the same job.

Examples (single request with `ts=1743400000`):
- `photo.jpg` (WebP off) → `reduced_1743400000/photo.jpg`
- `photo.jpg` (WebP on) → `reduced_1743400000/photo.webp`
- `vacation.mp4` → `reduced_1743400000/vacation.mp4`

## Backend: Compression Settings

### Images (Pillow)

The `compress_image` function accepts a `convert_to_webp: bool` flag driven by the user's checkbox.

**When `convert_to_webp=True`** — convert all formats to WebP at `quality=80`. Handles animated GIFs too.

**When `convert_to_webp=False`** — compress in original format (safe settings, no color reduction):

| Format | Method |
|--------|--------|
| `.jpg` / `.jpeg` | `quality=75, optimize=True, progressive=True` |
| `.png` | `optimize=True` only (lossless, no palette conversion) |
| `.webp` | `quality=75` |
| `.gif` | `optimize=True` |

```python
from PIL import Image
from pathlib import Path
import time

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
        out = output_dir / input_path.name  # keep original filename
        if ext in (".jpg", ".jpeg"):
            img.save(out, "JPEG", quality=75, optimize=True, progressive=True)
        elif ext == ".png":
            img.save(out, "PNG", optimize=True)
        elif ext == ".webp":
            img.save(out, "WEBP", quality=75)
        elif ext == ".gif":
            img.save(out, "GIF", optimize=True)
    return out
```

### Videos (ffmpeg-python)

- Codec: `libx264`, CRF: `23` (FFmpeg default — good quality, ~30–40% smaller), preset: `fast`
- Scale: cap at 1920px wide (`scale='min(1920,iw)':-2`)
- Audio bitrate: `128k`
- Always output as `.mp4`

```python
import ffmpeg, time
from pathlib import Path

def compress_video(input_path: Path, output_dir: Path) -> Path:
    out = output_dir / f"{input_path.stem}.mp4"  # keep original stem, always .mp4
    (
        ffmpeg
        .input(str(input_path))
        .output(str(out), vcodec="libx264", crf=23,
                vf="scale='min(1920,iw)':-2", audio_bitrate="128k",
                preset="fast")
        .overwrite_output()
        .run(quiet=True)
    )
    return out
```

## Backend: API Design

Single endpoint — returns a ZIP file containing all compressed outputs:

```
POST /api/reduce
Content-Type: multipart/form-data
Body:
  files[]          — one or more image/video files
  convert_to_webp  — "true" | "false"  (string from FormData)

Response: application/zip  (filename: reduced_{timestamp}.zip)
          containing folder: reduced_{timestamp}/
                              ├── photo.jpg
                              └── vacation.mp4
```

Use `StreamingResponse` with `zipfile` (stdlib) to stream the ZIP.

In `main.py`:
- Generate `ts = int(time.time())` once at the start of the request
- Create a temp dir, then a subfolder `reduced_{ts}/` inside it
- Pass the subfolder as `output_dir` to all compress calls
- Zip the entire `reduced_{ts}/` folder with `arcname=f"reduced_{ts}"` so the folder appears at the root of the ZIP
- Return with header `Content-Disposition: attachment; filename="reduced_{ts}.zip"`

Parse `convert_to_webp` as: `convert_to_webp: str = Form("false")` → `convert_to_webp == "true"`.

CORS must be enabled for GitHub Pages origin (and `*` in development).

## Backend: requirements.txt

```
fastapi>=0.110
uvicorn[standard]>=0.29
python-multipart>=0.0.9
Pillow>=10.0
ffmpeg-python>=0.2.0
```

## Backend: render.yaml

```yaml
services:
  - type: web
    name: media-reducer-api
    runtime: python
    buildCommand: "apt-get install -y ffmpeg && pip install -r requirements.txt"
    startCommand: "uvicorn main:app --host 0.0.0.0 --port 10000"
    envVars:
      - key: PYTHON_VERSION
        value: "3.11"
```

## Frontend: Key Conventions

- Use **axios** for HTTP calls (not fetch)
- Backend URL comes from `import.meta.env.VITE_API_URL` (set in `.env.production`)
- Response is a Blob → trigger auto-download as `reduced_files.zip`
- Show a spinner/progress indicator while request is in-flight
- Accept file types: `image/jpeg, image/png, image/webp, image/gif, video/mp4, video/quicktime, video/x-msvideo, video/x-matroska`

The `App.tsx` must have a `convertToWebp: boolean` state bound to the checkbox, passed into `reduceFiles`.

```ts
// api.ts pattern
export async function reduceFiles(files: File[], convertToWebp: boolean): Promise<void> {
  const form = new FormData();
  files.forEach(f => form.append("files", f));
  form.append("convert_to_webp", String(convertToWebp));
  const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/reduce`, form, {
    responseType: "blob",
  });
  // filename comes from Content-Disposition header (e.g. reduced_1743400000.zip)
  const disposition = res.headers["content-disposition"] ?? "";
  const match = disposition.match(/filename="(.+?)"/);
  const filename = match ? match[1] : "reduced.zip";
  const url = URL.createObjectURL(res.data);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
```

Checkbox UI in `App.tsx` (images only — the option has no effect on videos):

```tsx
<label className="flex items-center gap-2 text-sm text-gray-600">
  <input
    type="checkbox"
    checked={convertToWebp}
    onChange={e => setConvertToWebp(e.target.checked)}
  />
  Convert all images to WebP (smaller files, modern format)
</label>
```

## GitHub Actions: deploy.yml

Triggers on push to `main`, builds frontend, publishes to `gh-pages` branch.

```yaml
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: cd frontend && npm ci && npm run build
      - uses: peaceiris/actions-gh-pages@v4
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: frontend/dist
```

## Supported File Types

| Category | Extensions |
|----------|-----------|
| Images | `.jpg`, `.jpeg`, `.png`, `.webp`, `.gif` |
| Videos | `.mp4`, `.mov`, `.avi`, `.mkv` |

## Deployment Targets

| Part | Platform | Notes |
|------|----------|-------|
| Frontend | GitHub Pages | `gh-pages` branch, built by Actions |
| Backend | Render.com | Free tier, FFmpeg installed via buildCommand |

## Environment Variables

| Variable | Location | Value |
|----------|----------|-------|
| `VITE_API_URL` | `frontend/.env.production` | Render backend URL (e.g. `https://media-reducer-api.onrender.com`) |
