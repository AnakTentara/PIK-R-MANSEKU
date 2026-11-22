# 🌟 PIK-R MANSEKU — School SaaS Ecosystem

> **Platform Terpadu Pengelolaan Informasi, Konseling Remaja, Absensi Berbasis Barcode, Media Sosial Ramah Siswa, dan Aplikasi Mobile untuk Instansi Pendidikan.**  
> Dikembangkan sebagai solusi **Software-as-a-Service (SaaS)** modern untuk sekolah menengah (SMA/MA/SMK).

---

## 🏗️ Struktur Monorepo Proyek

Ekosistem ini terdiri dari modul-modul independen yang terhubung ke satu backend engine pusat:

| Direktori Modul | Peran & Deskripsi | Port / Target |
|---|---|---|
| **[`PIK-R-MANSEKU/`](./PIK-R-MANSEKU)** | **Core Engine & Portal Utama**: RESTful API Backend (Node.js/Express/Prisma), WhatsApp Bot Gateway (Baileys), Web Push Engine, dan Portal Web Publik/Admin Dashboard (React 18 + Vite). | Backend: `25552`<br>Web Portal: `25551` |
| **[`PIK-R-ABSEN/`](./PIK-R-ABSEN)** | **Modul Absensi Online & ID Card**: Antarmuka pemindaian cepat barcode ID Card (Code128), rekapitulasi kehadiran per kelas, dan generator ID Card siap cetak. | Web Absen: `25554` |
| **[`pikr_app/`](./pikr_app)** | **Aplikasi Mobile Resmi (Flutter)**: Aplikasi native Android (`org.pikrmanseku.app`) & iOS dengan performa tinggi, akses offline cache, kamera native, dan push notification. | Android APK / iOS |
| **[`RUANG CERITA PIK-R/`](./RUANG%20CERITA%20PIK-R)** | **Ruang Cerita Web App (PWA)**: Media sosial ramah remaja khusus siswa MAN 1 Muara Enim dengan feed visual, stories 24 jam, DM terenkripsi AES-256-GCM, dan Bilik Konseling Sebaya anonim. | Web App: `25555` |

---

## ✨ Fitur Utama Seluruh Ekosistem

1. **📋 Pendaftaran & Seleksi Mandiri (SNBP-Style)**: Form validasi NISN, upload berkas terkompresi WebP, dan pengumuman interaktif dengan konfeti selebrasi.
2. **🏢 Bagan Struktur Organisasi Dinamis**: Manajemen 5 level hierarki kepengurusan sekolah dengan fitur *auto-populate* dari akun yang sudah ada, pengarsipan masa bakti, dan layout dinamis 3-card responsif.
3. **🪪 Absensi Cepat Barcode & ID Card Digital**: Barcode Code128 di depan kartu dan QR Code biodata `/@slug` di belakang kartu, dengan suara bip audio verifikasi dan ekspor matriks kehadiran Excel.
4. **💬 Ruang Cerita (Sosial & Konseling Sebaya)**: Foto/video carousel dengan sanitasi metadata lokasi GPS via Sharp, chat terenkripsi at-rest, dan hotline darurat SEJIWA 119 / SAPA 129.
5. **🔔 Notifikasi Massal & Web Push Protocol**: Pengiriman pengumuman resmi ke seluruh browser dan ponsel siswa, terintegrasi dengan countdown live jadwal pertemuan rutin (`/push/pertemuan`).
6. **🤖 WhatsApp Gateway & Gamifikasi**: Pengecekan hasil seleksi (`/cek`), OTP reset sandi (`/sandi ganti`), sistem poin XP, leaderboard grup, dan kuis edukasi GenRe.
7. **🌊 Smooth Inertia Scroll & ScrollReveal**: Pengalaman navigasi web mewah (Lenis momentum scroll) dan transisi animasi fade-in/out di seluruh rute halaman publik.

---

## 📚 Dokumentasi Lengkap

- **[📖 Penjelasan Teknis Lengkap](./penjelasan-teknis.md)** — Spesifikasi detail arsitektur monorepo, konektivitas 4 frontend ke backend, dan dokumentasi per modul.
- **[🚀 Next Updates Roadmap](./NextUpdates.md)** — Rencana pengembangan generator QR Code terintegrasi, modularisasi pendaftaran sebagai addon, dan persiapan multi-tenancy SaaS sekolah.
- **[📝 Changelog](./PIK-R-MANSEKU/CHANGELOG.md)** — Catatan riwayat rilis dan pembaruan versi.

---

## 👥 Pengembang & Lisensi
Dikembangkan untuk mendukung administrasi digital, publikasi, dan kesehatan mental remaja **PIK-R MAN 1 Muara Enim**, Sumatera Selatan.

> *"Beriman · Bertanggung Jawab · Berencana"*
