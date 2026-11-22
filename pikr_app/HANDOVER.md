# PIK-R Ruang Cerita — Handover untuk Claude Code

> **Dibuat:** 2026-11-17 06:03 WIB  
> **Dari:** Antigravity AI  
> **Untuk:** Claude Code (lanjutkan Flutter app)

---

## Ringkasan Proyek

**PIK-R Ruang Cerita** adalah platform media sosial remaja milik PIK-R Manseku.  
- **Web App (sudah live):** https://pikr-manseku.my.id  
- **Backend:** Node.js, port 25552, dikelola PM2 (`pikr-backend`)  
- **Frontend Web:** Vite + React, port 25555, dikelola PM2 (`pikr-cerita`)  
- **Flutter App (sedang dibangun):** `E:\PIKR-MANSEKU.MY.ID\pikr_app\`

---

## Progress Section

### ✅ SELESAI

#### Web App
- [x] AiCounsel frontend redesign (mood tabs, chat bubble, Fibonacci spacing)
- [x] BreathingModal redesign (3 ring konsentris, countdown fade, fase warna)
- [x] InAppToast + notifikasi DM/follow di App.jsx
- [x] Backend DM notify (messages.js memanggil `notify()` setelah broadcast)
- [x] PM2 sudah restart, semua online

#### Flutter App — File yang sudah dibuat
- [x] `pubspec.yaml` — dependencies lengkap
- [x] `lib/main.dart` — entry point, GoRouter, ProviderScope
- [x] `lib/shared/theme/colors.dart` — semua token warna (light + dark)
- [x] `lib/shared/theme/app_theme.dart` — ThemeData clay warm (light + dark)
- [x] `lib/shared/widgets/avatar.dart` — cached image + fallback inisial
- [x] `lib/shared/widgets/shell_scaffold.dart` — BottomNav 5 tab
- [x] `lib/core/api/client.dart` — Dio + JWT interceptor + auto-refresh
- [x] `lib/core/api/endpoints.dart` — semua URL constants
- [x] `lib/core/auth/secure_storage.dart` — flutter_secure_storage wrapper
- [x] `lib/core/auth/auth_provider.dart` — AsyncNotifier (login/logout/checkSession)
- [x] `lib/core/live/sse_client.dart` — SSE client dengan auto-reconnect
- [x] `lib/features/auth/login_page.dart` — form login clean
- [x] `lib/features/home/home_page.dart` — feed + story bar
- [x] `lib/features/home/post_provider.dart` — Riverpod FeedNotifier (infinite scroll, like optimistic)
- [x] `lib/features/messages/inbox_page.dart` — daftar DM
- [x] `lib/features/messages/thread_page.dart` — chat bubble DM
- [x] `lib/features/ai_counsel/ai_counsel_page.dart` — Sahabat AI (mood tabs, chat, chips)
- [x] `lib/features/ai_counsel/breathing_modal.dart` — animasi ring Flutter (3 ring, fade countdown)
- [x] `lib/features/notifications/notif_page.dart` — list aktivitas
- [x] `lib/features/profile/profile_page.dart` — profil + logout
- [x] `lib/features/counsel/counsel_page.dart` — placeholder Bilik Konseling
- [x] Config files Android: `android_config/app_build.gradle.kts.txt`, `AndroidManifest.xml.txt`
- [x] Config files iOS: `ios_config/Info.plist.txt`, `PrivacyInfo.xcprivacy.txt`
- [x] `README.md` — setup & build guide lengkap

#### Flutter SDK
- [x] Downloaded: `E:\flutter_sdk.zip` (1063.5 MB) ✅
- [x] Extracting ke `E:\flutter\` — **MASIH BERJALAN** (task-2885, ~4879 items dari ~50k+)
- [x] `E:\flutter\bin\flutter.bat` sudah ada tapi menunggu extract selesai

---

### 🔄 YANG HARUS DILAKUKAN (prioritas urut)

#### 1. Tunggu/Verifikasi Extract Selesai
```powershell
# Cek apakah extract task-2885 masih running (mungkin sudah selesai)
# Kalau sudah selesai, verifikasi:
& "E:\flutter\bin\flutter.bat" --version
```
Kalau masih ada "startup lock", berarti task-2885 masih running. Tunggu selesai.

#### 2. Flutter Create — Inisialisasi Platform Files
```powershell
cd "E:\PIKR-MANSEKU.MY.ID\pikr_app"

# PENTING: backup dulu file Dart kita sebelum flutter create overwrite main.dart
# (flutter create overwrite lib/main.dart dengan template default)
Copy-Item "lib\main.dart" "lib\main.dart.backup"

# Create project (hanya generate android/ ios/ dan boilerplate — lib/ tidak dihapus kalau sudah ada)
& "E:\flutter\bin\flutter.bat" create . --org id.my.manseku --platforms android,ios --no-pub

# Restore main.dart kita kalau teroverwrite
Copy-Item "lib\main.dart.backup" "lib\main.dart" -Force

# Install dependencies
& "E:\flutter\bin\flutter.bat" pub get
```

#### 3. Copy Config Files ke Tempat yang Benar
```powershell
# Android build.gradle — copy ke android/app/build.gradle.kts
Copy-Item "android_config\app_build.gradle.kts.txt" "android\app\build.gradle.kts" -Force

# AndroidManifest
Copy-Item "android_config\AndroidManifest.xml.txt" "android\app\src\main\AndroidManifest.xml" -Force

# iOS Info.plist
Copy-Item "ios_config\Info.plist.txt" "ios\Runner\Info.plist" -Force

# iOS Privacy Manifest
Copy-Item "ios_config\PrivacyInfo.xcprivacy.txt" "ios\Runner\PrivacyInfo.xcprivacy" -Force
```

#### 4. Flutter Analyze + Fix Errors
```powershell
& "E:\flutter\bin\flutter.bat" analyze
```
Fix semua error yang muncul. Kemungkinan masalah:
- Import `shimmer` di pubspec tapi belum dipakai — aman, tidak error
- `flutter_svg` belum dipakai — aman
- Mungkin ada typo atau missing import

#### 5. Tambah Font Assets
Download font Outfit dari Google Fonts dan taruh di `assets/fonts/`:
- `Outfit-Regular.ttf`
- `Outfit-Medium.ttf`
- `Outfit-SemiBold.ttf`
- `Outfit-Bold.ttf`

Atau pakai package `google_fonts` (sudah ada di pubspec) dan hapus font declaration dari pubspec.yaml:
```dart
// Di app_theme.dart, ganti:
// fontFamily: 'Outfit',
// dengan:
import 'package:google_fonts/google_fonts.dart';
// lalu pakai GoogleFonts.outfit(...)
```

#### 6. Test di Android Emulator
```powershell
# List available devices
& "E:\flutter\bin\flutter.bat" devices

# Run (debug mode)
& "E:\flutter\bin\flutter.bat" run
```

#### 7. Build Release APK (untuk testing)
```powershell
& "E:\flutter\bin\flutter.bat" build apk --release --no-obfuscate
# Output: build\app\outputs\flutter-apk\app-release.apk
```

#### 8. Build AAB (untuk Play Store)
```powershell
# Buat keystore dulu (sekali saja):
keytool -genkey -v -keystore pikr-release.jks -keyalg RSA -keysize 2048 -validity 10000 -alias pikr

# Set di android/key.properties:
# storePassword=...
# keyPassword=...
# keyAlias=pikr
# storeFile=../../pikr-release.jks

& "E:\flutter\bin\flutter.bat" build appbundle --release
```

#### 9. Fitur yang Belum Diimplementasi (backlog)
- [ ] `thread_page.dart` perlu ditambah ke router (route `/pesan/:threadId`)
- [ ] Story viewer (full screen)
- [ ] Post detail + comments
- [ ] Upload foto (image_picker + multipart)
- [ ] FCM push notification setup
- [ ] Bilik Konseling page (counsel_page.dart masih placeholder)
- [ ] Profile lain (bukan diri sendiri)
- [ ] Search page
- [ ] Settings page

---

## Informasi Teknis Penting

### Backend API
- **Base URL:** `https://pikr-manseku.my.id/api`
- **Auth:** JWT Bearer token
- **Login endpoint:** `POST /api/auth/login` → `{ token, refreshToken, user }`
- **Refresh:** `POST /api/auth/refresh` → `{ token, refreshToken }`

### Key Endpoints (lihat `lib/core/api/endpoints.dart`)
```
POST   /auth/login
POST   /auth/refresh
GET    /auth/me
GET    /posts?limit=20&cursor=...
POST   /posts/:id/like
GET    /messages/threads
GET    /messages/threads/:id/messages
POST   /messages/threads/:id/messages
GET    /notifications
GET    /ai/sessions
POST   /ai/sessions
POST   /ai/sessions/:id/chat
PATCH  /ai/sessions/:id/tone
```

### Design System
- **Accent:** `#F97316` (orange)
- **Background:** `#F4F1EE` (clay warm)
- **Surface:** `#FCF9F6`
- **Text:** `#2A1F17`
- **Fonts:** Outfit (heading/display), Inter (body)
- **Spacing Fibonacci:** 5·8·13·21·34·55px
- **Border radius:** 10·13·16·20px

### Flutter SDK Location
```
E:\flutter\bin\flutter.bat    ← flutter executable
E:\flutter\bin\dart.bat       ← dart executable
```

### Project Location
```
E:\PIKR-MANSEKU.MY.ID\pikr_app\
```

### PM2 Processes (web)
```powershell
pm2 list
pm2 logs pikr-backend --lines 20 --nostream
pm2 restart pikr-backend pikr-cerita --update-env
```

### Web Build Command
```powershell
cd "E:\PIKR-MANSEKU.MY.ID\RUANG CERITA PIK-R\web"
npm run build
pm2 restart pikr-cerita --update-env
```

---

## File Tree Lengkap Flutter

```
E:\PIKR-MANSEKU.MY.ID\pikr_app\
├── pubspec.yaml                              ✅ lengkap
├── README.md                                 ✅ build guide
├── lib/
│   ├── main.dart                             ✅ GoRouter + ProviderScope
│   ├── core/
│   │   ├── api/
│   │   │   ├── client.dart                   ✅ Dio + JWT interceptor
│   │   │   └── endpoints.dart                ✅ URL constants
│   │   ├── auth/
│   │   │   ├── auth_provider.dart            ✅ Riverpod AuthNotifier
│   │   │   └── secure_storage.dart           ✅ flutter_secure_storage
│   │   └── live/
│   │       └── sse_client.dart               ✅ SSE auto-reconnect
│   ├── features/
│   │   ├── auth/
│   │   │   └── login_page.dart               ✅ form login
│   │   ├── home/
│   │   │   ├── home_page.dart                ✅ feed + story bar
│   │   │   └── post_provider.dart            ✅ FeedNotifier + Post model
│   │   ├── messages/
│   │   │   ├── inbox_page.dart               ✅ daftar DM
│   │   │   └── thread_page.dart              ✅ chat bubble
│   │   ├── ai_counsel/
│   │   │   ├── ai_counsel_page.dart          ✅ Sahabat AI
│   │   │   └── breathing_modal.dart          ✅ animasi ring
│   │   ├── counsel/
│   │   │   └── counsel_page.dart             ⚠️  placeholder
│   │   ├── notifications/
│   │   │   └── notif_page.dart               ✅ list notif
│   │   └── profile/
│   │       └── profile_page.dart             ✅ profil + logout
│   └── shared/
│       ├── theme/
│       │   ├── colors.dart                   ✅ token warna
│       │   └── app_theme.dart                ✅ ThemeData
│       └── widgets/
│           ├── avatar.dart                   ✅ cached image
│           └── shell_scaffold.dart           ✅ BottomNav 5 tab
├── android_config/                           ⚠️  perlu dicopy ke android/
│   ├── app_build.gradle.kts.txt
│   └── AndroidManifest.xml.txt
├── ios_config/                               ⚠️  perlu dicopy ke ios/
│   ├── Info.plist.txt
│   └── PrivacyInfo.xcprivacy.txt
└── scripts/
    └── init_project.mjs                      ← helper script setup
```

---

## Catatan Khusus

1. **`flutter create`** akan generate folder `android/` dan `ios/` yang diperlukan. File Dart di `lib/` **tidak akan dihapus** karena sudah ada. Tapi `lib/main.dart` bisa teroverwrite — backup dulu.

2. **Google Fonts** — pubspec.yaml sudah declare font Outfit dari assets, tapi file font belum ada. Opsi: download manual ATAU switch ke package `google_fonts` dan hapus font declaration.

3. **Firebase** — pubspec.yaml include `firebase_core` + `firebase_messaging` tapi belum ada `google-services.json` / `GoogleService-Info.plist`. Kalau tidak mau setup Firebase sekarang, hapus kedua dependencies ini dari pubspec.yaml dan hapus import-nya.

4. **Enkripsi pesan** — backend mengenkripsi DM dengan AES-256. App Flutter cukup tampilkan plaintext dari response (backend sudah decrypt sebelum kirim ke client).

5. **SSE / Live events** — `sse_client.dart` sudah handle auto-reconnect. Aktifkan dengan memanggil `ref.watch(notificationStreamProvider)` di widget yang perlu notifikasi realtime.
