@echo off
setlocal
cd /d "%~dp0"
title PIK-R MANSEKU - nyalakan semua layanan

echo ============================================================
echo  PIK-R MANSEKU - menyalakan semua layanan lewat PM2
echo    pikr-backend  API            port 25552
echo    pikr-web      situs utama    port 25551
echo    pikr-absen    web absen      port 25554
echo    pikr-backup   cadangan ZIP   dijalankan sekarang dan tiap 03:00
echo ============================================================
echo.

where node >nul 2>&1
if errorlevel 1 goto :tanpa_node
where pm2 >nul 2>&1
if errorlevel 1 goto :tanpa_pm2
if not exist ".env" goto :tanpa_env
if not exist "local.db" goto :tanpa_db
if not exist "..\PIK-R-ABSEN\frontend\package.json" goto :tanpa_absen

if exist "node_modules" goto :npm_ok
echo [1/5] Memasang dependensi backend, sekali saja...
call npm install
if errorlevel 1 goto :gagal
:npm_ok

if exist "frontend\dist\index.html" goto :web_ok
echo [2/5] Membangun situs utama...
pushd frontend
if not exist "node_modules" call npm install
call npm run build
set "RC=%errorlevel%"
popd
if not "%RC%"=="0" goto :gagal
:web_ok

if exist "..\PIK-R-ABSEN\frontend\dist\index.html" goto :absen_ok
echo [3/5] Membangun web absen...
pushd "..\PIK-R-ABSEN\frontend"
if not exist "node_modules" call npm install
call npm run build
set "RC=%errorlevel%"
popd
if not "%RC%"=="0" goto :gagal
:absen_ok

echo [4/5] Menyalakan proses PM2...
call pm2 startOrReload ecosystem.config.cjs --update-env
if errorlevel 1 goto :gagal
rem Jalankan cadangan sekarang juga, tanpa menunggu jadwal 03:00
call pm2 restart pikr-backup >nul
call pm2 save >nul

echo.
echo [5/5] Memeriksa kesehatan layanan, tunggu sebentar...
timeout /t 20 /nobreak >nul
echo.
call pm2 ls
echo.
curl -s -o nul -w "backend : HTTP %%{http_code}\n" http://127.0.0.1:25552/health
curl -s -o nul -w "web     : HTTP %%{http_code}\n" http://127.0.0.1:25551/healthz
curl -sk -o nul -w "absen   : HTTP %%{http_code}\n" https://127.0.0.1:25554/healthz
echo.
echo (HTTP 200 = sehat. 000 = belum naik, jalankan: pm2 logs)
echo Cadangan tersimpan di: %~dp0..\PIK-R-BACKUP
echo.
if /i not "%~1"=="nopause" pause
exit /b 0

:tanpa_node
echo [ERROR] Node.js tidak ditemukan. Pasang Node.js 20 atau lebih baru dari nodejs.org
goto :gagal

:tanpa_pm2
echo [ERROR] PM2 belum terpasang. Jalankan:  npm install -g pm2
goto :gagal

:tanpa_env
echo [ERROR] File .env tidak ada di %~dp0
echo         Salin .env dari komputer lama, atau salin .env.example lalu isi JWT_SECRET.
goto :gagal

:tanpa_db
echo [ERROR] local.db tidak ada di %~dp0
echo         Pulihkan dulu dari ZIP cadangan: ambil pikr_manseku.db di dalamnya,
echo         ubah namanya menjadi local.db, dan isi folder uploads ke public\uploads.
goto :gagal

:tanpa_absen
echo [ERROR] Folder PIK-R-ABSEN tidak ada di sebelah PIK-R-MANSEKU.
echo         Kedua folder harus berada di folder induk yang sama.
goto :gagal

:gagal
echo.
echo [GAGAL] Layanan belum dinyalakan. Perbaiki pesan di atas, lalu jalankan lagi.
echo.
if /i not "%~1"=="nopause" pause
exit /b 1
