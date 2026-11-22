# HAND_OVER — PIK-R MANSEKU

Dokumen serah terima untuk siapa pun yang melanjutkan proyek ini (pengurus berikutnya, developer baru, atau asisten AI).
Ditulis 5 November 2026. Baca dari atas ke bawah sekali; setelah itu dokumen ini jadi rujukan.

> Isinya sengaja **tanpa kata sandi**. Repositori ini publik. Kata sandi dan rahasia ada di `.env` (tidak di git) dan di dashboard.

---

## 1. Apa ini dan untuk apa

**PIK-R MANSEKU** = Pusat Informasi dan Konseling Remaja di **MAN 1 Muara Enim**. Organisasi siswa, pengurus berganti tiap tahun ajaran.
Proyek ini adalah seluruh sistem informasinya:

| Kebutuhan organisasi | Dijawab oleh |
|---|---|
| Calon anggota mendaftar, hasil seleksi diumumkan | Situs publik: `/daftar`, `/cek-kelulusan` + bot WhatsApp |
| Profil organisasi, struktur kepengurusan, anggota, alumni | Situs publik + dashboard admin |
| Absensi pertemuan dan kegiatan | Web absen terpisah `absen.<domain>` (scan ID Card) |
| ID Card anggota (barcode + QR) | ID Card Generator (.exe) + Excel dari dashboard |
| Biodata publik tiap anggota | `/@nama` (tujuan QR di belakang kartu) |
| Berita, blog, forum | Situs publik |

**Asal:** dibuat oleh tim **Abati Technology** (pemilik repo GitHub: `AnakTentara`) untuk PIK-R MANSEKU. Bahasa kerja: **Indonesia** (UI, komentar, commit, dokumen). Mulanya situs pendaftaran sederhana; tahun 2026/2027 ditambah absensi, ID Card, hierarki kepengurusan dinamis, Excel, dan halaman Desain.

**Prinsip yang diminta pemilik** (jangan dilanggar tanpa bertanya):
1. **Tanpa fitur dobel.** Satu hal, satu tempat. Kalau dua tempat melakukan hal yang sama, hapus salah satunya.
2. **Mudah dipakai, mudah dirawat, mudah pindah server.** Alamat dan rahasia hanya dari `.env`.
3. **Cepat dan terasa halus** (web absen dipakai di HP kelas menengah, di tengah kegiatan).
4. **Sistem harus saling terhubung otomatis** (anggota ↔ struktur ↔ absensi ↔ ID Card).
5. Struktur organisasi **sengaja dibiarkan kosong** untuk pengurus berikutnya supaya mereka belajar memakai dashboard. Jangan diisi diam-diam.
6. Dashboard admin tetap **oranye** (tidak ikut tema). Tema hanya untuk situs publik.

---

## 2. Tiga proyek, tiga folder

Semua di `D:\RUDY\codeHaikal\` pada komputer produksi saat ini.

| Folder | Repo GitHub | Isi |
|---|---|---|
| `PIK-R-MANSEKU` | `AnakTentara/PIK-R-MANSEKU` | Backend (Express 5 + Prisma + **SQLite**), situs utama + dashboard (React 18 + Vite 6) |
| `PIK-R-ABSEN` | `AnakTentara/PIK-R-ABSEN` | Web absen (`frontend/`), ID Card Generator (`idcard-generator/`), skrip uji (`.sandbox/`) |
| `PIK-R-BACKUP` | bukan repo | Cadangan ZIP otomatis (jangan di-git) |

**API absensi tinggal di backend utama** (`PIK-R-MANSEKU/src/*/absen*.js`). `PIK-R-ABSEN` hanya berisi klien. Dulu ada `backend-module/` di sana: itu salinan lama dan sudah dihapus. Jangan dihidupkan lagi.

### Alamat dan port (produksi sekarang)

| Alamat publik | Port lokal | Proses PM2 | Isi |
|---|---|---|---|
| `pikr-manseku.my.id`, `www.` | 25551 | `pikr-web` | situs utama (build statis `frontend/dist`) |
| `d-base.pikr-manseku.my.id` | 25552 | `pikr-backend` | API + `/uploads` |
| `absen.pikr-manseku.my.id` | 25554 (HTTPS self-signed) | `pikr-absen` | web absen (build statis) |
| — | — | `pikr-backup` | ZIP harian pukul 03:00 |

Lalu lintas publik lewat **Cloudflare Tunnel** (`cloudflared`, service Windows `Cloudflared`, rute diatur di dashboard Cloudflare Zero Trust). Rute `absen` memakai `https://localhost:25554` dengan **No TLS Verify** aktif. Frontend memanggil API lewat alamat relatif; server statis meneruskan `/api`, `/uploads`, `/robots.txt`, `/sitemap.xml` ke backend.

---

## 3. Menjalankan

### Produksi (komputer ini)
```bash
cd PIK-R-MANSEKU
pm2 start ecosystem.config.cjs          # pertama kali
pm2 reload ecosystem.config.cjs --update-env && pm2 save
pm2 ls ; pm2 logs pikr-backend
```
Setelah mengubah kode frontend: `npm run build` di `PIK-R-MANSEKU/frontend` (atau `PIK-R-ABSEN/frontend`). Server statis membaca folder `dist` langsung, tidak perlu restart untuk aset baru; backend perlu `pm2 reload pikr-backend`.
Hidup otomatis setelah restart: tugas Windows **`PIKR-PM2-Resurrect`** menjalankan `pm2 resurrect` 30 detik setelah login. Komputer harus **login, menyala, dan tidak tidur** (tidur sudah dimatikan).

### Pengembangan
`npm run dev` (backend, nodemon) dan `npm run dev` di `frontend/` (Vite 25551, proxy ke 25552). Web absen: `npm run dev` di `PIK-R-ABSEN/frontend` (25554, HTTPS basic-ssl).

### `.env` (lihat `.env.example`)
`PORT`, `NODE_ENV=production`, `JWT_SECRET` (acak ≥ 24 karakter; server produksi **menolak** nilai kosong/bawaan), `PUBLIC_SITE_URL`, `FRONTEND_URL`, opsional `ABSEN_SITE_URL`, `API_SITE_URL`, `CORS_ORIGINS`, `DISABLE_WHATSAPP`, `BACKUP_DIR`, `BACKUP_KEEP`, SMTP.
`DATABASE_URL` di `.env` adalah sisa lama (MySQL); **schema Prisma memakai SQLite `local.db`** dan itu yang berlaku.

---

## 4. Pindah ke VPS / server lain

Dirancang supaya mudah. Alamat, link QR, email, WhatsApp, sitemap, robots, dan CORS semuanya turun dari `PUBLIC_SITE_URL` (`src/config/site.js`).

1. Di server baru: Node ≥ 20, PM2, Git. `git clone` kedua repo (sebelahan), `npm install` di `PIK-R-MANSEKU` (otomatis `prisma generate`).
2. Salin **`.env`** (tanpa lewat git) dan satu **ZIP cadangan** terbaru dari `PIK-R-BACKUP`.
3. Pulihkan: ZIP berisi `pikr_manseku.db` → jadikan `PIK-R-MANSEKU/local.db`, dan folder `uploads/` → `PIK-R-MANSEKU/public/uploads/`. (`info.json` di ZIP berisi petunjuk yang sama.)
4. `npm run build` di kedua `frontend/`, lalu `pm2 start ecosystem.config.cjs`, `pm2 save`, dan atur `pm2 startup` (Linux) atau tugas terjadwal (Windows).
5. Arahkan Cloudflare Tunnel / DNS ke server baru. Ganti `PUBLIC_SITE_URL` bila domain berubah.
6. **Matikan bot WhatsApp di server lama sebelum menyalakannya di server baru** (satu sesi hanya boleh dipakai satu perangkat). Sesi ada di folder `.baileys_auth/`. Di `ecosystem.config.cjs` bot mati bawaan; nyalakan dengan `WHATSAPP=1 pm2 start ...`.
7. **QR di kartu yang sudah dicetak berisi `https://pikr-manseku.my.id/@slug`.** Domain itu tidak boleh berhenti hidup, atau semua kartu mati.

---

## 5. Data dan aturan bisnis penting

SQLite `local.db`, model utama: `Member`, `OrgMember`, `Candidate`, `Admin`, `Setting`, `AttendanceSession`, `Attendance`, `AttendanceLog`, `BlogPost/Comment/Like`, `Post`, `AlumniTestimonial`, `ScheduledAnnouncement`, `WhatsAppGroup`, `AnnouncementLog`, `PasswordResetOtp`.

### Akun dan peran
- **Admin dashboard** (`/admin`): peran `DEVELOPER`, `KABINET_UMUM` (tulis), `MEDINFO` (hanya lihat absensi).
- **Akun bersama web absen:** satu akun untuk semua petugas, disimpan di tabel `Setting` (`absen_username`, `absen_password_hash`), **bukan** di tabel `Admin`, karena `seedDefaultAdmin()` di `server.js` menghapus admin bernama lama itu tiap server start. Admin dashboard juga bisa login di web absen.
- **Anggota** login pakai NISN + sandi (untuk mengatur kartu biodata sendiri).
- Pembina boleh tanpa NISN.

### Anggota ↔ Struktur organisasi (sinkron otomatis)
- `OrgMember` aktif (`isCurrent`) adalah **sumber kebenaran**; `Member.role` turunan. Satu anggota = satu baris `OrgMember`.
- Jabatan tunggal (mis. Ketua) otomatis memindahkan pemegang lama (mode `archive` ke arsip atau `remove`).
- Anggota yang jadi **alumni** otomatis tanpa jabatan aktif. Khusus tim inti (Ketua/Wakil/Kabinet) mendapat label `ALUMNI <JABATAN> <PERIODE>`.
- Katalog jabatan bisa diatur admin (Setting `ORG_POSITIONS`: level, urutan, induk, tunggal).
- Kode: `src/utils/orgSync.js`, `orgCatalog.js`, `memberUtils.js`.

### Nama
`formatPersonName` (`src/utils/nameUtils.js`) merapikan nama otomatis: `M.hAlo` → `M. Halo`, `HAIKAL MABRUR` → `Haikal Mabrur`, gelar `S.Pd`.

### Absensi
- Zona waktu **WIB (UTC+7)**; helper di `src/utils/wib.js`. Jangan memakai jam server mentah.
- Jenis kegiatan: `PERTEMUAN` (rutin mingguan, bawaan Jumat 15:00), `WAJIB` (tanggal tertentu, boleh banyak, Setting `absen_wajib_dates`), `TAMBAHAN` (dibuat manual).
- **Alfa otomatis** hanya untuk `PERTEMUAN` dan `WAJIB`. `TAMBAHAN` diisi manual. Anggota yang bergabung setelah tanggal kegiatan tidak dihitung alfa.
- Scan 1 = masuk, scan 2 = keluar, scan 3 = tampilkan data (koreksi lewat Edit Waktu).
- **Mode Cepat** (web absen): scan langsung tercatat tanpa popup. Pagar: scan kedua < 1 menit = `DUPLICATE`, bukan keluar. Tombol **Koreksi Absen** menuju Daftar Anggota.
- **Semua status bisa dikosongkan** (kembali "belum diisi"): `DELETE /api/absen/records/:id`, petugas boleh.
- Absen gagal kirim (offline) disimpan di HP dan dikirim ulang; `clientId` mencegah dobel.
- Pengaturan absensi **hanya di dashboard** (halaman Pengaturan di web absen sudah dihapus; di web absen hanya ada tema, Keluar, History).

### ID Card (jantung kebingungan; baca teliti)
- Depan: **barcode batang Code 128** berisi `memberCode`, mis. `PIKR_0001-26`. Belakang: **QR** berisi `https://pikr-manseku.my.id/@slug` (`slug` = nama tanpa spasi huruf kecil).
- `memberCode` dan `slug` **tidak boleh berubah setelah kartu dicetak**.
- **Kode ID TIDAK dibuat otomatis.** Diisi admin lewat Excel: dashboard → **Absensi → ID Card → Ekspor Excel** (yang sudah berkode di atas, yang belum di bawah) → isi kolom *Kode ID Card* → **Impor Excel** (pratinjau dulu, per baris divalidasi, dicocokkan lewat NISN). **Hapus semua kode** butuh ketik `HAPUS`.
- **ID Card Generator (.exe)** membaca **Excel yang sama** ("Muat Excel daftar…") sebagai sumber kebenaran nama, kode, link. OCR hanya dipakai untuk mencocokkan foto ke baris daftar, **bukan** untuk menentukan kode/link. Itu cara menghindari QR tertukar antar anggota.
- Foto tanpa daftar, daftar tanpa foto, data tidak lengkap, foto dobel → `Failed/failed-list.xlsx`. Yang sukses → `Success/` + `Success/data_anggota.xlsx`.
- Pencocokan nama toleran: tanpa spasi (teks kartu sering dirapatkan), inisial ↔ nama lengkap (`M.` ↔ `Muhammad`), nama depan hilang, singkatan. Hanya diterima bila **tepat satu** kandidat. Aturan di `idcard-generator/processor.py` (`match_name`, `_flat_words_match`); tes di `test_core.py`.
- Build `.exe`: jalankan `build.bat` di `PIK-R-ABSEN/idcard-generator` (butuh Python 3.10–3.13; skrip mengunduh Python 3.12 portabel sendiri lewat `uv` bila perlu). **Jalankan ulang setiap kode `idcard-generator` berubah.** Hasil: `dist/PIKR-IDCard-Generator.exe`.

### Desain (halaman Desain di dashboard)
Setting `SITE_DESIGN` + `Member.cardConfig` (JSON). Whitelist ketat di `src/utils/designConfig.js` (tema, font, radius, bayangan, gaya kartu, sampul, bagian, ikon, hanya path `/uploads/...`). Variabel CSS `--color-accent*`, `--font-*`, `--radius-*` dipasang `applyThemeVars` (`frontend/src/utils/theme.js`) ke `html:not([data-admin])`. **Warna di CSS situs publik harus memakai `var(--color-accent*)`, jangan menulis oranye langsung** (44 tempat sudah dibersihkan).

---

## 6. Keamanan dan hal yang WAJIB dilakukan pengurus baru

1. **Ganti kata sandi bawaan SEKARANG.** Akun developer dashboard dan akun bersama web absen masih memakai kata sandi bawaan yang **tertulis di kode yang publik** (`src/server.js`, `src/middlewares/authAbsen.js` dan skrip uji). Siapa pun bisa membacanya di GitHub. Ganti lewat dashboard (Pengguna) dan lewat `PUT /api/absen/account/reset` / dashboard. Setelah diganti, string di kode hanya jadi nilai awal basi.
2. `JWT_SECRET` produksi sudah acak, tapi **jangan pernah di-commit**. `.env` ada di `.gitignore`. Mengganti secret = semua orang logout sekali.
3. **Data pribadi anggota** (NISN, email, WhatsApp, foto ID Card, daftar Excel, cadangan DB) **tidak boleh masuk git**. `.gitignore` di kedua repo sudah menutupnya; jangan dilonggarkan.
4. **Cadangan** tersimpan di disk yang sama dengan server. Salin `PIK-R-BACKUP` ke flashdisk/cloud berkala. Cadangan = database + seluruh gambar (ZIP), juga bisa diunduh dari dashboard → Pengaturan.
5. Komputer produksi tunggal: mati listrik atau komputer dimatikan = situs mati. Rencana pindah VPS ada di bagian 4.
6. Rate limit login (10 per 15 menit per IP) aktif di produksi; IP asli pengunjung dibaca lewat `trust proxy`.

---

## 7. Menguji

- **Backend** (database sandbox terpisah, `PIK-R-ABSEN/.sandbox`, **tidak menyentuh DB produksi**):
  ```bash
  cd PIK-R-ABSEN/.sandbox && cp -r ../../PIK-R-MANSEKU/src/. src/
  ABSEN_PASSWORD=sandi-uji-absen node test-absen.js   # 64 tes API absensi, Mode Cepat, kosongkan (sandi uji, bukan produksi)
  node test-idcard.js  # Excel ID Card
  node test-excel.js node test-orgsync.js node test-orgcatalog.js node test-design.js
  ```
  Sinkronkan `src/` sandbox dulu setiap kode backend berubah. Sandbox butuh paket `multer` terpasang.
- **Generator:** `PIK-R-ABSEN/idcard-generator`: `python test_core.py` (84 tes; pakai Python 3.12 venv `.tools/venv`).
- **UI di Chrome headless:** skrip `.sandbox/ui/*.cjs` (puppeteer-core). Contoh: `quick-mode.cjs` (butuh `serve-ui.js` + Vite dengan `VITE_PROXY_TARGET`).
- **Jangan** menjalankan uji yang menulis data (tombol simpan, impor sungguhan, hapus) terhadap server produksi.

---

## 8. Jebakan yang sudah memakan waktu (baca sebelum bekerja)

- **Shell Windows/Git Bash merusak string panjang:** heredoc dengan apostrof/backtick gagal, backslash hilang, `${}` ikut diinterpretasikan. Tulis file dengan alat Write, atau skrip `.cjs`/`.mjs`, jangan lewat `echo`/heredoc untuk kode.
- Path yang diawali `/` di Git Bash berubah jadi `C:/Program Files/Git/`. Pakai `MSYS_NO_PATHCONV=1` atau jalankan Node.
- `/tmp` pada Node = `D:\tmp`.
- Express 5: rute wildcard `*` diganti regex `/^.*$/`.
- OCR kartu baru membaca nama **tanpa spasi** karena jarak antar kata sempit; itu sudah ditangani di pencocokan, bukan di OCR.
- `AdminWebEditorPage` dan Blog publik sebagian sudah dihapus/diganti; halaman Desain menggantikan Web Editor.
- 33 dari 36 `photoPath` anggota menunjuk file yang **tidak ada di disk** (foto hanya ada di VPS lama). Lihat bagian 9.
- Git di komputer ini **belum punya identitas pengguna**. Jangan ubah konfigurasi global; atur sendiri di komputer Anda.

---

## 9. Belum selesai / ide berikutnya

| Item | Status |
|---|---|
| **Reset foto anggota** | Belum. Kosongkan `photoPath` yang file-nya hilang (rencana: dry-run → backup DB → apply). Struktur organisasi **jangan** diisi. |
| Anggota yang belum terdaftar di website | Beberapa kartu tidak punya data; mereka diminta mendaftar dulu, lalu dibuatkan kartu susulan (Gelombang berikutnya). |
| **Pencarian di web absen** | Belum. Rancangan: kolom cari di Daftar Anggota (nama, kelas, kode; abaikan aksen/urutan kata), sorot hasil, tanpa auto-pilih. |
| **Performa web absen "zero lag"** | Sebagian (kode awal 120 → 14 kB gzip, animasi transform/opacity). Belum diukur di HP asli. Rencana: kurangi bayangan clay, batasi stagger, self-host font, cek service worker. |
| Custom font (unggah) dan lebih banyak gaya kartu / tema | Belum. Whitelist `designConfig.js` perlu path `/uploads/fonts/`. |
| Kamera, getar, suara iOS | Belum diuji di HP asli. |
| Cloudflare: banyak 404 di konsol | Tidak berbahaya; font Google dan aset opsional. |
| Hapus sisa lama: `concurrently`, `local.db.bak`, `local.db.sebelum-bio`, `pikr_manseku_backup*.db` di root | Boleh dihapus setelah cadangan baru dipastikan baik. |

---

## 10. Peta kode singkat

```
PIK-R-MANSEKU/
  src/server.js            titik masuk; CORS, rute, seed admin, SPA fallback
  src/config/site.js       SEMUA alamat situs turun dari sini
  src/config/secret.js     JWT_SECRET (menolak nilai lemah di produksi)
  src/controllers/         admin, absen, design, candidates, ...
  src/utils/               orgSync, orgCatalog, memberExcel, idcardExcel, designConfig, backup, wib, slug, nameUtils
  scripts/                 serve-static.mjs, backup.mjs, arsipkan-kelas-xii.js, rapikan-nama.js
  ecosystem.config.cjs     PM2 produksi
  frontend/src/pages/{public,admin}, components/{common,admin}, api/, utils/theme.js
PIK-R-ABSEN/
  frontend/src             web absen (HomePage, ScanPopup, KeteranganSheet, Scanner, queue offline)
  idcard-generator/        processor.py (pencocokan), excel_io.py, app.py (GUI PySide6), build.bat
  .sandbox/                database + skrip uji (bukan untuk deploy)
```

Riwayat perubahan rinci: `CHANGELOG.md` di tiap repo (utama v2.2.0, absen v1.2.0). Dokumen lama `architecture.md`, `target.md`, `demonstration.md` ada di repo utama; **`architecture.md` masih menyebut MySQL dan port 25553, jadi sebagian sudah usang**. Dokumen ini yang berlaku.
