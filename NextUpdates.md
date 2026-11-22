# 🚀 Rencana Pembaruan Mendatang (Next Updates Roadmap)

Dokumen ini memuat roadmap pengembangan fitur, integrasi sistem, dan persiapan arsitektur **SaaS (Software-as-a-Service)** multi-sekolah untuk platform PIK-R MANSEKU.

---

## 🎯 Fokus Utama Rilis Mendatang

### 1. 🪪 Generator QR Code & ID Card Terintegrasi (Absensi & Dashboard)
- **Integrasi Langsung Dashboard Admin**: Mengintegrasikan modul pembuat kartu identitas digital (ID Card Generator) langsung ke panel navigasi Admin dan modul Absensi (`absen.pikr-manseku.my.id`).
- **Generator QR Code Dinamis**:
  - Pembuatan QR Code instan beresolusi tinggi (vektor SVG & PNG) yang mengarah langsung ke profil publik anggota `/@slug`.
  - Barcode batang presisi (Code128) di sisi depan untuk pemindaian scanner barcode fisik dan presensi kilat.
- **Batch Export Cetak (PDF / Canvas High-DPI)**: Fitur unduh massal ID Card siap cetak ukuran standar ATM / kartu pelajar (85.60 × 53.98 mm) per angkatan atau per divisi dalam 1 klik.
- **Kustomisasi Desain Kartu**: Pilihan tema warna, stempel organisasi, tanda tangan pembina otomatis, dan pengaturan visibilitas nomor induk / kontak.

---

### 2. 🧩 Sistem Pendaftaran Calon Anggota sebagai Add-on Modular (Pluggable)
- **Pemisahan Modul Pendaftaran**: Mengubah sistem pendaftaran calon anggota yang saat ini terpasang di core portal menjadi sistem **Add-on / Plugin Terpisah**.
- **Form Builder Kustom per Sekolah**:
  - Setiap sekolah / instansi dapat mendefinisikan field pendaftaran khusus (misalnya: Jalur Prestasi, Minat Bakat, Riwayat Penyakit, Pernyataan Orang Tua).
  - Tipe field fleksibel: Text, Select, Upload Dokumen / Foto, Radio Button, dan Checklist Syarat.
- **Jalur Seleksi Dinamis**: Mendukung konfigurasi bertahap (Seleksi Berkas ➔ Wawancara ➔ Pengumuman Kelulusan SNBP-style).
- **Pengaturan Kuota & Periode Otomatis**: Penjadwalan pembukaan dan penutupan pendaftaran berbasis waktu server, pembatasan kuota per kelas/jenjang, dan notifikasi kelulusan otomatis via WhatsApp Bot.

---

### 3. 🎨 Penambahan Logo & Aset Visual pada Ruang Cerita Flutter App [SELESAI DITERAPKAN]
- **Launcher Icon & Splash Resmi**:
  - Ikon aplikasi resmi PIK-R beresolusi tinggi (mdpi, hdpi, xhdpi, xxhdpi, xxxhdpi) dan round icon telah diintegrasikan.
  - Splash screen dengan logo terpusat (`launch_background.xml`).
- **White-label Support**: Arsitektur aset yang memungkinkan penggantian logo dan skema warna aplikasi secara dinamis dari remote config backend tanpa harus mengompilasi ulang seluruh aplikasi.

---

### 4. ⚡ Peningkatan Konektivitas, Push Notification & Stabilitas Ruang Cerita App
- **Sinkronisasi Web Push & Auto-Prompt Device Registration [SELESAI DITERAPKAN]**:
  - Auto-request permission Web Push di kedua client web (`RUANG CERITA` & `PIK-R MANSEKU`).
  - Runtime permission dialog di Flutter Mobile App (Notifikasi, Kamera, Mikrofon, Galeri Foto & Video).
  - Pendaftaran otomatis subscription ke backend `POST /api/push/subscribe` sehingga jumlah subscriber aktif terdeteksi di dashboard Admin.
- **Integrasi Firebase Cloud Messaging (FCM) Lanjutan**:
  - Notifikasi instan saat ada pesan masuk (DM), panggilan curhat konselor, interaksi komentar, suka cerita, dan pengumuman massal sekolah.
- **Optimasi Realtime SSE (Server-Sent Events)**:
  - Mekanisme auto-reconnect cerdas dengan exponential backoff dan heartbeat keep-alive ketika aplikasi berpindah background/foreground atau saat koneksi internet tidak stabil.
- **Offline Caching & State Persistence**:
  - Penyimpanan lokal riwayat obrolan dan profil offline menggunakan Hive / SQLite terenkripsi di Flutter.
  - Feed visual dapat dibaca sekilas saat offline dengan optimasi image caching (CachedNetworkImage).

---

### 5. 🏢 Persiapan Arsitektur Multi-Tenancy SaaS Sekolah
- **Tenant Isolation**: Dukungan pemisahan basis data atau skema multi-tenant untuk melayani beberapa sekolah dalam 1 infrastruktur backend.
- **Subdomain Routing Dinamis**: Routing otomatis sekolah (contoh: `man1.pikr.id`, `sman2.pikr.id`, `absen.man1.pikr.id`).
- **Panel Super Admin SaaS**: Monitoring lisensi sekolah aktif, jumlah siswa terdaftar, kuota penyimpanan media, dan analitik penggunaan bot WhatsApp.

---

*Terakhir diperbarui: 22 November 2026*
