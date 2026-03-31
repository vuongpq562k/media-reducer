# ============================================================
#  build.ps1  --  Build frontend + package backend for deploy
#  Usage:
#    .\build.ps1                          (uses .env values)
#    .\build.ps1 -ApiUrl "https://..."   (override API URL)
# ============================================================

param(
  [string]$ApiUrl  = "",
  [string]$BasePath = ""
)

$root = $PSScriptRoot

# -- helpers --------------------------------------------------
function Info  ($msg) { Write-Host "  $msg" -ForegroundColor Cyan }
function Ok    ($msg) { Write-Host "  [OK] $msg" -ForegroundColor Green }
function Header($msg) { Write-Host "`n=== $msg ===" -ForegroundColor Yellow }
function Err   ($msg) { Write-Host "  [FAIL] $msg" -ForegroundColor Red }

# -- read .env fallback ---------------------------------------
$envFile = Join-Path $root "frontend\.env"
$envVars = @{}
if (Test-Path $envFile) {
  Get-Content $envFile | ForEach-Object {
    if ($_ -match "^\s*([^#][^=]+)=(.*)$") {
      $envVars[$matches[1].Trim()] = $matches[2].Trim()
    }
  }
}

if (-not $ApiUrl)   { $ApiUrl   = $envVars["VITE_API_URL"]   }
if (-not $BasePath) { $BasePath = $envVars["VITE_BASE_PATH"] }
if (-not $ApiUrl)   { $ApiUrl   = "http://localhost:8000" }
if (-not $BasePath) { $BasePath = "/" }

# -- prompt if still localhost --------------------------------
if ($ApiUrl -match "localhost") {
  Write-Host ""
  Write-Host "  VITE_API_URL is still '$ApiUrl'." -ForegroundColor Magenta
  $userInput = Read-Host "  Enter your deployed backend URL (leave blank to keep)"
  if ($userInput) { $ApiUrl = $userInput }
}

Header "BUILD FRONTEND"
Info "API URL  : $ApiUrl"
Info "Base path: $BasePath"

$frontendDir = Join-Path $root "frontend"
Push-Location $frontendDir

if (-not (Test-Path "node_modules")) {
  Info "Installing npm dependencies..."
  npm ci
  if ($LASTEXITCODE -ne 0) { Err "npm ci failed"; exit 1 }
}

$env:VITE_API_URL   = $ApiUrl
$env:VITE_BASE_PATH = $BasePath
npm run build
if ($LASTEXITCODE -ne 0) { Err "Frontend build failed"; exit 1 }

Pop-Location
Ok "Frontend built -> frontend\dist\"

# -- backend zip ----------------------------------------------
Header "PACKAGE BACKEND"

$backendSrc = Join-Path $root "backend"
$zipDest    = Join-Path $root "backend-deploy.zip"

if (Test-Path $zipDest) { Remove-Item $zipDest -Force }

$tmpDir = Join-Path $env:TEMP "media-reducer-backend"
if (Test-Path $tmpDir) { Remove-Item $tmpDir -Recurse -Force }
New-Item -ItemType Directory -Path $tmpDir | Out-Null

Get-ChildItem -Path $backendSrc -File | Where-Object {
  $_.Extension -notin @(".pyc") -and $_.Name -ne "__pycache__"
} | Copy-Item -Destination $tmpDir

Compress-Archive -Path "$tmpDir\*" -DestinationPath $zipDest -Force
Remove-Item $tmpDir -Recurse -Force

Ok "Backend packaged -> backend-deploy.zip"

# -- summary --------------------------------------------------
Header "DONE"
Write-Host ""
Write-Host "  DEPLOY TO RENDER (order matters):" -ForegroundColor White
Write-Host ""
Write-Host "  STEP 1 - Push code to GitHub, then go to render.com" -ForegroundColor Yellow
Write-Host "    New -> Blueprint -> connect repo -> Render reads render.yaml" -ForegroundColor DarkGray
Write-Host "    This creates BOTH services automatically." -ForegroundColor DarkGray
Write-Host ""
Write-Host "  STEP 2 - After backend is live, copy its URL" -ForegroundColor Yellow
Write-Host "    e.g. https://media-reducer-api.onrender.com" -ForegroundColor DarkGray
Write-Host ""
Write-Host "  STEP 3 - Set VITE_API_URL in media-reducer-web service" -ForegroundColor Yellow
Write-Host "    Render Dashboard -> media-reducer-web -> Environment" -ForegroundColor DarkGray
Write-Host "    VITE_API_URL = https://media-reducer-api.onrender.com" -ForegroundColor DarkGray
Write-Host "    Save -> auto-redeploys frontend" -ForegroundColor DarkGray
Write-Host ""
Write-Host "  LIVE URLS:" -ForegroundColor White
Write-Host "    Frontend : https://media-reducer-web.onrender.com  (always on)" -ForegroundColor DarkGray
Write-Host "    Backend  : https://media-reducer-api.onrender.com  (sleeps 15min idle)" -ForegroundColor DarkGray
Write-Host ""
