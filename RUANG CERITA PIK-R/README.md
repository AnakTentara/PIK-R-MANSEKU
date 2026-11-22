# 🌟 Ruang Cerita PIK-R MANSEKU

> **Platform Media Sosial Komunitas Remaja & Bilik Konseling Sebaya Madrasah Aliyah Negeri 1 Muara Enim**  
> *Community First, Safe Space, dan Ekosistem Digital Berdaya Saing Tinggi.*

---

## 📌 Sekilas Proyek

**Ruang Cerita PIK-R** adalah platform sosial media mandiri yang didesain khusus untuk mendukung interaksi, literasi kreatif, dan pendampingan konseling bagi remaja. Mengadopsi standar kenyamanan dan keakraban navigasi Instagram, platform ini disempurnakan dengan tema visual **Warm White Canvas**, **Warm Sunset Orange Accent**, serta sentuhan **Mini-Claymorphism 2.0 (Tactile 3D Soft Shadows)** yang ringan, elegan, dan *zero-lag* (60 FPS).

Platform ini beroperasi sebagai sub-ekosistem mandiri di domain:
- **Web PWA**: `https://ruang-cerita.pikr-manseku.my.id` (Port internal PM2: `25555`)
- **Backend API**: Terintegrasi langsung dengan database sentral PIK-R MANSEKU (`http://localhost:25552` / `local.db`)
- **Aplikasi Mobile**: Kerangka native Flutter di `mobile_flutter/` untuk Android & iOS

---

## 🎨 Filosofi Desain & Ergonomi

1. **Aturan Emas 60-30-10 & Warm Orange Palette**:
   - **60% Latar Belakang**: Canvas hangat `#FAFAF9` (Instagram-inspired warm white).
   - **30% Struktur Permukaan**: Kartu `#FFFFFF` dengan sudut melengkung 22px–24px.
   - **10% Aksen Emosional**: *Sunset Orange PIK-R* (`#EA580C`, `#F97316`, `#F59E0B`).
2. **Claymorphism 2.0 (Zero-Lag 3D Tactile)**:
   - Bayangan dual-layer halus (`--clay-card`, `--clay-dock`, `--clay-pill`).
   - Efek timbul lembut dan pantulan cahaya bevel atas (`inset 0 2px 2px rgba(255,255,255,0.95)`).
   - Isolasi layer GPU dengan `contain: layout paint` dan `transform: translateZ(0)` untuk performa rendering ultra lancar di smartphone menengah.
3. **Thumb Theory & Ergonomi Hukum Fitts**:
   - Semua kontrol utama berada di zona jangkauan ibu jari (45% area bawah layar).
   - Target sentuh luas minimal 48px–56px dengan respon pegas fisika `var(--spring)`.

---

## ✨ Fitur Unggulan

### 1. Beranda Feed Sosial (Instagram-Style)
* **Header Interaktif**:
  * Tombol `+` tactile mini-clay untuk pembuatan konten instan.
  * Tipografi logo kursif *Ruang Cerita* (`Grand Hotel`) dengan dropdown filter (*Beranda*, *Mengikuti*, *Bilik Konseling*).
  * Ikon notifikasi aktivitas (red unread dot) dan pesan konseling (badge counter `2`).
* **Bar Cerita 24 Jam (Stories Bar)**:
  * Lingkaran *Cerita Anda* dengan avatar pengguna dan badge `+` di sudut kanan bawah.
  * Cincin gradien sunset berputar halus untuk pengguna dengan cerita aktif.
  * Lencana verifikasi resmi (`✓`) untuk akun organisasi madrasah.
* **Post Card Feed**:
  * Bar audio tersemat: `<Music /> Judul Audio · Suara asli`.
  * Tombol interaksi cepat: **Suka** (dengan double-tap heart burst), **Komentar**, **Bagikan Ulang (Repost)**, **Kirim/DM**, dan **Simpan (Bookmark)**.
  * Jumlah angka sosial ditampilkan langsung di samping setiap ikon (`77`, `4.166`, `124RB`).
  * Social proof avatar tumpuk (*overlapping likers*).
  * Cuplikan komentar terfavorit dan hashtag beraksen oranye.

### 2. Sticky 3D Claymorphic Bottom Dock & Center `+`
* Floating dock melayang di bawah layar dengan 5 navigasi ramah jempol:
  1. **Beranda** (Home) dengan indikator clay pill gelap saat aktif.
  2. **Cerita Remaja** (Reels / Clapperboard).
  3. **Tombol Center `+`**: Tombol 3D terangkat (`transform: translateY(-12px)`), bergradien sunset oranye dengan border putih timbul.
  4. **Bilik Konseling / DM** (dengan unread dot).
  5. **Profil Pengguna**.
* Mengetuk tombol **`+`** akan memicu transisi slide-up halus membuka **Creation Drawer**.

### 3. Creation & Gallery Drawer (`CreationDrawer.jsx`)
* **Pemilih Folder Perangkat**: Dropdown untuk memfilter (*Galeri Terbaru ▾*, *Kamera*, *WhatsApp Media*, *Tangkapan Layar*, *Unduhan*).
* **Tile Paling Atas (Live Camera Preview Tile)**:
  * Kotak pertama di galeri menampilkan umpan kamera aktif secara real-time.
  * Mengetuk tile langsung meluncurkan **Mode Kamera Fullscreen**.
* **Daftar Grid Galeri**: Menampilkan media lokal dan pratinjau instan dengan opsi beralih target publikasi (*Postingan Feed* vs *Cerita 24 Jam*).

### 4. Mode Kamera Fullscreen dengan Gesture Pintar (`FullscreenCameraModal.jsx`)
* **Live Viewfinder**: Kamera fullscreen dengan kontrol Flash (`⚡`), Flip Kamera Depan/Belakang (`🔄`), dan Tutup (`✕`).
* **Gesture Shutter Button Lengkap**:
  * **1x Klik (Tap)**: Mengambil foto instan beresolusi tinggi via canvas snapshot.
  * **Hold Klik (Tekan & Tahan)**: Mulai merekam video klip (`MediaRecorder` API).
  * **Drag Zoom In / Out**: Saat menahan tombol shutter, geser jari ke atas (menjauh) untuk zoom in hingga 3.0x, dan geser ke bawah untuk zoom out.
  * **Double Klik (Double Tap)**: Mode **Handsfree Video**! Mulai merekam otomatis tanpa perlu ditahan, lengkap dengan timer `00:03...`, dan klik sekali untuk stop.
* **Mode Switcher**: Tab swipe di bawah shutter untuk beralih antara:
  * **`CERITA`**: Publikasi langsung ke Cerita 24 Jam.
  * **`POSTINGAN`**: Publikasi langsung ke feed beranda.

### 5. Tampilan Desktop Responsif ($\ge 900\text{px}$)
* **Left Sidebar**: Mengadaptasi layout desktop Instagram dengan menu navigasi vertikal, logo brand, dan penataan feed terpusat (lebar maksimal 580px).
* **Floating Quick Chat Pill**: Tombol pill melayang di sudut kanan bawah desktop untuk membuka sesi konseling secara instan.

---

## 📁 Struktur Repositori

```
E:\PIKR-MANSEKU.MY.ID\RUANG CERITA PIK-R\
├── web/                           # Aplikasi Web PWA (React + Vite)
│   ├── public/
│   │   ├── logo_cerita.svg        # Logo vektor resmi Ruang Cerita
│   │   └── manifest.json          # Konfigurasi PWA Mobile
│   ├── src/
│   │   ├── api/                   # Klien API terhubung ke backend PIK-R
│   │   ├── components/
│   │   │   ├── camera/            # FullscreenCameraModal & kontrol gestur
│   │   │   ├── common/            # RuangCeritaLogo & shared components
│   │   │   ├── feed/              # PostCard, StoriesBar, CreationDrawer, CommentSheet
│   │   │   └── layout/            # TopNav, BottomNav (3D Dock), DesktopSidebar
│   │   ├── pages/                 # HomePage, ExplorePage, CounselingPage, ProfilePage
│   │   ├── stores/                # Zustand Auth & State management
│   │   ├── styles/                # index.css (Claymorphism & Desain Token)
│   │   ├── App.jsx                # Router & Master Layout
│   │   └── main.jsx
│   └── package.json
├── mobile_flutter/                # Kerangka Aplikasi Flutter Mobile
│   ├── lib/
│   │   └── main.dart              # InAppWebView shell + native deep link
│   └── pubspec.yaml
├── CHANGELOG.md                   # Riwayat pengembangan lengkap dari awal proyek
└── README.md                      # Dokumentasi teknis proyek
```

---

## 🚀 Panduan Menjalankan & Build

### 1. Prasyarat
- Node.js versi 18+ atau 20+
- PM2 (Process Manager)
- Backend PIK-R MANSEKU aktif di port `25552`

### 2. Menjalankan Mode Pengembangan (Vite Dev)
```bash
cd "E:\PIKR-MANSEKU.MY.ID\RUANG CERITA PIK-R\web"
npm run dev
```

### 3. Build Produksi & Reload PM2
```bash
cd "E:\PIKR-MANSEKU.MY.ID\RUANG CERITA PIK-R\web"
npm run build
pm2 reload pikr-cerita
```

### 4. Peta Port Layanan PM2
| Nama Proses | Port | Deskripsi |
| :--- | :--- | :--- |
| `pikr-cerita` | **25555** | Frontend Web Ruang Cerita PIK-R |
| `pikr-backend` | **25552** | REST API & Database SQLite Bersama |
| `pikr-web` | **25551** | Website Profil Utama PIK-R MANSEKU |
| `pikr-absen` | **25554** | Sistem Presensi Wajah & QR Siswa |

---

## 🔒 Kebijakan & Keamanan
- Menggunakan sanitasi input terpusat untuk caption dan komentar.
- Mendukung mode pelaporan konten sensitif/perundungan (*anti-bullying shield*).
- Bilik Konseling dilengkapi mode anonim (*incognito*) untuk melindungi privasi siswa madrasah.

---
*Dikelola dengan dedikasi untuk Generasi Berencana (GenRe) PIK-R MAN 1 Muara Enim.*
