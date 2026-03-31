# Media Reducer

Compress images and videos in your browser. Upload files, click **Reduce**, download a ZIP with your compressed files — original filenames preserved.

## Features

- **Images** — JPEG, PNG, WebP, GIF compression (Pillow)
- **Videos** — H.264 re-encode at CRF 23, capped at 1080p (FFmpeg)
- **Optional WebP conversion** — convert all images to WebP for maximum size reduction
- Drag & drop or click to browse
- Batch processing — multiple files at once
- Downloads as a single ZIP: `reduced_{timestamp}/`

## Stack

| Layer | Tech |
|-------|------|
| Frontend | React 18 + TypeScript + Vite + Tailwind CSS v4 |
| Backend | Python 3.11 + FastAPI + Uvicorn |
| Image compression | Pillow |
| Video compression | ffmpeg-python + FFmpeg |
| Frontend hosting | GitHub Pages |
| Backend hosting | Render.com (free tier) |

---

## Local Development

### Backend

```bash
cd backend

# Create a virtual environment
python -m venv .venv
.venv\Scripts\activate      # Windows
# source .venv/bin/activate  # macOS/Linux

# Install dependencies (FFmpeg must be installed on your system)
pip install -r requirements.txt

# Run
uvicorn main:app --reload --port 8000
```

> FFmpeg must be installed on your system. Download from https://ffmpeg.org/download.html

### Frontend

```bash
cd frontend
npm install
npm run dev
```

The app opens at `http://localhost:5173`. It calls `http://localhost:8000` by default (set in `.env`).

---

## Deployment

### Backend → Render.com

1. Push this repo to GitHub
2. Go to [render.com](https://render.com) → **New Web Service**
3. Connect your GitHub repo
4. Render auto-detects `render.yaml` — click **Deploy**
5. Copy the deployed URL (e.g. `https://media-reducer-api.onrender.com`)

### Frontend → GitHub Pages

1. In your GitHub repo → **Settings → Secrets and variables → Actions**, add:
   - `VITE_API_URL` = your Render backend URL
   - `VITE_BASE_PATH` = `/{your-repo-name}/`  *(e.g. `/media-reducer/`)*

2. Go to **Settings → Pages** → set source to **Deploy from a branch** → branch: `gh-pages`

3. Push to `main` — GitHub Actions builds and deploys automatically.

---

## Project Structure

```
media-reducer/
├── frontend/                 # React + Vite
│   ├── src/
│   │   ├── components/
│   │   │   ├── DropZone.tsx
│   │   │   ├── FileList.tsx
│   │   │   └── ProgressBar.tsx
│   │   ├── api.ts
│   │   └── App.tsx
│   └── vite.config.ts
├── backend/
│   ├── main.py               # FastAPI routes
│   ├── compressor.py         # Pillow + ffmpeg logic
│   ├── requirements.txt
│   └── render.yaml
└── .github/workflows/
    └── deploy.yml            # Auto-deploy to GitHub Pages
```
