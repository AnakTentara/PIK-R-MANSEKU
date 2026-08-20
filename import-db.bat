@echo off
chcp 65001 >nul 2>&1
title PIK-R MANSEKU — Import Database Tool

echo.
echo ==================================================
echo   PIK-R MANSEKU — Import Database Tool
echo   Mengganti local.db dengan file backup
echo ==================================================
echo.

REM ─── Cek argumen ───
if "%~1"=="" (
    echo [ERROR] Penggunaan: import-db.bat ^<path-ke-backup.db^> [--replace]
    echo.
    echo Contoh:
    echo   import-db.bat F:\Downloads\pikr_manseku_backup.db
    echo   import-db.bat F:\Downloads\pikr_manseku_backup.db --replace
    echo.
    echo Opsi:
    echo   --replace   Hapus local.db lama dan ganti dengan backup (default)
    echo.
    echo Catatan: File backup lama akan di-backup otomatis ke local.db.bak
    echo.
    pause
    exit /b 1
)

set "BACKUP_FILE=%~1"

REM ─── Cek file backup ada ───
if not exist "%BACKUP_FILE%" (
    echo [ERROR] File backup tidak ditemukan: %BACKUP_FILE%
    echo         Pastikan path file benar dan file ada.
    echo.
    pause
    exit /b 1
)

REM ─── Cek ekstensi .db ───
set "EXT=%~x1"
if /i not "%EXT%"==".db" (
    echo [WARNING] File backup bukan berekstensi .db: %EXT%
    echo           Pastikan ini adalah file database SQLite yang valid.
    echo.
    set /p "CONTINUE=Lanjutkan? (y/n): "
    if /i not "!CONTINUE!"=="y" (
        echo Dibatalkan.
        pause
        exit /b 0
    )
)

echo [INFO] File backup: %BACKUP_FILE%
echo.

REM ─── Cek ukuran file backup ───
for %%A in ("%BACKUP_FILE%") do (
    set "BACKUP_SIZE=%%~zA"
    echo [INFO] Ukuran file backup: %%~zA bytes
)
echo.

REM ─── Backup local.db yang ada (safety net) ───
set "LOCAL_DB=%~dp0local.db"
if exist "%LOCAL_DB%" (
    echo [STEP 1/4] Mem-backup local.db lama ke local.db.bak...
    copy /Y "%LOCAL_DB%" "%~dp0local.db.bak" >nul 2>&1
    if %errorlevel%==0 (
        echo           Backup berhasil: local.db.bak
    ) else (
        echo           Warning: Gagal backup local.db lama, tapi melanjutkan...
    )
) else (
    echo [STEP 1/4] local.db belum ada, melewati backup...
)
echo.

REM ─── Hapus local.db lama dan journal ───
echo [STEP 2/4] Menghapus database lama...
if exist "%LOCAL_DB%" del /F /Q "%LOCAL_DB%" >nul 2>&1
if exist "%~dp0local.db-journal" del /F /Q "%~dp0local.db-journal" >nul 2>&1
if exist "%~dp0local.db-wal" del /F /Q "%~dp0local.db-wal" >nul 2>&1
if exist "%~dp0local.db-shm" del /F /Q "%~dp0local.db-shm" >nul 2>&1
echo           Database lama dihapus.
echo.

REM ─── Copy file backup sebagai local.db ───
echo [STEP 3/4] Meng-copy file backup sebagai local.db...
copy /Y "%BACKUP_FILE%" "%LOCAL_DB%" >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Gagal meng-copy file backup!
    echo         Coba jalankan ulang sebagai Administrator.
    echo.
    REM Restore dari backup jika gagal
    if exist "%~dp0local.db.bak" (
        echo [RESTORE] Mengembalikan local.db dari backup...
        copy /Y "%~dp0local.db.bak" "%LOCAL_DB%" >nul 2>&1
    )
    pause
    exit /b 1
)
echo           File backup berhasil di-copy sebagai local.db
echo.

REM ─── Sinkronisasi Prisma ───
echo [STEP 4/4] Menjalankan Prisma generate dan db push...
echo           Ini akan menyinkronkan schema Prisma dengan database baru.
echo.
call npx prisma generate --schema=prisma/schema.prisma
if %errorlevel% neq 0 (
    echo [WARNING] Prisma generate gagal. Pastikan dependensi sudah terinstall.
    echo           Jalankan 'npm install' terlebih dahulu.
)

call npx prisma db push --schema=prisma/schema.prisma --accept-data-loss
if %errorlevel% neq 0 (
    echo [WARNING] Prisma db push gagal. Database mungkin memiliki schema berbeda.
)
echo.

REM ─── Verifikasi ───
if exist "%LOCAL_DB%" (
    for %%A in ("%LOCAL_DB%") do set "NEW_SIZE=%%~zA"
    echo ==================================================
    echo   IMPORT DATABASE BERHASIL!
    echo ==================================================
    echo.
    echo   File sumber  : %BACKUP_FILE%
    echo   File target  : %LOCAL_DB%
    echo   Ukuran       : %NEW_SIZE% bytes
    echo   Backup lama  : local.db.bak
    echo.
    echo   Selanjutnya:
    echo   1. Jalankan 'run.bat' untuk start server
    echo   2. Buka http://localhost:25551 di browser
    echo   3. Login admin: pikr-manseku / pikrman2026==
    echo.
    echo ==================================================
) else (
    echo [ERROR] local.db tidak ditemukan setelah import!
    echo         Ada masalah saat proses copy.
)

echo.
pause
