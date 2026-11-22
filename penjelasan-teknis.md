# 📖 Penjelasan Teknis Lengkap Arsitektur & Fitur PIK-R MANSEKU

Dokumen ini menyajikan dokumentasi arsitektur sistem, alur konektivitas backend ke berbagai frontend, serta spesifikasi detail seluruh fitur platform **PIK-R MANSEKU** yang dirancang modular untuk kesiapan **SaaS (Software-as-a-Service)** multi-sekolah.

---

## 🏛️ 1. Arsitektur Ekosistem & Multi-Frontend Connectivity

Platform ini mengadopsi pola arsitektur **Single Central Backend Engine** yang melayani **4 Antarmuka Pengguna (Multi-Frontend)** independen melalui protokol RESTful API, Server-Sent Events (SSE), dan Web Push Protocol:

```
                          ┌────────────────────────────────────────────────────────┐
                          │            CENTRAL BACKEND ENGINE                      │
                          │   Node.js + Express + Prisma ORM (SQLite/MySQL)        │
                          │   Port: 25552 | Web Push (VAPID) | WA Bot (Baileys)    │
                          └───────────────────────────┬────────────────────────────┘
                                                      │
         ┌────────────────────────┬───────────────────┴───────────────┬────────────────────────┐
         │                        │                                   │                        │
         ▼                        ▼                                   ▼                        ▼
┌──────────────────┐    ┌──────────────────┐                ┌──────────────────┐    ┌──────────────────────┐
│  FRONTEND 1      │    │  FRONTEND 2      │                │  FRONTEND 3      │    │  FRONTEND 4          │
│  Portal Publik & │    │  Absensi Online  │                │  Ruang Cerita    │    │  Mobile Native App   │
│  Admin Dashboard │    │  Presensi QR/Bar │                │  Web App Sosial  │    │  (Flutter Android/iOS│
│  Port: 25551     │    │  Port: 25554     │                │  Port: 25555     │    │  org.pikrmanseku.app │
└──────────────────┘    └──────────────────┘                └──────────────────┘    └──────────────────────┘
```

### Konektivitas 4 Frontend:

1. **Frontend 1 — Portal Utama & Dashboard Admin (`pikr-manseku.my.id`)**:
   - **Teknologi**: React 18, Vite, React Router DOM v6, Lenis Momentum Scrolling, CSS Modules.
   - **Fungsi**: Portal profil organisasi (`/kami`), informasi anggota (`/anggota`), pendaftaran calon anggota (`/daftar`), cek kelulusan (`/cek-kelulusan`), blog komunitas (`/blog`), pusat unduhan (`/downloads`), dan seluruh modul administrasi terproteksi (`/admin/*`).
   - **Koneksi Backend**: Berkomunikasi melalui `http://127.0.0.1:25552/api/*` dengan Bearer JWT token terotentikasi.

2. **Frontend 2 — Absensi Online & Terminal ID Card (`absen.pikr-manseku.my.id`)**:
   - **Teknologi**: React SPA mandiri, HTML5 Camera Scanner API, Web Audio API (suara bip verifikasi).
   - **Fungsi**: Terminal cepat pemindaian barcode ID Card anggota saat pertemuan rutin, rekapitulasi kehadiran per kelas, dan ekspor matriks absensi bulanan.
   - **Koneksi Backend**: Mengonsumsi endpoint `/api/absen/*` pada backend utama. Data tersinkronisasi instan ke database induk.

3. **Frontend 3 — Ruang Cerita Web App (`ruang-cerita.pikr-manseku.my.id`)**:
   - **Teknologi**: Progressive Web App (PWA), React, Tailwind/CSS Modules, Lucide Icons.
   - **Fungsi**: Media sosial ramah remaja siswa MAN 1 Muara Enim, feed visual foto/video, 24-hour stories, direct messages (DM) terenkripsi, dan antrean Bilik Konseling Sebaya.
   - **Koneksi Backend**: Mengonsumsi modul khusus `/api/rc/*` dan Server-Sent Events (`/api/rc/realtime/stream`) untuk pembaruan realtime status mengetik, notifikasi, dan antrean konseling.

4. **Frontend 4 — Mobile Native Application (`pikr_app`)**:
   - **Teknologi**: Flutter (Dart 3.6), Riverpod State Management, GoRouter, Dio HTTP Client, Flutter Secure Storage, InAppWebView.
   - **Platform**: Android (`org.pikrmanseku.app`) dan iOS.
   - **Fungsi**: Pengalaman aplikasi native di ponsel siswa dengan performa tinggi, akses offline cache, integrasi kamera foto/video native, dan penerimaan push notifikasi.
   - **Koneksi Backend**: Interceptor Dio otomatis menyisipkan JWT token dari hardware secure storage dan menangani refresh token.

---

## 📂 2. Rincian Teknis Backend Berdasarkan Modul & Fitur

---

### MODUL 1: Manajemen Akun Terpadu & Multi-Role RBAC

Backend menyediakan skema identitas tunggal terintegrasi (*Single Source of Truth*) untuk seluruh siswa, pembina, dan staf:

* **Tipe Entitas Akun**:
  * **Anggota (Member)**: Wajib memiliki NISN unik (10 digit), nama lengkap, kelas, tahun masuk/angkatan, dan nomor WhatsApp terdaftar.
  * **Pembina / Guru**: Akun istimewa yang **tidak membutuhkan NISN**. Memiliki tanda pengenal khusus dan hak asesori untuk mendampingi konseling.
  * **Admin / Developer**: Pengelola teknis sistem dengan kredensial terpisah.
* **Tingkatan Peran (Role Hierarchy)**:
  1. `DEVELOPER`: Hak akses total ke konfigurasi server, database, bot WhatsApp, dan page builder.
  2. `ADMIN` / `KABINET_UMUM`: Mengelola pendaftar, data anggota, presensi, notifikasi massal, dan struktur organisasi.
  3. `MEDINFO`: Mengelola jurnalisme berita, blog forum, dan desain visual situs.
  4. `PEMBINA`: Akses pendampingan kasus konseling gawat darurat dan monitoring rekapitulasi.
  5. `MEMBER`: Mengakses profil pribadi, kartu anggota digital, feed sosial, dan forum diskusi.
  6. `ALUMNI`: Anggota yang telah lulus sekolah. Mempertahankan akses arsip dan profil tanpa hak akses operasional aktif.
* **Fitur Freeze Akun Sosial (Anti-Destructive Moderation)**:
  * Backend membedakan antara *Status Keanggotaan Sekolah* dan *Status Sosial Ruang Cerita*.
  * Ketika seorang siswa melanggar aturan di Ruang Cerita, admin **tidak menghapus akun** melainkan mengaktifkan `RcProfile.frozenUntil` (1–30 hari). Siswa tetap berstatus aktif di absensi dan kartu pelajar, namun akses sosialnya dibekukan sementara.

---

### MODUL 2: Web Dashboard Struktur Organisasi Dinamis (`/admin/org` & `/kami`)

Modul ini mengelola bagan organisasi resmi tanpa duplikasi input data:

* **Struktur Hirarki 5 Level**:
  * **Level 1**: Pembina (Kepala Sekolah & Guru Pembina).
  * **Level 2**: Pimpinan Umum (Ketua Umum & Wakil Ketua Umum).
  * **Level 3**: Pengurus Harian Inti (Sekretaris Umum & Bendahara Umum).
  * **Level 4**: Ketua Divisi / Koordinator Bidang (misal: Divisi Konseling, Medinfo, Advokasi).
  * **Level 5**: Anggota Staf Divisi.
* **Mekanisme Penambahan Pengurus Cerdas**:
  * **Pilih dari Akun yang Sudah Ada**: Admin cukup memilih nama/NISN siswa dari dropdown akun terdaftar. Sistem otomatis mengisi foto profil, NISN, dan detail kontak tanpa perlu upload berulang.
  * **Buat Profil Baru Manual**: Jika pengurus belum memiliki akun siswa (misalnya guru pembina baru atau tamu kehormatan), admin dapat membuat profil langsung dari form modal.
* **Pengeditan Fleksibel & Drag-and-Drop**:
  * Posisi, urutan hierarki, nama jabatan kustom, dan tupoksi (deskripsi tugas) dapat diubah sewaktu-waktu.
  * Setiap perubahan langsung tersinkronisasi secara waktu nyata ke halaman publik `/kami`, bagan pohon organisasi dinamis `/anggota`, dan ID Card digital siswa.
* **Layout Responsif Dinamis (Aturan Ganjil / 3 Card)**:
  * Pada halaman `/kami`, terdapat algoritma CSS grid dinamis `:last-child:nth-child(odd)`.
  * Jika terdapat 3 pengurus inti (misalnya: 1 Ketua + 2 Wakil, atau 2 Sekretaris + 1 Bendahara), card ke-3 tidak meninggalkan ruang kosong pada grid 2×2, melainkan otomatis membentang horizontal penuh di baris bawah dengan avatar di kiri dan detail di kanan.

---

### MODUL 3: Sistem Pendaftaran & Pengumuman Seleksi (SNBP-Style)

* **Validasi Pendaftaran Mandiri**:
  * Memvalidasi keaslian format NISN dan mencegah pendaftaran ganda (*duplicate registration guard*).
  * Upload foto formulir dan berkas pendukung langsung diproses dengan kompresi WebP otomatis.
* **Tahapan Seleksi Real-time**:
  * Status pendaftar: `PENDING` ➔ `LOLOS_BERKAS` ➔ `LULUS` / `TIDAK_LULUS`.
* **Ekspor & Impor Spreadsheet (xlsx)**:
  * Admin dapat mengunduh seluruh data pendaftar ke file Excel format rapi untuk rapat dewan guru, melakukan penilaian offline, lalu mengunggah kembali file Excel tersebut dengan fitur pratinjau per baris sebelum data ditimpa.
* **Pengumuman Kelulusan SNBP-Style (`/cek-kelulusan`)**:
  * Siswa memasukkan NISN untuk melihat surat keputusan digital.
  * Dilengkapi efek animasi kartu status (Hijau = LULUS dengan konfeti selebrasi, Merah = TIDAK LULUS dengan pesan motivasi edukatif).

---

### MODUL 4: Sistem Otomatisasi Alumni & Siklus Angkatan

* **Perhitungan Masa Aktif Berbasis Jenjang**:
  * Siswa mendaftar di **Kelas 10**: Masa aktif keanggotaan 3 tahun.
  * Siswa mendaftar di **Kelas 11**: Masa aktif keanggotaan 2 tahun.
  * Siswa mendaftar di **Kelas 12**: Masa aktif keanggotaan 1 tahun.
* **Transisi Status Otomatis**:
  * Cron job / script batch memeriksa masa aktif anggota pada pergantian tahun ajaran sekolah.
  * Siswa yang masa aktifnya habis otomatis dipindahkan ke status `ALUMNI`.
* **Portal Khusus Alumni (`/alumni`)**:
  * Direktori direktori lulusan PIK-R lintas generasi.
  * Alumni tetap dapat masuk (login) ke platform dengan banner informasi status alumni, mempertahankan hak akses untuk membaca materi, menulis artikel di blog, dan melihat rekam jejak sertifikat digital mereka.

---

### MODUL 5: WhatsApp Gateway Engine (Baileys API)

Backend memiliki integrasi mandiri ke jaringan WhatsApp tanpa ketergantungan API berbayar pihak ketiga:

* **Sesi Multi-Device Headless**:
  * Autentikasi QR pairing tersimpan aman di `.baileys_auth/` dengan mekanisme auto-reconnect cerdas saat jaringan terputus.
* **Layanan Otomasi Administrasi Siswa**:
  * `/cek [Nama/NISN]`: Pengecekan instan status kelulusan seleksi langsung via pesan chat WA.
  * `/sandi`: Mengecek NISN & kata sandi akun bagi nomor yang telah terdaftar resmi.
  * `/sandi ganti`: Mengirimkan kode OTP 6-digit dengan batas kedaluwarsa 5 menit untuk reset password mandiri di website `/reset-sandi`.
* **Sistem Interaktif Komunitas (Game & Leveling)**:
  * **Sistem XP & Level**: Anggota yang aktif berdiskusi di grup resmi mendapatkan poin pengalaman (XP) yang menaikkan level keanggotaan.
  * **Leaderboard (`/leaderboard`)**: Klasemen peringkat 10 besar siswa teraktif.
  * **Kuis Edukasi Reproduksi Remaja (GenRe)**: Bot mengajukan pertanyaan seputar kesehatan reproduksi remaja, stunting, bahaya narkoba, dan pernikahan dini dengan validasi jawaban otomatis.
* **Keamanan & Rate Limiter Anti-Spam**:
  * Pembatasan kuota: 12 perintah/menit di grup dan 5 perintah/menit untuk obrolan pribadi per nomor telepon.

---

### MODUL 6: Notifikasi Massal & Web Push Engine (`/admin/notifikasi`)

Sistem pengumuman sekolah langsung ke layar perangkat pengguna menggunakan standar resmi W3C Web Push:

* **Spesifikasi Protokol**:
  * Menggunakan enkripsi VAPID (Voluntary Application Server Identification) sesuai RFC-8291 dan RFC-8292.
  * Browser dan aplikasi mobile mendaftarkan `PushSubscription` token ke backend (`/api/push/subscribe`).
* **Fitur Penyiaran Admin**:
  * Judul, isi pesan panjang, pemilihan ikon resmi (PIK-R, MAN, Kemenag), banner gambar utama (Rich Media Push), dan target URL saat notifikasi diketuk.
  * Mendukung 2 tombol tindakan interaktif langsung dari bilah notifikasi ponsel (misal: "Buka Materi" & "Daftar Hadir").
* **Modul Jadwal Pertemuan Rutin (`/push/pertemuan`)**:
  * Menampilkan hitung mundur waktu (countdown timer) pertemuan rutin berikutnya, informasi dresscode seragam, agenda rapat, dan kontak narahubung.
  * Tombol 1-klik di admin untuk mentransfer rincian jadwal pertemuan langsung menjadi pesan siaran massal.

---

### MODUL 7: Ruang Cerita 2.5 (Media Sosial Ramah Remaja & Konseling)

Sub-ekosistem media sosial dan kesehatan mental siswa (`src/rc/`):

* **Keamanan & Privasi Remaja**:
  * Akun privat/publik, persetujuan pengikut, daftar Teman Dekat (*Close Friends*), batasi akun, dan pemblokiran dua arah.
  * **Sanitasi Metadata Otomatis**: Setiap gambar yang diunggah ke server otomatis diproses oleh `sharp` untuk membuang metadata sensitif (termasuk koordinat GPS lokasi rumah/sekolah siswa) dan dikonversi ke format efisien WebP.
* **Enkripsi Pesan Pribadi (DM)**:
  * Isi percakapan disimpan dalam keadaan terenkripsi (*Encrypted at Rest*) di database menggunakan algoritma **AES-256-GCM**.
  * File foto percakapan pribadi disimpan di folder terisolasi (`private/rc-dm/`) dan tidak dapat diakses publik melalui URL langsung tanpa otorisasi token sesi anggota bersangkutan.
* **Bilik Konseling Sebaya Terintegrasi**:
  * **Identitas Samaran (Pseudonym Anonymous)**: Siswa yang curhat dapat memilih mode anonim sehingga konselor sebaya tidak mengetahui identitas aslinya untuk menjaga kenyamanan psikologis.
  * **Detektor Kata Kunci Krisis Darurat**: Sistem mendeteksi otomatis kata-kata indikasi bahaya fisik/mental dan memunculkan banner peringatan darurat beserta kontak hotline resmi Kementerian PPPA (SAPA 129) dan SEJIWA (119 ext 8).
  * **Eskalasi Pembina**: Konselor sebaya dapat meminta pendampingan guru BK / Pembina jika topik permasalahan membutuhkan intervensi profesional.

---

### MODUL 8: Absensi Online & ID Card Digital

* **Spesifikasi Barcode ID Card**:
  * **Sisi Depan**: Barcode batang presisi tinggi berstandar **Code128** (`PIKR_0001-26`) yang dapat dipindai oleh scanner barcode USB fisik mini-market maupun kamera HP.
  * **Sisi Belakang**: QR Code vektor yang memuat tautan langsung ke biodata publik siswa `/@slug`.
* **Terminal Presensi Web (`absen.pikr-manseku.my.id`)**:
  * Mendukung mode pemindaian multi-kamera (kamera belakang/depan ponsel) dengan deteksi instan kurang dari 0.3 detik.
  * Konfirmasi audio bip status (Sukses, Sudah Hadir Sebelumnya, Tidak Ditemukan).
* **Ekspor Matriks Kehadiran**:
  * Unduh rekapitulasi presensi otomatis berformat Excel (.xlsx) per kelas, semester, atau rentang tanggal kegiatan.

---

### MODUL 9: Performa, UI/UX, & Optimasi Frontend

* **Momentum Scrolling Mewah (Lenis)**:
  * Pengalaman scrolling terpadu dengan bobot inersia lembut (`duration: 1.35s`, `wheelMultiplier: 0.9`), memberikan kenyamanan navigasi di desktop dan tablet.
* **Komponen ScrollReveal Universal**:
  * Animasi transisi fade-in dan fade-out otomatis saat elemen digulir ke dalam dan keluar viewport layar pada semua halaman publik.
* **Code Splitting Dinamis**:
  * Menggunakan `React.lazy` dan `Suspense` untuk memecah rute admin yang berat ke dalam chunk terpisah, memangkas ukuran JavaScript awal hingga **88%** (hanya memuat 63 KB saat pertama dibuka).
* **Database Concurrency Tinggi (SQLite WAL Mode)**:
  * Backend mengaktifkan `PRAGMA journal_mode = WAL;`, `busy_timeout = 5000;`, dan `synchronous = NORMAL;` sehingga absensi, bot WhatsApp, pencatatan log, dan browsing publik dapat berjalan serentak tanpa kendala *database lock*.

---

## 🚀 3. Kesiapan Menuju SaaS Multi-Sekolah

Seluruh rancangan backend dan frontend telah dipisahkan berdasarkan domain fungsional:
* Konfigurasi instansi (nama sekolah, logo, pembina, periode tahun ajaran) disimpan dinamis di database.
* Modul dapat diaktifkan atau dinonaktifkan sesuai kebutuhan sekolah (modular toggles).
* Arsitektur siap diadaptasi ke multi-tenant routing untuk implementasi SaaS lintas instansi pendidikan.

---
*Dokumentasi Teknis Resmi PIK-R MANSEKU — Versi 2.7.0*
