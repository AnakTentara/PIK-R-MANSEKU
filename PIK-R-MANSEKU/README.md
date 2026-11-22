# PIK-R MANSEKU

> Platform Website & REST API Resmi **PIK-R MAN 1 Muara Enim** (PIK-R MANSEKU).  
> Dibangun dengan Node.js + Express, React (Vite), Prisma ORM, WhatsApp Bot (Baileys), dan Sistem Manajemen Akun Terpadu.

---

## ✨ Fitur Utama

- **📋 Pendaftaran Calon Anggota** — Form pendaftaran publik berbasis NISN.
- **🏆 Pengumuman Kelulusan (SNBP-Style)** — Pengecekan status LULUS / TIDAK LULUS / PENDING berbasis NISN.
- **💬 Cek & Reset Sandi via WhatsApp** — 
  - Tombol **Cek Sandi** langsung mengarahkan ke obrolan WA Bot (`/sandi`).
  - Fitur **Reset Sandi OTP** (`/sandi ganti`) mengirimkan 6-digit OTP ke WhatsApp terdaftar untuk verifikasi aman di halaman `/reset-sandi`.
- **👤 Manajemen Akun Terpadu** — Pengelolaan akun Pembina (tanpa NISN), Anggota (Member), dan Admin Sistem dalam 1 dashboard terpusat.
- **🏢 Bagan Struktur Organisasi Efisien** — Otomatis menghubungkan akun terdaftar tanpa duplikasi input data/foto.
- **🎓 Sistem Alumni Otomatis** — Batas masa aktif keanggotaan berbasis jenjang kelas (Kelas 10 = 3 tahun, Kelas 11 = 2 tahun, Kelas 12 = 1 tahun).
- **🛡️ Dashboard Admin Lengkap** — CRUD Pendaftar, Manajemen Pengurus, Web Editor, File Manager, dan Export Excel/JSON.
- **🤖 WhatsApp Bot (Baileys)** — Perintah `/cek [Nama/NISN]`, `/sandi`, dan `/sandi ganti`.
- **📅 Absensi Online** — Web absen terpisah (`absen.pikr-manseku.my.id`) dengan scan barcode ID Card, rekap, dan ekspor Excel/PDF. API ada di backend yang sama (`/api/absen/*`).
- **🪪 ID Card & Biodata Publik** — Barcode batang (`PIKR_0001-26`) di depan kartu, QR tautan biodata `/@nama` di belakang. Kartu bisa diatur anggota sendiri.
- **🎨 Desain** — Tema warna situs, gaya kartu biodata, dan isi halaman (menggantikan Web Editor).
- **🧭 Struktur Organisasi Dinamis** — Hierarki jabatan bisa diatur (seret-lepas), sinkron otomatis dengan peran anggota, arsip kepengurusan, dan label alumni tim inti.
- **📊 Excel Anggota** — Ekspor dan impor dengan pratinjau per baris.
- **📝 Blog & Forum Diskusi** — Postingan jurnalisme dan ruang diskusi anggota.
- **📱 Aplikasi Mobile Resmi & Pusat Unduhan (`/downloads`)** — Aplikasi Android Flutter mandiri (`ruang-cerita.apk`, package `org.pikrmanseku.app`), web hosting APK terpusat, dan panduan instalasi web app di iPhone / iOS.
- **🔔 Notifikasi Massal & Web Push (`/admin/notifikasi`)** — Panel siaran pengumuman Web Push resmi ke seluruh perangkat anggota & pengunjung, dilengkapi halaman hitung mundur jadwal pertemuan (`/push/pertemuan`) dan riwayat siaran.
- **🌊 Smooth Inertia Scroll & ScrollReveal** — Sensasi pengguliran berbobot halus (Lenis) dan transisi animasi fade-in/out di seluruh rute halaman publik.
- **💬 Ruang Cerita 2.5** — Platform media sosial & konseling sebaya siswa: Bilik Konseling terenkripsi, tata letak card adaptif, CTA desktop/mobile cerdas, dan QnA butter-smooth collapsible.
- **👥 Bagan Kepengurusan Dinamis (`/kami`)** — Tata letak responsif dinamis pimpinan & pengurus inti (3 card melebar proporsional tanpa grid kosong).

---

## 🛠️ Tech Stack

| Layer | Teknologi |
|---|---|
| **Frontend Web** | React 18, Vite, React Router DOM, Lenis (Smooth Scroll), CSS Modules, Lucide Icons, React Hot Toast |
| **Mobile App** | Flutter (Dart 3.6), Riverpod, GoRouter, Dio, Secure Storage, InAppWebView (Android & iOS) |
| **Backend** | Node.js, Express.js, Web Push API (VAPID) |
| **Database** | Prisma ORM (MySQL / SQLite Fallback) |
| **Autentikasi** | JWT (jsonwebtoken), bcryptjs, OTP verification |
| **Integrasi WA** | `@whiskeysockets/baileys` (WhatsApp Web API) + Game & Leveling System |
| **Utilities** | Multer (Upload foto), Sharp (Kompresi WebP), Nodemailer (Email SMTP), xlsx (Excel Export) |

---

## 🚀 Memulai (Development)

### Prasyarat
- Node.js v18+
- npm v9+
- Database MySQL / SQLite

### Instalasi & Menjalankan

```bash
# Clone repository
git clone https://github.com/AnakTentara/PIK-R-MANSEKU.git
cd PIK-R-MANSEKU

# Install backend dependencies
npm install

# Push database schema & generate client
npx prisma db push
npx prisma generate

# Install & Build frontend
cd frontend
npm install
npm run build
cd ..

# Menjalankan Server Development
npm run dev
```

---

## 🤖 WhatsApp Bot Commands

| Perintah | Kategori | Fungsi |
|---|---|---|
| `/cek [Nama / NISN]` | Administrasi | Mencari hasil seleksi pendaftar berdasarkan Nama atau NISN. |
| `/sandi` | Keamanan | Memeriksa NISN & kata sandi terdaftar untuk nomor WhatsApp pengirim. |
| `/sandi ganti` | Keamanan | Mengirimkan 6-digit kode OTP verifikasi & tautan reset kata sandi ke WhatsApp pengguna. |
| `/profil` | Komunitas | Melihat kartu profil digital anggota, poin XP, dan level aktif. |
| `/leaderboard` | Interaktif | Menampilkan peringkat klasemen keaktifan dan level anggota di grup. |
| `/kuis` / `/tebak` | Game & Edukasi | Menjalankan kuis seputar kesehatan reproduksi remaja (GenRe) & game tebak kata. |

---

## 📁 File Dokumentasi
- **[CHANGELOG.md](./CHANGELOG.md)** — Catatan riwayat pembaruan dan rilis fitur.
- **[architecture.md](./architecture.md)** — Arsitektur teknis dan alur sistem.

---

## 👥 Tentang
Website ini dikembangkan untuk mendukung administrasi, publikasi jurnalisme, dan rekrutmen anggota **PIK-R (Pusat Informasi dan Konseling Remaja) MAN 1 Muara Enim**, Sumatera Selatan.

> *"Beriman · Bertanggung Jawab · Berencana"*
