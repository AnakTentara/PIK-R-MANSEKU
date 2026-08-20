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
- **📝 Blog & Forum Diskusi** — Postingan jurnalisme dan ruang diskusi anggota.

---

## 🛠️ Tech Stack

| Layer | Teknologi |
|---|---|
| **Frontend** | React 18, Vite, React Router DOM, CSS Modules, Lucide Icons, React Hot Toast |
| **Backend** | Node.js, Express.js |
| **Database** | Prisma ORM (MySQL / SQLite Fallback) |
| **Autentikasi** | JWT (jsonwebtoken), bcryptjs, OTP verification |
| **Integrasi WA** | `@whiskeysockets/baileys` (WhatsApp Web API) |
| **Utilities** | Multer (Upload foto), Nodemailer (Email SMTP), xlsx (Excel Export) |

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

| Perintah | Fungsi |
|---|---|
| `/cek [Nama / NISN]` | Mencari hasil seleksi pendaftar berdasarkan Nama atau NISN. |
| `/sandi` | Memeriksa NISN & kata sandi terdaftar untuk nomor WhatsApp pengirim. |
| `/sandi ganti` | Mengirimkan 6-digit kode OTP verifikasi & tautan reset kata sandi ke WhatsApp pengguna. |

---

## 📁 File Dokumentasi
- **[CHANGELOG.md](./CHANGELOG.md)** — Catatan riwayat pembaruan dan rilis fitur.
- **[architecture.md](./architecture.md)** — Arsitektur teknis dan alur sistem.

---

## 👥 Tentang
Website ini dikembangkan untuk mendukung administrasi, publikasi jurnalisme, dan rekrutmen anggota **PIK-R (Pusat Informasi dan Konseling Remaja) MAN 1 Muara Enim**, Sumatera Selatan.

> *"Beriman · Bertanggung Jawab · Berencana"*
