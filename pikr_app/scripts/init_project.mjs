// Script: setelah Flutter SDK siap, inisialisasi project
// Jalankan: node "E:\PIKR-MANSEKU.MY.ID\pikr_app\scripts\init_project.mjs"

import { execSync, spawnSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const FLUTTER = 'E:\\flutter\\bin\\flutter.bat';
const PROJECT_DIR = 'E:\\PIKR-MANSEKU.MY.ID\\pikr_app';

function run(cmd, opts = {}) {
  console.log(`\n> ${cmd}`);
  return execSync(cmd, { stdio: 'inherit', ...opts });
}

// 1. Verifikasi Flutter ada
if (!fs.existsSync(FLUTTER)) {
  console.error('❌ Flutter belum terinstall di E:\\flutter\\bin\\flutter.bat');
  console.error('   Extract flutter_sdk.zip ke E:\\ dulu!');
  process.exit(1);
}

console.log('✅ Flutter ditemukan');
run(`"${FLUTTER}" --version`);

// 2. Disable Flutter analytics & update checks (lebih cepat)
run(`"${FLUTTER}" config --no-analytics`);
run(`"${FLUTTER}" config --no-cli-animations`);

// 3. Cek apakah sudah ada pubspec.yaml (project sudah ada)
const pubspec = path.join(PROJECT_DIR, 'pubspec.yaml');
if (fs.existsSync(pubspec)) {
  console.log('\n✅ pubspec.yaml sudah ada — skip flutter create');
  
  // Backup file Dart yang sudah kita buat
  const libDir = path.join(PROJECT_DIR, 'lib');
  const backupDir = path.join(PROJECT_DIR, '.dart_backup');
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }
  
  // Backup main.dart (kalau flutter create overwrite)
  const mainDart = path.join(libDir, 'main.dart');
  if (fs.existsSync(mainDart)) {
    fs.copyFileSync(mainDart, path.join(backupDir, 'main.dart.bak'));
    console.log('  📦 Backup main.dart ke .dart_backup/');
  }
} else {
  // 4. Create Flutter project (akan overwrite lib/main.dart default)
  // Kita sudah punya file kita, jadi pakai --empty atau buat dulu lalu restore
  console.log('\n📱 Membuat Flutter project...');
  run(
    `"${FLUTTER}" create . --org id.my.manseku --platforms android,ios --no-pub`,
    { cwd: PROJECT_DIR }
  );
  console.log('✅ Flutter project created');
  
  // Restore main.dart kita (flutter create overwrite dengan template default)
  const backupMain = path.join(PROJECT_DIR, '.dart_backup', 'main.dart.bak');
  if (fs.existsSync(backupMain)) {
    fs.copyFileSync(backupMain, path.join(PROJECT_DIR, 'lib', 'main.dart'));
    console.log('  ♻️  Restored main.dart kita');
  }
}

// 5. Restore semua file Dart kita (copy dari .dart_backup jika ada)
// Sebenarnya tidak perlu karena flutter create hanya overwrite lib/main.dart

// 6. pub get
console.log('\n📦 Installing dependencies...');
run(`"${FLUTTER}" pub get`, { cwd: PROJECT_DIR });

console.log('\n✅ SELESAI! Project siap.');
console.log('\nSelanjutnya:');
console.log(`  cd "${PROJECT_DIR}"`);
console.log(`  "${FLUTTER}" run   # untuk debug di emulator/device`);
console.log(`  "${FLUTTER}" build appbundle --release   # untuk Play Store`);
