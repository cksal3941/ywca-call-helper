# =====================================================================
#  YWCA 업무도우미 - pm2 자동시작 해제 / 중지
#
#  실행:  powershell -ExecutionPolicy Bypass -File scripts\pm2-uninstall.ps1
# =====================================================================

$ErrorActionPreference = 'Continue'
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

Write-Host "백엔드 중지 및 목록에서 제거..." -ForegroundColor Yellow
pm2 delete ywca
pm2 save --force

Write-Host "로그인 자동시작 해제..." -ForegroundColor Yellow
pm2-startup uninstall

Write-Host "`n해제 완료. (pm2 자체 제거는: npm remove -g pm2 pm2-windows-startup)" -ForegroundColor Green
