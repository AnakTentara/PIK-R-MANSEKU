# Changelog — PIK-R MANSEKU

Seluruh rilis, pembaruan fitur, dan perbaikan bug pada platform PIK-R MANSEKU dicatat di dalam dokumen ini.

---

## [v2.1.0] — 2026-11-03

ID Card kini bersumber dari satu daftar Excel, supaya kode barcode dan link QR tidak lagi tertukar antar anggota.

### 🌟 Fitur Baru
- **Absensi → ID Card: ekspor, impor, dan reset kode lewat Excel**
  - Ekspor daftar anggota aktif (No, Kode ID Card, Nama, NISN, Email, No. WhatsApp, Jenis Kelamin, Kelas, Link Profil). Yang sudah berkode di atas, yang belum di bawahnya.
  - Impor Excel dengan pratinjau dulu. Dicocokkan lewat NISN (cadangan: nama persis), tiap baris divalidasi (format kode, kode dobel, kode dipakai orang lain, anggota tidak ditemukan). Baris yang salah tidak menggagalkan baris lain, dan tukar kode antar dua anggota diperbolehkan.
  - "Hapus semua kode" dengan konfirmasi ketik HAPUS (hanya Developer/Kabinet Umum). Data anggota dan link profil tidak ikut terhapus.
- **Backup berisi gambar:** unduhan cadangan di Pengaturan kini berupa ZIP (database + seluruh folder `uploads` + `info.json`). Database diambil lewat `VACUUM INTO` sehingga konsisten walau server sedang berjalan.
- **Tema situs publik menyeluruh:** 44 warna oranye yang tertulis langsung di CSS publik (garis judul section, hero, judul halaman, tombol, bayangan, kartu 404, forum, kartu unduhan profil) kini mengikuti warna tema pilihan. Variabel baru `--color-accent-light`.

### 🔧 Perubahan
- Kode ID Card tidak lagi dibuat otomatis. Admin mengisinya lewat Excel supaya sama persis dengan kartu cetak. Anggota baru tetap otomatis mendapat link profil (`/@nama`).
- Dihapus: impor `data_anggota.json`, endpoint `/api/absen/tool/*`, `/api/absen/import-idcards`, dan kunci API `ABSEN_TOOL_KEY` (tidak diperlukan lagi; generator membaca Excel langsung).
- CORS mengizinkan `www.` dan `d-base.pikr-manseku.my.id`.
- Dependensi baru: `archiver` (ZIP backup).

### 🐛 Perbaikan
- Tombol Ekspor Excel di Absensi → ID Card selalu gagal karena `saveBlob` belum diimpor.
- Tes absensi "Alfa otomatis" bergantung pada hari tes dijalankan; kini deterministik.

---

## [v2.0.0] — 2026-11-02

Rilis besar: sistem absensi online, ID Card ber-barcode, hierarki kepengurusan yang bisa diatur, dan halaman Desain.

### 🌟 Fitur Baru
- **Sistem Absensi (`absen.pikr-manseku.my.id`, proyek terpisah)**
  - Aplikasi web mobile-first bergaya claymorphism: scan barcode batang ID Card, daftar anggota A–Z, konfirmasi dua langkah (tombol memanjang), edit waktu dengan jam bulat, keterangan Sakit/Izin/Alfa, riwayat, ekspor Excel dan PDF, mode gelap.
  - Absen yang gagal terkirim karena sinyal disimpan di HP lalu dikirim ulang otomatis tanpa data dobel.
  - Jenis kegiatan: **Pertemuan** (rutin mingguan, default Jum'at 15.00), **Kegiatan Wajib** (tanggal tertentu, boleh lebih dari satu), dan **Tambahan** (dibuat manual). Alfa otomatis untuk Pertemuan dan Wajib; Tambahan diisi manual.
  - Login akun bersama petugas; password bisa diganti atau direset admin.
- **ID Card**: barcode batang depan berisi kode `PIKR_0001-26`, QR belakang berisi tautan biodata lengkap. Aplikasi **ID Card Generator** (Windows, Python) membaca nama dengan OCR, mengurutkan INTI lalu A–Z, memberi kode, dan menempel barcode/QR dengan lebar garis tajam untuk dicetak.
- **Biodata publik `/@nama`**: tampilan portofolio (foto, nama, jabatan, bio, biodata). NISN, WhatsApp, dan email tidak pernah dikirim ke halaman ini.
- **Menu Absensi di dashboard**: ringkasan, kegiatan, rekap (ekspor Excel), ID Card (impor `data_anggota.json` dengan pencocokan nama singkatan), dan pengaturan pertemuan/kegiatan wajib.
- **Halaman Desain (menggantikan Web Editor)**: warna tema situs dengan pratinjau langsung (8 tema + warna bebas), sudut, bayangan, font; gaya kartu biodata (4 gaya, 5 motif sampul), foto bawaan, bagian kartu yang disembunyikan; plus semua isi Web Editor lama (Beranda & Menu, Tentang Kami, Visi & Misi, Halaman Baru).
- **Kartu Saya (anggota)**: anggota yang login bisa mengganti sampul, foto khusus kartu, warna aksen, menyembunyikan bagian, dan menambah hingga 6 kartu info. Bio diambil dari profil.
- **Ekspor / Impor Excel anggota (`/admin/anggota`)**: templat, ekspor sesuai tab, impor dengan pratinjau per baris (baru / perbarui / dilewati + alasan). Nama, kelas, gender, dan nomor WhatsApp dinormalkan otomatis.
- **Editor Hierarki Jabatan**: tambah jabatan baru, ganti nama, geser antar-baris atau berdampingan dengan seret-lepas. Bagan publik mengikuti susunan ini.
- **Alur penggantian pejabat**: popup konfirmasi (kartu pejabat lama dan baru), lalu pilihan *Arsipkan / Tidak / Batal*.
- **Pemilih bergaya claymorphism** menggantikan seluruh dropdown dashboard: kartu, pencarian, kategori, pengurutan A–Z, loncat huruf.

### ⚡ Peningkatan & Refactoring
- **Satu sumber kebenaran Anggota ↔ Struktur**: jabatan aktif menentukan `role` anggota. Mengubah peran di `/admin/anggota` otomatis memperbarui `/admin/org`, dan sebaliknya. Banner sinkronisasi menampilkan dan memperbaiki data yang tidak cocok.
- **Aturan alumni**: alumni tidak punya jabatan aktif dan tidak masuk bagan. Mantan tim inti diberi label, mis. `ALUMNI KETUA UMUM 2025/2026`. Jabatan lama tersimpan di **Arsip Kepengurusan** (dikembalikan setelah dihapus di v1.2.0).
- `/admin/anggota`: urutan Status lalu Kelas (alumni paling belakang), kolom Jabatan, label alumni.
- `/admin/users`: satu halaman — Pembina di atas, Developer & Admin Website di bawah.
- Format nama konsisten di semua jalur input (pendaftaran, tambah/edit anggota, impor Excel): `M.hAlo` → `M. Halo`, gelar `S.Pd` tetap utuh.
- Konfigurasi upload (`multer`) yang duplikat di tiga route digabung ke `multerConfig.js`.
- Tombol aksi di halaman Struktur dan Anggota dipindah ke baris pencarian (tidak tertutup notifikasi).

### 🔒 Keamanan
- API struktur organisasi publik tidak lagi mengirim NISN pengurus.
- Seluruh nilai tema dan kartu disaring daftar putih di server; path foto hanya `/uploads/…`; teks kartu bebas HTML.

### 🗑️ Dihapus
- Halaman Web Editor (digabung ke Desain; `/admin/web-editor` dialihkan).
- `BlogPage` dan `BlogPostPage` publik yang tidak terpasang di route mana pun, dan dependensi CKEditor yang tidak dipakai.

### 🗄️ Database
- `Member`: tambah `memberCode`, `slug`, `bio`, `cardConfig`.
- Tabel baru: `AttendanceSession`, `Attendance`, `AttendanceLog`.
- Setting baru: `ORG_POSITIONS`, `SITE_DESIGN`, `absen_*`.
- Jalankan `npx prisma db push` setelah memperbarui kode (hanya menambah kolom/tabel).

### 🔧 Catatan Peningkatan
- Setelah deploy, ID anggota dan tautan profil dibuat otomatis saat server start. Samakan dengan kartu cetak lewat menu **Absensi → ID Card → Impor** memakai `Success/data_anggota.json` dari ID Card Generator.
- Salin folder `public/uploads/photos` dari server produksi; berkas foto tidak ikut dalam backup database.
- Tambahkan `ABSEN_TOOL_KEY` di `.env` dan origin `https://absen.pikr-manseku.my.id` pada CORS.

---

## [v1.2.0] — 2026-07-23

### 🌟 Fitur Baru (New Features)
- **Manajemen Akun Terpadu (`/admin/users`)**:
  - Halaman terpusat untuk mengelola seluruh akun (Pembina, Anggota/Member, dan Admin Sistem) dalam 3 tab terpisah.
  - **Pendaftaran Akun Pembina Tanpa NISN**: Pembina dapat didaftarkan langsung menggunakan Nama, No WhatsApp, Email, dan Password tanpa kewajiban mengisi NISN.
- **WhatsApp Cek Sandi & OTP Reset Sandi**:
  - Nomor WhatsApp Bot Resmi disesuaikan ke `082373352409` (`6282373352409`).
  - Penanganan **WhatsApp LID JID**: Menambahkan algoritma pemetaan multi-level (nomor telepon `s.whatsapp.net`, `remoteJidAlt`, `participant`, serta pencarian fallback berdasarkan `pushName` / WhatsApp display name) sehingga pengguna WhatsApp LID tetap terdeteksi secara otomatis.
  - Perintah WhatsApp Bot `/sandi`: Menampilkan pemberitahuan keamanan, instruksi ubah sandi, dan tombol **"Baca Selengkapnya"** (menggunakan karakter `\u200B` x 4000) untuk membuka kredensial NISN & kata sandi terdaftar secara rahasia.
  - Perintah WhatsApp Bot `/sandi ganti`: Meng-generate 6-digit kode OTP (berlaku 10 menit) dan mengirimkan link reset sandi.
  - Halaman Reset Sandi Publik (`/reset-sandi`): Halaman verifikasi OTP 6-digit untuk mengubah kata sandi secara aman.
- **Pengumuman Kelulusan & Cek Sandi**:
  - Merubah tombol *Login Anggota* bagi status **LULUS** di halaman `/cek-kelulusan` menjadi **💬 Cek Sandi (WhatsApp)** yang mengarahkan ke nomor bot `082373352409` dengan preset `/sandi\n*KIRIMKAN PESAN INI UNTUK MENGECEK SANDI*`.

### ⚡ Peningkatan & Refactoring (Enhancements)
- **Otomatisasi Struktur Organisasi (`AdminOrgPage.jsx`)**:
  - Menghubungkan akun anggota/pembina langsung ke struktur organisasi (otomatis inherit nama dan foto profil).
  - Auto-filter opsi dropdown akun yang sudah terdaftar di pengurus untuk mencegah duplikasi.
- **Penghapusan Sistem Arsip Kepengurusan**:
  - Menghapus tab *Arsip Kepengurusan* dan field `yearEnd`/`isCurrent` pada Struktur Organisasi agar seluruh data merepresentasikan pengurus aktif saat ini.
  - Sistem batas masa aktif keanggotaan (Kelas 10 = 3 thn, Kelas 11 = 2 thn, Kelas 12 = 1 thn) dan Halaman Alumni (`/alumni`) tetap utuh.
- **Penyempurnaan UI Navbar**:
  - Menambahkan `white-space: nowrap` dan ukuran font yang pas pada tombol `Dashboard (Admin)` untuk mencegah *text-wrap*.

---

## [v1.1.0] — 2026-07-20

### 🌟 Fitur Baru
- Halaman Cek Kelulusan bergaya SNBP.
- Pengiriman notifikasi massal WhatsApp & Email.
- Dashboard Admin Web Editor & File Manager.

---

## [v1.0.0] — 2026-07-01
- Rilis perdana sistem backend & frontend PIK-R MANSEKU.
