# =====================================================================
#  YWCA 업무도우미 - 배포(코드 변경 후 재적용)
#  프런트 재빌드 + 백엔드 무중단 재시작.
#
#  실행:  powershell -ExecutionPolicy Bypass -File scripts\pm2-deploy.ps1
# =====================================================================

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

Write-Host "[1/3] 의존성 동기화..." -ForegroundColor Yellow
npm install

Write-Host "[2/3] 빌드..." -ForegroundColor Yellow
npm run build

Write-Host "[3/3] 무중단 재시작..." -ForegroundColor Yellow
pm2 reload ecosystem.config.cjs --update-env
pm2 save

Write-Host "`n완료. http://localhost:8080" -ForegroundColor Green
pm2 status
