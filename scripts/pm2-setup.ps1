# =====================================================================
#  YWCA 업무도우미 - pm2 자동시작 설치 (Windows)
#  최초 1회만 실행. 이후 PC 로그인 시 백엔드가 자동으로 뜹니다.
#
#  실행 방법 (PowerShell):
#     powershell -ExecutionPolicy Bypass -File scripts\pm2-setup.ps1
# =====================================================================

$ErrorActionPreference = 'Stop'

# 프로젝트 루트로 이동 (이 스크립트의 상위 폴더)
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root
Write-Host "프로젝트 폴더: $root" -ForegroundColor Cyan

# 1) Node 확인
try { $nodev = node -v } catch { throw "Node.js 가 설치되어 있지 않습니다. https://nodejs.org 에서 설치하세요." }
Write-Host "Node: $nodev" -ForegroundColor Green

# 2) 의존성 설치 + 프런트 빌드
Write-Host "`n[1/5] 의존성 설치..." -ForegroundColor Yellow
npm install

Write-Host "`n[2/5] 프런트엔드 빌드..." -ForegroundColor Yellow
npm run build

# 3) pm2 및 Windows 자동시작 도구 전역 설치
Write-Host "`n[3/5] pm2 설치..." -ForegroundColor Yellow
npm install -g pm2 pm2-windows-startup

# 4) 로그인 시 자동시작 등록 (pm2 resurrect 를 레지스트리 Run 에 등록)
Write-Host "`n[4/5] 자동시작(로그인 시) 등록..." -ForegroundColor Yellow
pm2-startup install

# 5) 앱 시작 + 현재 목록 저장(부팅 후 resurrect 대상)
Write-Host "`n[5/5] 백엔드 시작 및 저장..." -ForegroundColor Yellow
pm2 start ecosystem.config.cjs
pm2 save

Write-Host "`n============================================" -ForegroundColor Green
Write-Host " 완료! 백엔드가 실행 중이며, 다음 로그인부터 자동 시작됩니다." -ForegroundColor Green
Write-Host "   앱 주소:  http://localhost:8080" -ForegroundColor Green
Write-Host "   상태확인: pm2 status" -ForegroundColor Green
Write-Host "   로그보기: pm2 logs ywca" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Green

pm2 status
