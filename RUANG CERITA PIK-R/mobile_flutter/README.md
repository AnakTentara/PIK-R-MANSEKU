# 📱 Ruang Cerita PIK-R — Flutter Mobile App

Aplikasi mobile resmi **Ruang Cerita PIK-R MAN 1 Muara Enim** untuk Android dan iOS.

---

## 🚀 Fitur Utama
1. **Instagram-Style Social Experience**: Feed vertikal, Stories 24 jam dengan ring gradien, eksplorasi grid foto 3 kolom.
2. **Native Device Integration**: Akses kamera & galeri foto untuk unggah cerita, penanganan deep-link WhatsApp, dan navigasi tombol back Android yang mulus.
3. **PWA Standalone Support**: Siswa juga dapat menginstal langsung dari browser tanpa file APK melalui fitur *"Tambahkan ke Layar Utama"*.

---

## 📦 Cara Membangun APK Android

1. Pastikan Flutter SDK sudah terpasang di komputer:
   ```bash
   flutter doctor
   ```

2. Unduh dependensi:
   ```bash
   flutter pub get
   ```

3. Uji coba langsung di HP / Emulator:
   ```bash
   flutter run
   ```

4. Bangun file APK rilis:
   ```bash
   flutter build apk --release
   ```
   *File APK siap pakai akan tersedia di folder `build/app/outputs/flutter-apk/app-release.apk`.*

---

## 🌐 Koneksi Backend & Reverse Proxy
* Target URL: `https://ruang-cerita.pikr-manseku.my.id`
* Local Port PM2: `http://localhost:25555`
* API Backend: `http://localhost:25552`
