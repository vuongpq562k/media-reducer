# Build the FastAPI backend into a single self-contained executable.
# imageio-ffmpeg bundles ffmpeg.exe — end users need NO separate installs.
#
# Usage: cd backend && ./build_backend.ps1

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

# Ensure Rust/Cargo is on PATH (needed when opening a fresh terminal)
$CargoBin = "$env:USERPROFILE\.cargo\bin"
if (Test-Path $CargoBin) {
    $env:PATH = "$CargoBin;$env:PATH"
}

$ScriptDir  = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectDir = Split-Path -Parent $ScriptDir
$BinDir     = Join-Path $ProjectDir "frontend\src-tauri\binaries"

# Resolve Rust target triple (e.g. x86_64-pc-windows-msvc)
$RustTarget = (rustc -Vv | Select-String "^host:").ToString().Split(" ")[1].Trim()
Write-Host "Target triple: $RustTarget"

# Install / upgrade build dependencies
Write-Host "Installing Python dependencies..."
pip install -r requirements.txt -r requirements-dev.txt -q

# Build — collect imageio_ffmpeg so its bundled ffmpeg.exe is included
Push-Location $ScriptDir
Write-Host "Building backend with PyInstaller (this may take a minute)..."
pyinstaller `
    --onefile `
    --name backend `
    --distpath dist `
    --workpath build `
    --specpath build `
    --noconfirm `
    --collect-all imageio_ffmpeg `
    --collect-all PIL `
    main.py
Pop-Location

# Determine output binary path (Windows)
$BinaryName = "backend-$RustTarget.exe"
$SourceBin  = Join-Path $ScriptDir "dist\backend.exe"

# Copy to Tauri binaries folder
if (-not (Test-Path $BinDir)) {
    New-Item -ItemType Directory -Path $BinDir | Out-Null
}

$DestBin = Join-Path $BinDir $BinaryName
Copy-Item -Path $SourceBin -Destination $DestBin -Force
Write-Host "Backend binary → $DestBin"
