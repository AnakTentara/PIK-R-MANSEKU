@echo off
title PIK-R MANSEKU — Automation Startup Script

echo ==========================================
echo [1/5] Memulai Git Pull
echo ==========================================
git pull
if %errorlevel% neq 0 (
  echo Warning: Git pull gagal. Melanjutkan dengan kode lokal...
) else (
  echo Git pull berhasil.
)
echo.

set FORCE_INSTALL=0
if "%1"=="--force" set FORCE_INSTALL=1
if "%1"=="-f" set FORCE_INSTALL=1

echo ==========================================
echo [2/5] Cek Dependensi Backend
echo ==========================================
set NEED_BACKEND_INSTALL=0
if not exist node_modules set NEED_BACKEND_INSTALL=1
if not exist node_modules\.install_hash set NEED_BACKEND_INSTALL=1
if %FORCE_INSTALL%==1 set NEED_BACKEND_INSTALL=1

if %NEED_BACKEND_INSTALL%==1 (
  echo Menjalankan npm install backend...
  call npm install
  if %errorlevel% neq 0 (
    echo Error: Gagal menginstal dependensi backend.
    pause
    exit /b %errorlevel%
  )
  if not exist node_modules mkdir node_modules
  echo INSTALLED > node_modules\.install_hash
  echo Dependensi backend berhasil diinstal.
) else (
  echo ⚡ Dependensi backend up-to-date. Melewati npm install.
)
echo.

echo ==========================================
echo [3/5] Cek Dependensi Frontend
echo ==========================================
set NEED_FRONTEND_INSTALL=0
if not exist frontend\node_modules set NEED_FRONTEND_INSTALL=1
if not exist frontend\node_modules\.install_hash set NEED_FRONTEND_INSTALL=1
if %FORCE_INSTALL%==1 set NEED_FRONTEND_INSTALL=1

if %NEED_FRONTEND_INSTALL%==1 (
  echo Menjalankan npm install frontend...
  cd frontend
  call npm install
  if %errorlevel% neq 0 (
    echo Error: Gagal menginstal dependensi frontend.
    cd ..
    pause
    exit /b %errorlevel%
  )
  if not exist node_modules mkdir node_modules
  echo INSTALLED > node_modules\.install_hash
  cd ..
  echo Dependensi frontend berhasil diinstal.
) else (
  echo ⚡ Dependensi frontend up-to-date. Melewati npm install.
)
echo.

echo ==========================================
echo [4/5] Men-generate Prisma Client
echo ==========================================
call npx prisma generate --schema=prisma/sqlite.prisma
call npx prisma db push --schema=prisma/sqlite.prisma --accept-data-loss
call npx prisma generate --schema=prisma/schema.prisma
if exist .env (
  call npx prisma db push --schema=prisma/schema.prisma --accept-data-loss
) else if defined DATABASE_URL (
  call npx prisma db push --schema=prisma/schema.prisma --accept-data-loss
) else (
  echo Info: File .env / DATABASE_URL tidak terdeteksi. Melewati db push MySQL.
)
echo Prisma Client ^& Database siap.
echo.

echo ==========================================
echo [5/5] Menjalankan Backend ^& Frontend (Concurrently)
echo ==========================================
echo Backend  : http://localhost:25552
echo Frontend : http://localhost:25551
echo Tekan Ctrl+C untuk menghentikan kedua server.
echo.

npx -y concurrently --names "BACKEND,FRONTEND" --prefix-colors "blue,green" "npm run dev" "cd frontend && npm run dev"
pause
