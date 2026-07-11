# 🏗️ Architecture

Dokumen ini menjelaskan arsitektur teknis backend website PIK-R MANSEKU secara menyeluruh.

---

## Gambaran Umum Sistem

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                             │
│                                                                   │
│   Browser (Frontend)           WhatsApp (User)                   │
│   Port 25553                   Command: /cek                     │
└──────────────────┬──────────────────────────┬────────────────────┘
                   │ HTTP/REST                │ Baileys WS
                   ▼                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                     BACKEND (Node.js + Express)                  │
│                         Port 25552                               │
│                                                                   │
│   ┌────────────────┐   ┌───────────────┐   ┌─────────────────┐  │
│   │  REST API      │   │  WhatsApp Bot │   │  Email Service  │  │
│   │  (Express)     │   │  (Baileys)    │   │  (Nodemailer)   │  │
│   └───────┬────────┘   └──────┬────────┘   └────────┬────────┘  │
│           │                   │                      │            │
│           └───────────────────┼──────────────────────┘            │
│                               ▼                                   │
│                    ┌──────────────────┐                           │
│                    │  Prisma ORM      │                           │
│                    │  (DB Layer)      │                           │
│                    └────────┬─────────┘                           │
└─────────────────────────────┼───────────────────────────────────┘
                              │
              ┌───────────────┴───────────────┐
              │                               │
              ▼                               ▼
   ┌─────────────────────┐       ┌─────────────────────┐
   │  MySQL (Utama)      │       │  SQLite (Fallback)   │
   │  Pterodactyl DB     │       │  local.db            │
   │  (jika tersedia)    │       │  (selalu aktif)      │
   └─────────────────────┘       └─────────────────────┘
```

---

## Struktur Direktori

```
PIK-R-MANSEKU/
│
├── prisma/
│   ├── schema.prisma          # Skema Prisma untuk MySQL
│   └── sqlite.prisma          # Skema Prisma untuk SQLite
│
├── src/
│   ├── config/
│   │   ├── db.js              # Dynamic DB init (MySQL/SQLite fallback)
│   │   └── mail.js            # Nodemailer dengan config dinamis dari DB
│   │
│   ├── controllers/
│   │   ├── admin.js           # Login, CRUD kandidat, export, settings
│   │   ├── candidates.js      # Registrasi publik, cek status, login anggota
│   │   └── blog.js            # CRUD post & komentar
│   │
│   ├── middlewares/
│   │   └── auth.js            # JWT Auth middleware (Admin & Candidate)
│   │
│   ├── routes/
│   │   ├── admin.js           # /api/admin/*
│   │   ├── candidates.js      # /api/candidates/*
│   │   └── blog.js            # /api/blog/*
│   │
│   ├── services/
│   │   ├── whatsapp.js        # Baileys client + handler /cek
│   │   └── notification.js    # Logic pengiriman notifikasi massal & revisi
│   │
│   ├── utils/
│   │   └── similarity.js      # Algoritma Dice Coefficient + word matching
│   │
│   └── server.js              # Entrypoint: Express setup, DB init, seed admin
│
├── .baileys_auth/             # Session WhatsApp Web (di-gitignore)
├── local.db                   # SQLite database lokal (di-gitignore)
├── .env                       # Environment fallback (di-gitignore)
├── .gitignore
├── package.json
├── target.md
├── architecture.md
└── README.md
```

---

## Komponen Utama

### 1. Dynamic Database (`src/config/db.js`)
- Pada setiap startup, sistem mencoba membaca konfigurasi MySQL dari tabel `Setting` di SQLite.
- Jika konfigurasi ada dan MySQL berhasil dijangkau → pindah ke **MySQL** sebagai database aktif.
- Jika MySQL off atau belum dikonfigurasi → tetap pakai **SQLite** (`local.db`) sebagai fallback.
- Menggunakan **JavaScript `Proxy`** untuk membungkus instance Prisma secara dinamis tanpa perlu import ulang di setiap controller.
- Admin bisa mengubah konfigurasi MySQL di dashboard kapan saja, dan server akan langsung mencoba koneksi baru tanpa perlu restart.

### 2. WhatsApp Bot (`src/services/whatsapp.js`)
- Menggunakan `@whiskeysockets/baileys` untuk menghubungkan ke WhatsApp Web.
- QR Code untuk scan device dicetak langsung di terminal saat pertama kali dijalankan.
- Session tersimpan di folder `.baileys_auth/` sehingga tidak perlu scan ulang setiap restart.
- Handler pesan `/cek`:
  - **Input berupa angka** → Cari berdasarkan NISN (exact match).
  - **Input berupa teks** → Cari nama menggunakan algoritma kemiripan string (Dice Coefficient + Word Containment) di `src/utils/similarity.js`.
  - Mengembalikan link cek kelulusan: `https://pikr-manseku.my.id/cek-kelulusan?nisn={NISN}`

### 3. Autentikasi (`src/middlewares/auth.js`)
- **Admin**: Login via `POST /api/admin/login` → mendapatkan **JWT Token** berlaku 7 hari. Semua route `/api/admin/*` (kecuali `/login`) membutuhkan token ini di header `Authorization: Bearer {token}`.
- **Anggota/Kandidat**: Login via `POST /api/candidates/login` menggunakan NISN + Password. Mendapatkan JWT Token untuk mengakses route profilnya sendiri.

### 4. Notifikasi (`src/services/notification.js`)
- Dipanggil saat admin menekan tombol "Kirim" di dashboard.
- Mengambil semua kandidat dengan status `LULUS` atau `TIDAK LULUS`.
- **Pencocokan Revisi**: Jika `candidate.status !== candidate.lastStatus` dan sudah pernah dinotifikasi sebelumnya → kirim email & WA dengan label **REVISI**.
- Setelah pengiriman berhasil, field `emailNotified`, `waNotified`, dan `lastStatus` di database diperbarui.
- SMTP credentials dimuat secara dinamis dari database (`Setting.SMTP_CONFIG`) lewat `src/config/mail.js`.

### 5. Blog (`src/controllers/blog.js`)
- Post hanya bisa dibuat/diedit/dihapus oleh admin (JWT protected).
- Komentar bisa dibuat siapa saja tanpa login (hanya perlu mengisi nama/username).
- Admin bisa menghapus komentar yang tidak pantas.
- Fitur pagination, search, dan slug unik otomatis pada setiap post.

---

## Skema Database

### Model `Candidate`
| Field | Tipe | Keterangan |
|---|---|---|
| id | UUID | Primary key |
| nisn | String | Unik, digunakan sebagai ID login anggota |
| name | String | Nama lengkap |
| className | String | Kelas |
| whatsappNumber | String | Nomor WA untuk notifikasi |
| email | String | Email untuk notifikasi |
| gender | String | Jenis kelamin |
| reason | Text | Alasan bergabung |
| status | Enum | `PENDING` / `LULUS` / `TIDAK_LULUS` |
| password | String? | Hashed password (opsional, di-generate admin) |
| plainPassword | String? | Plaintext password (untuk export JSON oleh admin) |
| emailNotified | Boolean | Status kirim email |
| waNotified | Boolean | Status kirim WA |
| lastStatus | Enum | Status terakhir saat notifikasi dikirim (untuk deteksi revisi) |

### Model `Admin`
| Field | Tipe | Keterangan |
|---|---|---|
| id | UUID | Primary key |
| username | String | Unik |
| password | String | Hashed (bcrypt) |

### Model `Post`
| Field | Tipe | Keterangan |
|---|---|---|
| id | UUID | Primary key |
| title | String | Judul postingan |
| slug | String | Unik, URL-friendly |
| content | LongText | Isi postingan (markdown/HTML) |
| authorId | UUID | Foreign key ke Admin |

### Model `Comment`
| Field | Tipe | Keterangan |
|---|---|---|
| id | UUID | Primary key |
| postId | UUID | Foreign key ke Post |
| username | String | Nama pengunjung |
| content | Text | Isi komentar |

### Model `Setting`
| Field | Tipe | Keterangan |
|---|---|---|
| key | String | Primary key (e.g. `MYSQL_CONFIG`, `SMTP_CONFIG`) |
| value | Text | JSON string berisi konfigurasi |

---

## Port & CORS

| Service | Port |
|---|---|
| Backend API | `25552` |
| Frontend (rencana) | `25553` |

CORS dikonfigurasi untuk mengizinkan request dari `http://localhost:25553` dan `https://pikr-manseku.my.id`.
