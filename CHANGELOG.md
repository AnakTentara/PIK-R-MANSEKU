# Changelog — PIK-R MANSEKU

Seluruh rilis, pembaruan fitur, dan perbaikan bug pada platform PIK-R MANSEKU dicatat di dalam dokumen ini.

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
