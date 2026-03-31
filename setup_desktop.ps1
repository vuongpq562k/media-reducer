# Full desktop build pipeline for Media Reducer.
# Runs once to set everything up, then use `npm run tauri:dev` or `npm run tauri:build`.
#
# Prerequisites:
#   - Rust (rustup)          https://rustup.rs
#   - Node.js >= 18          https://nodejs.org
#   - Python >= 3.11         https://python.org
#   - FFmpeg on PATH         https://ffmpeg.org  (or: winget install ffmpeg)
#   - Microsoft C++ Build Tools (for Tauri/Rust on Windows)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

# Ensure Rust/Cargo is on PATH (needed when opening a fresh terminal after install)
$CargoBin = "$env:USERPROFILE\.cargo\bin"
if (Test-Path $CargoBin) {
    $env:PATH = "$CargoBin;$env:PATH"
}

$Root    = Split-Path -Parent $MyInvocation.MyCommand.Path
$FE      = Join-Path $Root "frontend"
$BE      = Join-Path $Root "backend"

Write-Host "=== Media Reducer Desktop Setup ===" -ForegroundColor Cyan

# 1. Install frontend npm dependencies (including Tauri CLI)
Write-Host "`n[1/4] Installing npm dependencies..." -ForegroundColor Yellow
Push-Location $FE
npm install
Pop-Location

# 2. Install Python backend dependencies
Write-Host "`n[2/4] Installing Python dependencies..." -ForegroundColor Yellow
Push-Location $BE
pip install -r requirements.txt -r requirements-dev.txt
Pop-Location

# 3. Build the backend binary with PyInstaller
Write-Host "`n[3/4] Building backend binary with PyInstaller..." -ForegroundColor Yellow
Push-Location $BE
./build_backend.ps1
Pop-Location

# 4. Generate Tauri icons from the existing favicon SVG
Write-Host "`n[4/4] Generating Tauri icons..." -ForegroundColor Yellow
Push-Location $FE
npx tauri icon public/favicon.svg
Pop-Location

Write-Host "`n=== Setup complete! ===" -ForegroundColor Green
Write-Host ""
Write-Host "Development:  cd frontend && npm run tauri:dev"
Write-Host "Production:   cd frontend && npm run tauri:build"
Write-Host "  (installer will be in frontend/src-tauri/target/release/bundle/)"
