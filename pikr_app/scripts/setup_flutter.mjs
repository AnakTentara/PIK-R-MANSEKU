// Script untuk extract Flutter SDK dan setup PATH
// Jalankan setelah flutter_sdk.zip selesai didownload

import path from 'path';
import { execSync } from 'child_process';
import fs from 'fs';

const zipPath = 'E:\\flutter_sdk.zip';
const extractTo = 'E:\\flutter';

console.log('[1] Cek file zip...');
if (!fs.existsSync(zipPath)) {
  console.error('flutter_sdk.zip tidak ditemukan di E:\\!');
  process.exit(1);
}
const sizeMB = (fs.statSync(zipPath).size / 1024 / 1024).toFixed(1);
console.log(`    Size: ${sizeMB} MB`);

console.log('[2] Extracting Flutter SDK...');
// PowerShell Expand-Archive
execSync(`powershell -Command "Expand-Archive -Path '${zipPath}' -DestinationPath 'E:\\' -Force"`, {
  stdio: 'inherit',
  timeout: 300000, // 5 menit
});

console.log('[3] Verifikasi...');
const flutterBat = path.join(extractTo, 'bin', 'flutter.bat');
if (!fs.existsSync(flutterBat)) {
  console.error('flutter.bat tidak ditemukan setelah extract!');
  process.exit(1);
}

console.log('[4] Tambah ke PATH sesi ini...');
process.env.PATH = `E:\\flutter\\bin;${process.env.PATH}`;

console.log('[5] flutter --version...');
execSync('E:\\flutter\\bin\\flutter.bat --version', { stdio: 'inherit' });

console.log('\n✅ Flutter SDK siap!');
console.log('Tambahkan E:\\flutter\\bin ke PATH system untuk permanent.');
console.log('\nJalankan berikutnya:');
console.log('  cd "E:\\PIKR-MANSEKU.MY.ID\\pikr_app"');
console.log('  E:\\flutter\\bin\\flutter.bat create . --org id.my.manseku --platforms android,ios');
console.log('  E:\\flutter\\bin\\flutter.bat pub get');
