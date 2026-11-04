/**
 * PM2 PRODUKSI untuk PIK-R MANSEKU (3 proses + cadangan harian).
 *
 *   pm2 start ecosystem.config.cjs      # pertama kali
 *   pm2 reload ecosystem.config.cjs --update-env
 *   pm2 save
 *
 * Alamat situs, rahasia JWT, dan SMTP dibaca dari .env (lihat .env.example); file ini hanya berisi
 * pengaturan proses. Nilai bawaan di bawah bisa diganti lewat variabel lingkungan sebelum `pm2 start`.
 *
 *   pikr-backend  : API + upload (port 25552)       <- d-base.<domain>
 *   pikr-web      : situs utama, build statis (25551) <- <domain>, www.<domain>
 *   pikr-absen    : web absen, build statis (25554), HTTPS self-signed untuk kamera di LAN <- absen.<domain>
 *   pikr-backup   : cadangan ZIP otomatis tiap 03:00
 *
 * Frontend dilayani dari folder dist (hasil `npm run build`), BUKAN server pengembangan Vite.
 */
const path = require('path');

const MAIN = __dirname;
const ABSEN = path.resolve(MAIN, process.env.ABSEN_DIR || '../PIK-R-ABSEN/frontend');
const API_PORT = process.env.API_PORT || 25552;
const WEB_PORT = process.env.WEB_PORT || 25551;
const ABSEN_PORT = process.env.ABSEN_PORT || 25554;
const API_ORIGIN = `http://127.0.0.1:${API_PORT}`;
const SERVE = path.join(MAIN, 'scripts', 'serve-static.mjs');

const common = {
  autorestart: true,
  max_restarts: 20,
  min_uptime: '20s',
  restart_delay: 3000,
  exp_backoff_restart_delay: 200,
  time: true,
  merge_logs: true
};

module.exports = {
  apps: [
    {
      ...common,
      name: 'pikr-backend',
      cwd: MAIN,
      script: 'src/server.js',
      max_memory_restart: '700M',
      kill_timeout: 8000,
      env: {
        NODE_ENV: 'production',
        PORT: API_PORT,
        // Bot WhatsApp mati bawaan: dua perangkat memakai sesi yang sama akan saling memutus.
        // Aktifkan (set WHATSAPP=1 sebelum pm2 start) hanya di SATU server, setelah bot lama dimatikan.
        DISABLE_WHATSAPP: process.env.WHATSAPP === '1' ? '0' : '1'
      }
    },
    {
      ...common,
      name: 'pikr-web',
      cwd: MAIN,
      script: SERVE,
      args: `--dir ${path.join(MAIN, 'frontend', 'dist')} --port ${WEB_PORT} --api ${API_ORIGIN}`,
      max_memory_restart: '250M'
    },
    {
      ...common,
      name: 'pikr-absen',
      cwd: MAIN,
      script: SERVE,
      args: `--dir ${path.join(ABSEN, 'dist')} --port ${ABSEN_PORT} --api ${API_ORIGIN} --https`,
      max_memory_restart: '250M'
    },
    {
      name: 'pikr-backup',
      cwd: MAIN,
      script: 'scripts/backup.mjs',
      cron_restart: '0 3 * * *',
      autorestart: false,
      time: true,
      env: { NODE_ENV: 'production' }
    }
  ]
};
