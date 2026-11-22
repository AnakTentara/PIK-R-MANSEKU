# 📜 Catatan Rilis & Riwayat Perubahan (CHANGELOG)
## Proyek: Ruang Cerita PIK-R MANSEKU

Format catatan ini mengikuti prinsip [Keep a Changelog](https://keepachangelog.com/id/1.0.0/) dan mematuhi [Semantic Versioning](https://semver.org/lang/id/).

---

## [2.1.0] - 2026-11-09
### Ditambahkan
* **Kamera langsung.** Tombol **+** membuka laci Buat: ubin paling atas = pratinjau kamera langsung (menyala hanya bila izin kamera sudah diberikan), lalu Galeri dan media yang sudah dipilih di sesi ini.
  * Kamera layar penuh dengan mode **CERITA** (9:16) dan **POSTINGAN** (3:4).
  * **Ketuk** = foto · **tahan** = video (geser jari ke atas/bawah = perbesar/perkecil) · **ketuk 2×** = rekam tanpa ditahan (ketuk lagi untuk berhenti) · ketuk 2× layar = ganti kamera depan/belakang · cubit = perbesar.
  * Lampu kilat (bila perangkat mendukung), batas video 60 detik, video tetap bisa direkam tanpa suara bila izin mikrofon ditolak. Lampu kamera mati begitu kamera ditutup.
  * Yang terlihat di bingkai = yang tersimpan (dipotong sesuai rasio, zoom, dan cermin kamera depan).
* **Penyunting foto/video** (satu komponen untuk Postingan, Cerita, dan Pesan):
  * Potong & rasio (Asli, 1:1, 4:5, 3:4, 16:9, 9:16), putar, cermin, geser & cubit untuk mengatur posisi.
  * 10 filter, penyesuaian (kecerahan, kontras, saturasi, kehangatan, pudar, vinyet) dengan **slider + angka yang bisa diketik + tombol −/+**.
  * Teks di atas foto: bisa digeser, 8 warna, dengan/tanpa latar, ukuran.
  * Cerita: foto "tampilkan utuh" di atas latar gradasi warna foto, atau "penuhi layar".
  * Hasil dirender di perangkat → pratinjau = hasil unggahan. Foto tanpa suntingan dikirim apa adanya (kualitas penuh).
* **Cerita: tombol suka** (hati di sebelah kolom balas). **Insight pemilik**: jumlah penonton & suka, daftar penonton dengan tanda suka, tab "Suka". Hanya pemilik yang melihat. Notifikasi "menyukai ceritamu" (tidak menumpuk saat suka-batal-suka).
* **Pesan:**
  * **Tekan lama** pesan = popup reaksi emoji + aksi (Balas, Edit, Salin, Tarik, Laporkan) di dekat pesan.
  * **Geser ke kanan** = balas (ada getar & ikon penanda).
  * Kirim foto lewat **kamera** atau galeri, lalu **penyunting yang sama** dengan postingan; opsi "Sekali lihat" di penyunting.
  * Bar ketik terangkat mengikuti tinggi keyboard HP (tidak lagi tertutup).

### Diubah
* **Akun baru publik & menerima pesan dari semua anggota** secara bawaan (keputusan pengurus). Akun yang masih memakai bawaan lama (privat + pesan dari yang diikuti) ikut diubah; permintaan ikuti yang tertunda diterima otomatis. Akun tetap bisa dijadikan privat di Pengaturan.
* Baki cerita & profil langsung diperbarui setelah mengikuti seseorang (cerita yang dibuat sebelum mengikuti ikut tampil), dan saat aplikasi dibuka kembali.

### Diperbaiki
* Pindah layar dalam satu langkah (kamera → penyunting) tidak lagi ikut tertutup oleh tombol Kembali yang tertunda.

### Catatan
* Browser tidak diizinkan membaca isi galeri/folder HP secara langsung. "Galeri" membuka pemilih file perangkat; daftar folder lengkap baru bisa di aplikasi Flutter.

---

## [2.0.0] - 2026-11-08
### Dibangun ulang (Breaking)
Versi 1.x (UI konsep) diganti seluruhnya. Alasannya: versi 1.x memuat form curhat yang tidak mengirim apa pun padahal menampilkan "terkirim", postingan & akun karangan (foto stok, angka suka palsu), folder galeri palsu, dan upload cerita yang rusak. Kode lama tetap ada di riwayat git (`1493fd5`).

### Ditambahkan
* **Tersambung ke backend sungguhan** (`/api/rc` di PIK-R-MANSEKU); tidak ada data karangan.
* **Desain** mengikuti web absen PIK-R: putih hangat + oranye PIK-R, Claymorphism 2.0, logo resmi PIK-R; tata letak Instagram. Mode terang bawaan, mode gelap opsional.
* **Desktop:** sidebar ringkas 76 px yang **melebar ke 248 px saat disorot** (label muncul), feed 470 px di tengah, kolom kanan berisi saran akun & pintu Bilik Konseling. Scrollbar oranye khas.
* **HP:** bar atas (logo, Bilik Konseling, notifikasi), bar bawah 5 tab (Beranda · Cari · Buat · Pesan · Profil), tombol Kembali menutup popup dulu.
* **Beranda:** baki cerita (cincin oranye = belum ditonton, hijau = Teman Dekat), feed kronologis dari akun yang diikuti, pesan "kamu sudah melihat semuanya" di ujung feed (anti gulir tanpa akhir).
* **Postingan:** carousel geser, ketuk dua kali = suka dengan animasi hati, simpan, bagikan ke teman, komentar berutas, suka komentar, sematkan, @sebutan & #tagar, rasio 9:16 s/d 16:9 (bawaan 3:4).
* **Cerita:** penampil layar penuh (ketuk kiri/kanan, tahan = jeda, geser bawah = tutup), reaksi emoji, balas, stiker polling & pertanyaan, penonton, arsip, Sorotan.
* **Buat:** postingan (sampai 10 foto/video, urutkan, tandai teman, audiens Teman Dekat, sembunyikan suka, matikan komentar) dan cerita (foto/video/teks berlatar, stiker), progres unggah.
* **Pesan:** kotak masuk + Notes, Utama/Permintaan, percakapan realtime, balas, reaksi, edit 15 menit, tarik pesan, foto sekali lihat, sedang mengetik, tanda dibaca, grup. Isi dienkripsi di server.
* **Bilik Konseling:** terpisah dari Pesan. Topik, anonim untuk konselor, antrean & ruang konselor, nomor SEJIWA/SAPA/112 selalu terlihat, penjelasan privasi yang jujur.
* **Profil:** grid 3 kolom, tab Postingan/Ditandai, Sorotan, Ikuti/Diminta/Mengikuti, pengikut bersama, menu Teman Dekat/Bisukan/Batasi/Blokir/Laporkan, tampilan akun privat.
* **Pengaturan & privasi:** akun privat, siapa yang boleh mengirim pesan, status aktivitas, kata tersembunyi, mode tenang (pengingat istirahat), daftar teman dekat, akun yang diblokir/dibisukan/dibatasi.
* **PWA:** bisa dipasang di layar utama (manifest, ikon PIK-R). Halaman tidak diindeks mesin pencari (`noindex`).

### Diuji
* 17 uji antarmuka (HP 390 px & desktop 1440 px) dan 34 uji keamanan/privasi backend: semua lulus.

---

## [1.3.0] - 2026-11-08
### Ditambahkan (Added)
* **Sidebar Desktop Minimized (Icon-Only Compact 74px)**:
  * Sidebar desktop secara *default* diminimalkan menjadi kolom ramping 74px dengan logo ikon *Ruang Cerita* saja dan ikon navigasi terpusat.
  * Dilengkapi *hover tooltip* dan *claymorphic active pill* untuk setiap menu.
* **Feed Beranda Terpusat (Centered Feed on Desktop)**:
  * Penataan layout desktop disesuaikan dengan `margin-left: 74px` dan feed utama berada persis di tengah layar (`margin: 0 auto; max-width: 520px`).
* **Split Inline Comments Panel di Samping Postingan**:
  * Ketika tombol komentar pada postingan tertentu diklik di desktop ($\ge 900\text{px}$):
    * Postingan tersebut bergeser mulus ke arah kiri (`transform: translateX(-160px)` dengan fisika pegas `var(--spring)`).
    * Di sisi kanannya muncul panel komentar claymorphic (`desktopCommentBox`, lebar 320px) yang sejajar dengan tinggi postingan.
    * Menampilkan daftar komentar komunitas, waktu unggah, dan formulir input komentar langsung.
* **Auto-Close Komentar Saat Scroll**:
  * Menambahkan *scroll listener* otomatis: saat pengguna menggulir halaman ke bawah (atau ke atas), box komentar otomatis tertutup dan postingan kembali meluncur mulus ke posisi tengah feed.

---

## [1.2.0] - 2026-11-08
### Ditambahkan (Added)
* **Mode Kamera Fullscreen Interaktif (`FullscreenCameraModal.jsx` & CSS)**:
  * Membuka live viewfinder layar penuh memanfaatkan Web Camera API (`navigator.mediaDevices.getUserMedia`).
  * **Gesture Shutter Button Lengkap (Instagram / TikTok Style)**:
    * **1x Klik (Tap)**: Mengambil foto instan beresolusi tinggi langsung dari frame video menggunakan HTML5 `<canvas>`.
    * **Hold Klik (Tekan & Tahan)**: Merekam video dinamis dengan `MediaRecorder` API dan progress timer merah.
    * **Drag Zoom Gesture**: Saat menahan tombol shutter, menggeser pointer/jari ke atas (menjauh dari tombol) memicu *Digital Zoom-In* hingga 3.0x; menggeser kembali ke bawah memicu *Zoom-Out*.
    * **Double Klik (Double Tap)**: Mode **Handsfree Video Recording**! Merekam otomatis tanpa perlu menahan jari, timer berjalan, dan cukup ketuk sekali untuk menghentikan rekaman.
  * **Mode Switcher Ganda**: Tab swipe di bawah shutter untuk berpindah antara mode **`CERITA`** (publikasi ke cerita 24 jam) dan mode **`POSTINGAN`** (publikasi ke feed umum).
  * Kontrol kamera lengkap: Flash (`⚡`), Flip Kamera Depan/Belakang (`🔄`), dan Akses Galeri Cepat (`🖼️`).
  * Layar review sebelum unggah: Pratinjau hasil tangkapan (foto/video), kolom input caption, dan tombol publikasi terarah.
* **Creation & Gallery Drawer (`CreationDrawer.jsx` & CSS)**:
  * Drawer slide-up halus dari bawah ketika tombol tengah `+` pada dock diklik.
  * **Tile Paling Atas (Live Camera Preview Tile)**: Kotak pertama di galeri menampilkan video stream kamera aktif secara real-time dengan animasi lencana kamera dan tombol langsung ke Fullscreen Camera.
  * **Pemilih Folder Perangkat**: Dropdown di header drawer (*Galeri Terbaru ▾*, *Kamera*, *WhatsApp Media*, *Tangkapan Layar*, *Unduhan*).
  * Tombol input file native untuk memilih media langsung dari penyimpanan ponsel atau PC.
  * Pratinjau media terpilih lengkap dengan pemilih target publikasi (*Postingan Feed* vs *Cerita 24 Jam*).
* **Sidebar Desktop Responsif (`DesktopSidebar.jsx` & CSS)**:
  * Layout khusus desktop (layar $\ge 900\text{px}$) mengadopsi navigasi vertikal Instagram Desktop: Logo *Ruang Cerita*, Beranda, Cari, Cerita Remaja, Bilik Konseling, Notifikasi, tombol **+ Buat Cerita**, dan Profil.
  * **Floating Quick Chat Pill**: Tombol pill melayang di sudut kanan bawah desktop dengan avatar konselor sebaya untuk akses cepat ke Bilik Konseling.
* **Sticky 3D Claymorphic Bottom Bar**:
  * Tombol tengah **`+`** (Add Post) terangkat (`transform: translateY(-12px)`), bergradien sunset oranye dengan border putih 3D dan bayangan timbul yang menonjol di atas dock.
  * Navigasi 5 tab ramah jempol (Thumb Theory).

### Ditingkatkan (Changed)
* **Claymorphism 2.0 pada Setiap Feed Card**:
  * Radius sudut diperhalus menjadi `22px` (mobile) dan `24px` (desktop).
  * Bayangan dual-layer ditingkatkan (`--clay-card`): bayangan luar lembut dengan pantulan bevel atas putih (`inset 0 2px 2px rgba(255, 255, 255, 0.95)`).
  * Palet warna disempurnakan menjadi *Warm White Canvas* (`#FAFAF9`), permukaan kartu `#FFFFFF`, dan aksen *Warm Sunset Orange PIK-R* (`#EA580C`, `#F97316`, `#F59E0B`).

---

## [1.1.0] - 2026-11-08
### Ditambahkan (Added)
* **Kiblat UI Instagram Mobile**:
  * **Top Navigation Bar**: Tombol `+` di kiri, logo kursif *Ruang Cerita* (`Grand Hotel`) dengan chevron dropdown `▾` interaktif (opsi filter: *Beranda*, *Mengikuti*, *Bilik Konseling*), ikon notifikasi `<Heart />` dengan red dot, dan ikon pesan `<Send />` dengan badge counter `2`.
  * **Stories Bar 24 Jam**: Item pertama *Cerita Anda* dengan avatar dan badge plus oranye; cincin cerita bercahaya gradien sunset PIK-R; lencana centang verifikasi (`✓`) untuk akun resmi organisasi.
  * **Post Card Layout Modern**:
    * Bar atribusi audio tersemat di bawah username: `<Music /> digiverse.unity · Audio asli (Karya Remaja)`.
    * Tombol pill mini-clay **Ikuti**.
    * Double-tap gesture pada foto dengan animasi floating heart burst (`❤️`).
    * Badge penanda akun (`👤`) di sudut kiri bawah media dan tombol bisu/suara (`🔊`/`🔇`) di kanan bawah.
    * Bar aksi sosial dengan angka sejajar (*inline counts*): Suka (`77`), Komentar (`4`), Repost (`8`), DM (`2`), dan Bookmark.
    * Bar social proof avatar tumpuk (*overlapping likers*).
    * Tagar beraksen oranye (`#ActGreen`, `#PIKRManseku`, `#DaurUlangKreatif`).
    * Cuplikan komentar teratas dengan ikon hati kecil.
* **Data Awal Komunitas (Seed Feed)**:
  * Menyajikan postingan berkualitas tinggi dari komunitas MAN 1 Muara Enim jika database masih kosong, mencakup proyek Adiwiyata daur ulang galon (`digiverse.unity`), karya puisi remaja (`roihan_id.mnsa_manusia_`), dan portfolio digital siswa (`dododididaw`).

---

## [1.0.0] - 2026-11-08
### Ditambahkan (Added)
* **Pemisahan Ruang Cerita dari Website Utama**:
  * Memisahkan fitur sosial media dan curhat dari halaman `/blog` website utama menjadi sub-proyek independen di direktori `E:\PIKR-MANSEKU.MY.ID\RUANG CERITA PIK-R`.
  * Membangun arsitektur Web PWA (React + Vite) di `web/` dan kerangka mobile Flutter di `mobile_flutter/`.
  * Membuat *directory junction* untuk `node_modules` sehingga menghemat kapasitas penyimpanan (0 bytes duplikasi).
* **Identitas Visual & Logo Khusus**:
  * Merancang logo vektor resmi `logo_cerita.svg` dan komponen React `RuangCeritaLogo.jsx`.
  * Menjaga identitas figur rangkulan khas PIK-R yang dipadukan dengan cincin gradien *story ring* Instagram, kurva senyum safe-space, dan kilauan emas konseling.
* **Perbaikan Bug UI**:
  * Menyelesaikan bug pemotongan teks bawah (*bottom crop*) pada font kursif `Grand Hotel` dengan penyesuaian `line-height: 1.25`, `overflow: visible`, dan padding kompensasi descender.
* **Integrasi Ekosistem & Hosting PM2**:
  * Mengonfigurasi service baru `pikr-cerita` pada file `ecosystem.config.cjs` berjalan di port **25555**.
  * Menghubungkan origin `https://ruang-cerita.pikr-manseku.my.id` ke CORS backend (`port 25552`).
  * Menambahkan banner promosi Ruang Cerita pada halaman forum/blog di website utama (`pikr-manseku.my.id/blog`).

---
*Arsip changelog ini dikelola dan diperbarui secara berkala seiring pertumbuhan platform Ruang Cerita PIK-R.*
