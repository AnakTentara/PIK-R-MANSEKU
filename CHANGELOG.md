# Changelog — PIK-R MANSEKU

Seluruh rilis, pembaruan fitur, dan perbaikan bug pada platform PIK-R MANSEKU dicatat di dalam dokumen ini.

---

## [v2.7.0] — 2026-11-22

Rilis Aplikasi Android Mobile (Flutter Release APK), Pusat Unduhan `/downloads`, Sistem Siaran Notifikasi Massal & Web Push, Smooth Inertia Scroll (Lenis), Animasi Transisi ScrollReveal Publik, serta Penyempurnaan Tata Letak Responsif `/ruang-cerita`, `/kami`, dan `/admin/notifikasi`.

### 📱 Aplikasi Mobile Flutter & Pusat Unduhan (`pikr_app` & `/downloads`)
- **Package Name Resmi**: Diperbarui menjadi `org.pikrmanseku.app` (sebelumnya `id.my.manseku.pikr_app`).
- **Rilis APK Mandiri (`ruang-cerita.apk`)**: Dikompilasi menggunakan Flutter release mode (~19.2 MB) dan disajikan secara statis pada rute `https://pikr-manseku.my.id/downloads/ruang-cerita.apk` dengan MIME type resmi `application/vnd.android.package-archive` dan header auto-download (`Content-Disposition: attachment`).
- **Pusat Unduhan Resmi (`/downloads`)**: Halaman khusus unduhan aplikasi mobile dengan tata letak minimalis dan bersih (anti-AI slop), kartu unduhan Android APK, serta panduan pemasangan Web App di Safari iPhone/iOS.
- **Accordion Panduan Eksklusif**: Membuka panduan instalasi salah satu platform (Android atau iOS) otomatis menutup panduan platform lainnya secara mutual-exclusive.

### 🔔 Notifikasi Massal & Web Push (`/admin/notifikasi`, `/push/pertemuan`, `/push/:id`)
- **Panel Siaran Notifikasi Massal**: Pengiriman pesan Web Push interaktif real-time ke seluruh subscriber perangkat terdaftar dengan banner gambar, ikon resmi, dan 2 tombol tindakan kustom.
- **Integrasi Jadwal Pertemuan Rutin (`/push/pertemuan`)**: Halaman hitung mundur live jadwal pertemuan yang dapat langsung diimpor ke form siaran notifikasi massal dengan 1 klik.
- **Riwayat Siaran & Pengujian Mandiri**: Fitur uji coba notifikasi di perangkat lokal serta log riwayat pengiriman notifikasi dengan opsi hapus.
- **Perombakan UI Admin Notifikasi**: Tata letak responsif penuh di mobile, pemangkasan tombol raksasa (oversized buttons) menjadi ukuran proporsional, serta perbaikan clipping teks pada tautan statistik `/push/pertemuan`.

### 🌊 Pengalaman Pengguna (UX), Smooth Scroll & Animasi
- **Smooth "Slow Weight" Momentum Scroll (Lenis)**: Implementasi global momentum scrolling di seluruh halaman publik dengan inertia decay lembut (`duration: 1.35s`, `wheelMultiplier: 0.9`), memberikan sensasi pengguliran yang mewah dan berbobot tanpa konflik native scroll.
- **ScrollReveal Universal**: Efek transisi fade-in dan fade-out saat digulir diterapkan seragam di semua rute halaman publik: `/kami`, `/ruang-cerita`, `/daftar`, `/cek-kelulusan`, `/anggota`, `/alumni`, `/berita`, `/blog`, dan `/downloads`.
- **Penyempurnaan `/ruang-cerita`**:
  - Penghapusan tray cerita 24 jam untuk menjaga fokus platform.
  - Penataan ulang 4 kartu fitur: 3 kartu di baris atas dan kartu ke-4 (*"Terverifikasi & Khusus Siswa"*) melebar horizontal di baris bawah.
  - CTA showcase adaptif: menampilkan *"Buka Ruang Cerita Sekarang"* pada desktop dan tombol *"Unduh Ruang Cerita"* (smooth scroll ke `#download-app`) pada mobile.
  - QnA / FAQ Akordeon: Transisi buka-tutup tinggi *butter-smooth* menggunakan CSS Grid (`grid-template-rows: 0fr -> 1fr`, `min-height: 0`) dengan pratinjau 1 baris saat tertutup.
- **Tata Letak Dinamis Jajaran Pengurus (`/kami`)**: Menggunakan selector `:last-child:nth-child(odd)` sehingga ketika ada 3 pengurus inti (misal Ketua + 2 Wakil, atau 2 Sekretaris + 1 Bendahara), kartu ke-3 otomatis melebar horizontal penuh di baris bawah dengan avatar di kiri dan teks di kanan, tanpa celah kosong pada grid 2x2.

### 🤖 WhatsApp Bot — Game, Kuis & Leveling System
- **Sistem Leveling & XP**: Anggota mendapatkan poin aktivitas dan level interaktif di grup WhatsApp.
- **Kuis & Game Edukasi**: Mini-game kuis seputar kesehatan reproduksi remaja (GenRe), tebak kata, dan ranking klasemen (`/leaderboard`).
- **Dashboard Admin Pengaturan Bot**: Panel manajemen kebijakan bot dan leveling di `/admin/bot` dan `/admin/bot-leveling`.

---

## [v2.6.0] — 2026-11-09

Ruang Cerita 2.1: kamera, penyunting foto/video, suka cerita, dan bawaan akun baru.

### 🌟 Ruang Cerita (`src/rc/`)
- **Suka cerita**: `POST /api/rc/stories/:id/like { like }`. Disimpan di `RcStoryView.liked`; pemilik tidak bisa menyukai ceritanya sendiri. Notifikasi `STORY_LIKE` dikirim sekali per cerita (suka-batal-suka tidak menumpuk).
- **Insight pemilik**: `GET /api/rc/stories/:id/viewers` kini mengembalikan `viewCount`, `likeCount`, dan tanda `liked` per penonton (yang menyukai diurutkan di atas). Hanya pemilik.
- `GET /api/rc/users/:username/stories`: `liked` (milik penonton) dan `likeCount` (hanya pemilik).

### 🔧 Perubahan
- **Bawaan akun Ruang Cerita: publik + pesan dari semua anggota** (`RcProfile.isPrivate` = false, `dmPolicy` = EVERYONE), atas keputusan pengurus. Akun yang masih memakai bawaan lama (privat + FOLLOWING) diubah; permintaan ikuti yang tertunda diterima otomatis. Daftar akun yang diubah disimpan di `PIK-R-BACKUP/rc-privat-sebelum-2026-11-09.json`.
- Skema: `RcStoryView.liked Boolean @default(false)`; nilai bawaan `RcProfile` diganti (`db push` membangun ulang tabel, data tetap ada; cadangan diambil sebelumnya).

---

## [v2.5.0] — 2026-11-08

Ruang Cerita dibangun ulang dari nol sebagai media sosial anggota PIK-R yang aman untuk remaja, dengan API sendiri (`/api/rc`), Pesan terenkripsi, dan Bilik Konseling yang sungguhan.

### 🚨 Perbaikan darurat
- **Form curhat palsu dimatikan.** Versi Ruang Cerita sebelumnya menampilkan "curhat terkirim, konselor akan membalas" padahal pesan tidak terkirim ke mana pun, serta memuat postingan & akun karangan (foto stok, angka suka palsu). Diganti halaman sementara berisi nomor layanan resmi, lalu versi baru di bawah.
- **Moderasi tidak lagi merusak data anggota.** "Nonaktifkan akun" (mengubah status anggota menjadi `INACTIVE` sehingga hilang dari absensi & ID Card) diganti **"Bekukan akun sosial"** 1–30 hari lewat `RcProfile.frozenUntil`; status anggota, absensi, dan ID Card tidak disentuh.

### 🌟 API Ruang Cerita (`src/rc/`, 24 tabel `Rc*` baru)
- **Akun remaja:** privat secara bawaan (pengikut harus disetujui), permintaan mengikuti, hapus pengikut, Teman Dekat, Bisukan, **Batasi** (komentarnya hanya terlihat olehnya, pesannya masuk Permintaan), Blokir dua arah, kata tersembunyi + daftar kata kasar bawaan, mode tenang, status aktivitas yang bisa dimatikan.
- **Postingan:** carousel 1–10 foto/video, foto diperkecil ke WebP dan **metadata lokasi GPS dibuang**, tandai teman, @sebutan & #tagar, audiens Teman Dekat, sembunyikan jumlah suka, matikan komentar, sematkan (maks. 3), edit keterangan, simpan.
- **Komentar:** berutas satu tingkat, suka komentar, sematkan, pemilik postingan boleh menghapus, anti-XSS (teks polos, maks. 1000 karakter).
- **Cerita 24 jam:** foto/video/teks, Teman Dekat, stiker polling & pertanyaan, reaksi emoji, balas cerita (masuk Pesan), daftar penonton, arsip, **Sorotan**.
- **Pesan (DM):** 1-on-1 & grup, kotak Permintaan, balas, reaksi, edit 15 menit, tarik pesan, **foto sekali lihat**, sedang mengetik, tanda dibaca, Notes 24 jam, bagikan postingan.
  - **Isi pesan dienkripsi saat disimpan** (AES-256-GCM, kunci `RC_MESSAGE_KEY` di `.env`, tidak ikut cadangan ZIP). Foto pesan disimpan terenkripsi di `private/rc-dm/` (di luar folder publik) dan hanya bisa diambil anggota percakapan lewat API.
- **Bilik Konseling:** sesi dengan topik, **anonim untuk konselor** (nama samaran), antrean, konselor bertugas per hari, deteksi kata darurat → tanda MENDESAK + nomor SEJIWA 119 ext. 8 / SAPA 129 / 112, "minta pendampingan pembina", penilaian sesi, isi dienkripsi.
- **Realtime (SSE)** untuk pesan, notifikasi, dan antrean konseling; notifikasi aktivitas; lapor postingan/cerita/komentar/pesan/akun.
- **Batas laju** 40 aksi/menit dan 60 unggahan/jam per anggota; semua respons `X-Robots-Tag: noindex`.
- Dashboard **Laporan** menampilkan konten Ruang Cerita (pesan pribadi: hanya pesan yang dilaporkan, bukan seluruh percakapan).

### 🔧 Perubahan
- Dependensi baru: `sharp` (pengolahan gambar).
- `.gitignore`: folder `private/` (foto pesan terenkripsi).

### ✅ Diuji
- 34 uji keamanan & privasi (token palsu/kedaluwarsa, pendaftar ditolak, akun privat terkunci termasuk akses langsung lewat id, isolasi Pesan & Konseling, kepemilikan konten, XSS, batas laju) dan 17 uji antarmuka di HP & desktop: semua lulus.

### ⚠️ Belum
- End-to-end encryption untuk Pesan (rencana bersama aplikasi Flutter: butuh kunci per perangkat).
- Sandi bawaan akun developer dashboard & akun bersama absen **masih aktif** dan tertulis di repo publik. Segera ganti.

---

## [v2.4.0] — 2026-11-08

Rilis sosial & arsitektur performa: profil bergaya media sosial (Follow, Teman Dekat, Blokir, Lapor), login alumni, code splitting dengan SkeletonLoading, crawler preview WhatsApp, dan pengerasan keamanan SQLite & Upload.

### 🌟 Fitur Baru
- **Ruang Cerita 24 Jam (Stories Tray)**: Bar tray stories horizontal bergaya Instagram di halaman `/blog`. Anggota dapat membagikan cerita foto atau teks warna gradien yang aktif selama 24 jam dengan penghitung tayangan.
- **Story Viewer Modal**: Penampil cerita layar penuh dengan progress bar otomatis (5 detik/slide), pause saat ditahan (hold to pause), navigasi sentuh kanan/kiri, pintasan keyboard, dan tombol hapus untuk pemilik.
- **Feed "Untuk Anda" vs "Mengikuti"**: Tab filter dinamis pada forum blog untuk menampilkan postingan komunitas umum atau khusus dari sahabat-sahabat yang diikuti.
- **Interaksi Suka Instan (Heart Bounce Animation)**: Tombol suka langsung dari daftar feed dengan feedback optimistik dan animasi membal (@keyframes heartBounce).
- **Tautan Profil Kreator**: Klik nama atau foto penulis di feed langsung mengarahkan ke profil sosial lengkap `/@slug`.
- **Panel Moderasi Laporan (`/admin/moderasi`)**: Dashboard admin untuk meninjau laporan pengguna terhadap akun, postingan blog, atau komentar diskusi, dilengkapi tindakan sembunyikan konten atau suspend akun.
- **Profil Anggota Sosial (`/@slug`)**: Tata letak ala Instagram (foto, bio, jumlah postingan/pengikut/mengikuti, tombol Ikuti/Mengikuti, dropdown aksi hubungan pribadi, dan tab grid postingan blog).
- **Relasi & Privasi Anggota**: Model Prisma `Follow`, `MemberRelation` (Teman Dekat, Bisukan, Blokir), dan `Report` (Laporan konten/akun). Blokir bersifat dua arah dan menyembunyikan postingan/profil dari pihak yang diblokir.
- **Login Alumni**: Anggota berstatus `ALUMNI` tidak lagi diblokir 403; kini dapat login untuk melihat profil, mengedit info, dan menulis artikel dengan banner status "Anda telah menjadi alumni".
- **Quick Login**: Modal popup masuk instan saat pengunjung umum mencoba berinteraksi (like, follow, komentar, lapor) tanpa harus meninggalkan halaman yang sedang dilihat.
- **Kebijakan Bot WhatsApp (`wa_policy`)**: Pengaturan mode grup (`all`, `listed`, `off`), allowlist nomor telepon berizin untuk perintah `/rekap`, dan anti-spam rate limiting (12 cmd/menit di grup, 5 cmd/menit per orang).
- **Skeleton Shimmer Loading**: Komponen `PageSkeleton` dan `AdminPageSkeleton` dengan efek shimmer yang halus saat membuka atau berpindah rute halaman.
- **OpenGraph WhatsApp Preview**: `scripts/serve-static.mjs` menginjeksikan metadata OpenGraph dinamis saat perayap (WhatsApp, Facebook, Twitter, Telegram, Discord) meminta link `/@slug`, sehingga kartu share menampilkan foto, nama, dan jabatan siswa.

### ⚡ Peningkatan & Performa
- **Code Splitting (`React.lazy` & `Suspense`)**: Seluruh 15 rute dashboard admin dan halaman editor TipTap dipisahkan ke chunk dinamis. Ukuran muatan JavaScript awal **turun 88%** (dari 528 KB menjadi 63 KB), CSS **turun 83%** (dari 303 KB menjadi 51 KB).
- **SQLite WAL Mode**: Mengaktifkan `PRAGMA journal_mode = WAL;`, `busy_timeout = 5000;`, dan `synchronous = NORMAL;` di `src/config/db.js` untuk konkurensi tinggi tanpa lock-up antara absensi, bot WA, dan backup.
- **In-Memory Cache Pengaturan Publik**: Cache 60 detik di backend untuk `GET /api/candidates/settings/public` guna meredam lonjakan trafik pendaftaran.
- **Header Navbar Centering & UX Mobile**: Posisikan menu navigasi desktop tepat di tengah header, dan tambahkan penguncian scroll layar (`overflow: hidden`) saat drawer mobile dibuka.
- **Optimasi Baterai Slider Beranda**: Slider banner kegiatan otomatis menjeda putaran saat tab browser disembunyikan.

### 🔒 Keamanan & Sanitasi
- **Pembersihan XSS Konten Blog**: Integrasi `sanitize-html` (`cleanBlogHtml` dan `plainText`) menyaring seluruh tag `<script>`, iframe tidak sah, dan event handler berbahaya.
- **Sanitasi Kredensial Pengguna**: Fungsi `safeProfile()` memastikan hash sandi, plainPassword, dan metadata kartu internal tidak bocor ke browser atau localStorage.
- **Pengerasan Upload File (`multerConfig.js`)**: Whitelist ketat ekstensi gambar (`.jpg`, `.jpeg`, `.png`, `.webp`, `.gif`) dan dokumen (`.pdf`, `.doc`, `.docx`) untuk mencegah unggahan berkas eksekusi.
- **Perlindungan Data Pribadi Siswa**: File Excel pendaftaran & presensi di-untrack dari Git dan ditambahkan ke `.gitignore`. File arsip besar (`.rar`, `.7z`) diabaikan otomatis.

---

## [v2.3.0] — 2026-11-06

Bot WhatsApp diatur dari dashboard dan membalas dengan kartu/tabel bergambar; semua popup dashboard punya bar tombol yang selalu terlihat.

### 🌟 Fitur Baru
- **Pengaturan → Atur Bot WhatsApp** (`/admin/settings/bot`, Developer): tombol nyala/mati, hubungkan lewat **QR** atau **kode pairing** (nomor telepon), putuskan tautan, mulai ulang, **profil bot** (foto, nama, info, nomor, tanda terverifikasi), **uji kirim**, dan **terminal debug** dengan log langsung (SSE), saring, jeda, salin.
- **Bot membalas dengan kartu dan tabel bergambar** (`src/services/waCards.js`, SVG → PNG lewat `@resvg/resvg-js`, font Inter/Outfit di `assets/fonts/`). Teks tetap dikirim sebagai caption supaya bisa disalin.
  - `/menu` kartu daftar perintah, `/cek` kartu hasil seleksi (atau tabel bila beberapa nama cocok), `/sandi ganti` kartu OTP.
  - Baru: `/absen` kartu kehadiran pribadi 90 hari (japri), `/rekap` tabel kehadiran hari ini (hanya pengurus inti yang nomornya terdaftar).
- **API bot** `/api/admin/wa/*`: `status`, `start` (opsional `pairingPhone`), `stop`, `restart`, `logout`, `profile`, `photo`, `test`, `stream` (SSE).

### 🔧 Perubahan
- **Bot WhatsApp ditulis ulang** di atas Baileys resmi (`@whiskeysockets/baileys` 7.0.0-rc14). Pesan tombol/list/carousel tidak dipakai: lewat WhatsApp Web pesan itu sering tidak tampil di HP penerima, dan fork yang memaksakannya (mis. `ourin-baileys`) sudah ditandai malware (GHSA-5qgv-v3j9-f64g). Tidak ada sisa `ourin` di proyek ini.
- Nyala/mati bot disimpan di Setting `wa_enabled` (bawaan **mati**). `DISABLE_WHATSAPP=1` di `.env` kini mengunci bot mati (komputer uji). `ecosystem.config.cjs` tidak lagi mengatur bot.
- Bot lebih aman dari tanda spam: satu antrean kirim dengan jeda acak 1,2–2 detik, status "sedang mengetik", tidak online otomatis, tidak menyinkronkan riwayat, tampil sebagai "Chrome (Windows)" di Perangkat Tertaut.
- Sesi dipakai di server lain (`connectionReplaced`) kini menghentikan bot dengan pesan jelas, bukan saling memutus terus-menerus. Logout dari HP menghapus sesi dan menunggu ditautkan ulang dari dashboard.
- **Semua popup dashboard**: isi menggulir, tombol (Simpan/Batal/dll.) di **bar bawah yang selalu terlihat**. Kelas global `.modal-shell`, `.modal-scroll`, `.modal-bar` di `main.css`; dipasang di Absensi, Anggota, File Manager, Struktur, Pendaftaran, Testimoni, Pengguna, Hierarki Jabatan, Impor Excel, Ganti Pejabat, Potong Foto, Infografis, dan konfirmasi global.
- `buildRecap` di `controllers/absen.js` diekspor (dipakai bot).
- Dependensi: `+qrcode`, `+@resvg/resvg-js`, `-qrcode-terminal`.

### 🐛 Perbaikan
- Popup **Tambah/Edit Akun Admin** (halaman Pengguna) langsung error karena ikon `Key` belum diimpor.

## [v2.2.0] — 2026-11-05

Siap produksi di satu komputer, mudah dipindah server, dan Mode Cepat untuk absensi.

### 🌟 Fitur Baru
- **Absensi — Mode Cepat:** `POST /api/absen/scan` menerima `quick: true`. Scan langsung dicatat masuk atau keluar tanpa popup. Scan kedua dalam 1 menit dibaca "dobel" (bukan keluar), anggota yang sudah masuk dan keluar dijawab `DONE` tanpa mengubah data, dan dua scan bersamaan tidak membuat baris dobel.
- **Absensi — semua status bisa dikosongkan:** `DELETE /api/absen/records/:id` kini boleh dilakukan petugas web absen (bukan hanya admin), sehingga masuk, keluar, izin, sakit, dan alfa bisa dikembalikan ke "belum diisi". Pengosongan dicatat di log server.
- **Mode produksi:** `ecosystem.config.cjs` (backend, situs utama, web absen, cadangan harian), `scripts/serve-static.mjs` (server statis dengan kompresi, cache, rute SPA, proxy API), `scripts/backup.mjs` (ZIP harian pukul 03:00, simpan 14 terbaru).
- **Pindah server dari `.env`:** `src/config/site.js` menurunkan semua alamat (link QR, email, WhatsApp, sitemap, robots, CORS) dari `PUBLIC_SITE_URL`. Ada `.env.example`.

### 🔧 Perubahan
- `JWT_SECRET` wajib acak di produksi. Server menolak berjalan dengan nilai bawaan lama (`src/config/secret.js`).
- Kata sandi admin bawaan tidak lagi dicetak ke log.
- Logika cadangan dipindah ke `src/utils/backup.js` (dipakai tombol dashboard dan skrip harian).
- Bot WhatsApp mati secara bawaan di `ecosystem.config.cjs`; aktifkan hanya di satu server dengan `WHATSAPP=1`.

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
