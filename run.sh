#!/bin/bash

# ==========================================
# PIK-R MANSEKU — Automation Startup Script
# ==========================================

# Color codes for clean console styling
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Force flag support: ./run.sh --force or ./run.sh -f
FORCE_INSTALL=false
if [ "$1" = "--force" ] || [ "$1" = "-f" ]; then
  FORCE_INSTALL=true
  echo -e "${YELLOW}Info: Mode force re-install diaktifkan.${NC}"
fi

echo -e "${BLUE}=== [1/5] Memulai Git Pull untuk Sinkronisasi Kode ===${NC}"
git pull
if [ $? -ne 0 ]; then
  echo -e "${YELLOW}Warning: Git pull gagal. Melanjutkan dengan kode lokal saat ini...${NC}"
else
  echo -e "${GREEN}Git pull berhasil selesai.${NC}"
fi

# Helper function to compute hash of package files
get_pkg_hash() {
  local dir="$1"
  local pkg="$dir/package.json"
  local lock="$dir/package-lock.json"

  if command -v md5sum >/dev/null 2>&1; then
    cat "$pkg" "$lock" 2>/dev/null | md5sum | awk '{print $1}'
  elif command -v sha256sum >/dev/null 2>&1; then
    cat "$pkg" "$lock" 2>/dev/null | sha256sum | awk '{print $1}'
  elif command -v cksum >/dev/null 2>&1; then
    cat "$pkg" "$lock" 2>/dev/null | cksum | awk '{print $1}'
  else
    date -r "$pkg" +%s 2>/dev/null
  fi
}

# Helper function to check if npm install is needed
should_install() {
  local dir="$1"
  local hash_file="$dir/node_modules/.install_hash"

  if [ "$FORCE_INSTALL" = true ]; then
    return 0
  fi

  if [ ! -d "$dir/node_modules" ] || [ ! -f "$hash_file" ]; then
    return 0 # Needs install
  fi

  local current_hash
  current_hash=$(get_pkg_hash "$dir")
  local saved_hash
  saved_hash=$(cat "$hash_file" 2>/dev/null)

  if [ -n "$current_hash" ] && [ "$current_hash" = "$saved_hash" ]; then
    return 1 # Skip install
  fi

  return 0 # Needs install
}

save_hash() {
  local dir="$1"
  mkdir -p "$dir/node_modules" 2>/dev/null
  get_pkg_hash "$dir" > "$dir/node_modules/.install_hash" 2>/dev/null
}

echo ""
echo -e "${BLUE}=== [2/5] Cek Dependensi Backend ===${NC}"
if should_install "."; then
  echo -e "${YELLOW}Menjalankan npm install backend...${NC}"
  npm install
  if [ $? -ne 0 ]; then
    echo -e "${RED}Error: Gagal menginstal dependensi backend. Proses dihentikan.${NC}"
    exit 1
  fi
  save_hash "."
  echo -e "${GREEN}Dependensi backend berhasil diinstal.${NC}"
else
  echo -e "${GREEN}⚡ Dependensi backend up-to-date (tanpa perubahan package). Melewati npm install.${NC}"
fi

echo ""
echo -e "${BLUE}=== [3/5] Cek Dependensi Frontend ===${NC}"
if should_install "frontend"; then
  echo -e "${YELLOW}Menjalankan npm install frontend...${NC}"
  cd frontend
  npm install
  if [ $? -ne 0 ]; then
    echo -e "${RED}Error: Gagal menginstal dependensi frontend. Proses dihentikan.${NC}"
    exit 1
  fi
  cd ..
  save_hash "frontend"
  echo -e "${GREEN}Dependensi frontend berhasil diinstal.${NC}"
else
  echo -e "${GREEN}⚡ Dependensi frontend up-to-date (tanpa perubahan package). Melewati npm install.${NC}"
fi

echo ""
echo -e "${BLUE}=== [4/5] Sinkronisasi Database SQLite (local.db) ===${NC}"
echo -e "${YELLOW}Men-generate Prisma Client...${NC}"
npx prisma generate --schema=prisma/schema.prisma
if [ $? -ne 0 ]; then
  echo -e "${YELLOW}Warning: Gagal men-generate Prisma Client.${NC}"
fi
echo -e "${YELLOW}Menyelaraskan tabel database SQLite lokal (db push)...${NC}"
npx prisma db push --schema=prisma/schema.prisma --accept-data-loss
if [ $? -ne 0 ]; then
  echo -e "${YELLOW}Warning: Gagal melakukan db push pada SQLite.${NC}"
fi
echo -e "${GREEN}Prisma Client & Tabel Database SQLite berhasil diselaraskan.${NC}"

echo ""
echo -e "${BLUE}=== [5/5] Menjalankan Backend & Frontend Secara Bersamaan ===${NC}"
echo -e "${YELLOW}Backend: http://localhost:25552${NC}"
echo -e "${YELLOW}Frontend: http://localhost:25551${NC}"
echo -e "${BLUE}Menghubungkan console log... Tekan Ctrl+C untuk menghentikan kedua server.${NC}"
echo ""

# Use concurrently (forcing non-interactive install confirmation with -y)
npx -y concurrently \
  --names "BACKEND,FRONTEND" \
  --prefix-colors "blue,green" \
  "npm run dev" \
  "cd frontend && npm run dev"
