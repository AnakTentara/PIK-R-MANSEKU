# 🎯 Target & Roadmap

Dokumen ini berisi target pengembangan website PIK-R MANSEKU secara keseluruhan, dibagi berdasarkan fase dan prioritas.

---

## ✅ Fase 1 — Backend API (SELESAI)

- [x] Inisialisasi project Node.js (ES Modules, Express)
- [x] Dynamic multi-database: MySQL (utama) + SQLite (fallback otomatis)
- [x] Konfigurasi MySQL & SMTP tersimpan di dashboard, bukan `.env`
- [x] Prisma ORM dengan dua skema (MySQL & SQLite)
- [x] REST API Pendaftaran Calon Anggota PIK-R
  - [x] Form pendaftaran publik (NISN, Nama, Kelas, WA, Email, Gender, Alasan)
  - [x] Cek status kelulusan berbasis NISN (SNBP-like)
  - [x] Login anggota menggunakan NISN + Password
  - [x] Edit biodata diri sendiri
- [x] REST API Admin Dashboard
  - [x] Login admin (JWT Authentication)
  - [x] CRUD lengkap data pendaftar
  - [x] Set status LULUS / TIDAK LULUS / PENDING
  - [x] Auto-generate password sederhana untuk semua akun
  - [x] Export data ke Excel (`.xlsx`)
  - [x] Export akun anggota ke JSON
  - [x] Kelola Pengaturan (MySQL & SMTP) secara real-time
- [x] Sistem Blog lengkap
  - [x] CRUD Post oleh Admin
  - [x] Komentar publik tanpa autentikasi (cukup nama)
  - [x] Admin bisa hapus komentar
- [x] Notifikasi Massal
  - [x] Email pengumuman kelulusan dari `kelulusan@pikr-manseku.my.id`
  - [x] Notifikasi WhatsApp via bot
  - [x] Deteksi revisi status & kirim notifikasi revisi otomatis
- [x] WhatsApp Bot (Baileys)
  - [x] Command `/cek [Nama]` dengan algoritma string similarity
  - [x] Command `/cek [NISN]` untuk pencarian eksak
  - [x] Saran nama mirip jika tidak ditemukan persis
- [x] Deployment-ready untuk Pterodactyl (Port `25552`)
- [x] Git repository terhubung ke GitHub

---

## ⬜ Fase 2 — Frontend Website (BELUM DIMULAI)

### Halaman Publik
- [ ] **Landing Page** — Profil singkat PIK-R MANSEKU, CTA pendaftaran
- [ ] **Halaman Pendaftaran** — Form pendaftaran calon anggota
- [ ] **Halaman Cek Kelulusan** — Input NISN → Tampilkan status LULUS / TIDAK LULUS / PENDING (SNBP-like)
- [ ] **Blog** — List postingan dan halaman detail artikel + Kolom komentar
- [ ] **Login Anggota** — Halaman login untuk anggota terdaftar (NISN + Password)
- [ ] **Profil Anggota** — Halaman biodata diri + Edit profil

### Halaman Admin Dashboard
- [ ] **Login Admin**
- [ ] **Dashboard Overview** — Statistik ringkas (total pendaftar, lulus, tidak lulus, pending)
- [ ] **Halaman Pendaftar (Member)** — Tabel daftar peserta, filter, search
- [ ] **Detail Pendaftar** — Biodata lengkap per peserta
- [ ] **Edit Biodata Pendaftar** — Form edit data peserta oleh admin
- [ ] **Manajemen Status** — Tombol set LULUS / TIDAK LULUS + Tombol Kirim Notifikasi
- [ ] **Export Data** — Tombol download Excel & JSON
- [ ] **Auto-Generate Password** — Tombol generate password massal
- [ ] **Manajemen Blog** — Buat, edit, hapus postingan
- [ ] **Kelola Komentar** — Hapus komentar tidak pantas
- [ ] **Pengaturan (Settings)** — Form konfigurasi MySQL & SMTP secara real-time

---

## ⬜ Fase 3 — Penyempurnaan & Produksi

- [ ] Rate limiting pada API publik (mencegah spam pendaftaran)
- [ ] Validasi NISN lebih ketat (format angka 10 digit)
- [ ] Pagination & search pada list pendaftar admin
- [ ] Custom domain `pikr-manseku.my.id` — konfigurasi DNS & HTTPS
- [ ] Bot WhatsApp: tambah command `/info` untuk info umum PIK-R
- [ ] Monitoring uptime server sederhana
- [ ] Backup database berkala
