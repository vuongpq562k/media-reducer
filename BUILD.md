# How to Build the Desktop Installer

> **End users don't install anything.** FFmpeg, Python, and all dependencies are bundled inside the `.exe` installer. The prerequisites below are only for **you, the developer**, to build it.

---

## Developer Prerequisites

Install these once on your build machine:

```powershell
winget install Rustlang.Rustup
winget install OpenJS.NodeJS
winget install Python.Python.3.11
winget install Microsoft.VisualStudio.2022.BuildTools
```

Restart your terminal, then verify:
```powershell
rustc --version
node --version
python --version
```

> FFmpeg does **not** need to be installed on your machine. `imageio-ffmpeg` downloads and bundles it automatically during the build.

---

## Build Steps

### 1. First-time setup (run once)

```powershell
./setup_desktop.ps1
```

This will:
- Install npm packages (React, Tauri CLI)
- Install Python packages (FastAPI, imageio-ffmpeg, PyInstaller, …)
- Bundle the Python backend + FFmpeg into a single `.exe` sidecar
- Generate app icons

### 2. Build the installer

```powershell
cd frontend
npm run tauri:build
```

Tauri compiles the Rust shell and wraps everything into an installer. This takes a few minutes the first time (Rust crates compile), then is fast on subsequent builds.

---

## Output

```
frontend/src-tauri/target/release/bundle/
├── nsis/
│   └── Media.Reducer_1.0.0_x64-setup.exe   ← share this with users
└── msi/
    └── Media.Reducer_1.0.0_x64_en-US.msi
```

Give users the `.exe` file. They double-click it and the app is installed. Done.

---

## Rebuilding after changes

| What changed | Command |
|---|---|
| React / TypeScript frontend | `cd frontend && npm run tauri:build` |
| Python backend (`main.py`, `compressor.py`) | `cd backend && ./build_backend.ps1` then `cd ../frontend && npm run tauri:build` |
| Both | `./setup_desktop.ps1` (re-runs everything) |

---

## Development mode

Live-reloading dev window (no installer produced):

```powershell
cd frontend
npm run tauri:dev
```

---

## Troubleshooting

### `error: linker 'link.exe' not found`
Microsoft C++ Build Tools are not installed. Run:
```powershell
winget install Microsoft.VisualStudio.2022.BuildTools
```
Then restart your terminal.

### `backend sidecar not found` at runtime
The PyInstaller step failed or was skipped. Rebuild the backend:
```powershell
cd backend && ./build_backend.ps1
```

### `tauri icon` fails / missing icons
Re-generate icons from the project favicon:
```powershell
cd frontend && npx tauri icon public/favicon.svg
```

### Build takes very long on first run
Normal — Rust is compiling ~200 crates from scratch. The cargo cache makes all future builds much faster.
