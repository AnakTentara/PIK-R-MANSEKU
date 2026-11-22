# PIK-R Ruang Cerita — Flutter App
## Setup & Build Guide

---

## Prasyarat

| Tool | Versi Min | Cek |
|------|-----------|-----|
| Flutter | 3.27.x | `flutter --version` |
| Dart | 3.6.x | bundled with Flutter |
| Android Studio | 2024.x | untuk Android SDK |
| Xcode | 16+ | macOS only, untuk iOS |
| Java JDK | 17 | `java --version` |

---

## Setup Pertama

```powershell
# 1. Masuk ke folder app
cd E:\PIKR-MANSEKU.MY.ID\pikr_app

# 2. Install dependencies
flutter pub get

# 3. Cek semua tools
flutter doctor -v

# 4. Jalankan di device/emulator (debug)
flutter run
```

---

## Build Release

### Android (APK Mandiri / Web Hosting)

```powershell
# 1. Masuk ke folder app
cd E:\PIKR-MANSEKU.MY.ID\pikr_app

# 2. Build Release APK (Package: org.pikrmanseku.app)
flutter build apk --release

# Output: build/app/outputs/flutter-apk/app-release.apk
# Salin ke web public downloads:
copy build\app\outputs\flutter-apk\app-release.apk ..\PIK-R-MANSEKU\frontend\public\downloads\ruang-cerita.apk
copy build\app\outputs\flutter-apk\app-release.apk ..\PIK-R-MANSEKU\frontend\dist\downloads\ruang-cerita.apk
```

### Android (Play Store AAB)

```powershell
# 1. Buat keystore (sekali saja)
keytool -genkey -v -keystore pikr-release.jks -keyalg RSA -keysize 2048 -validity 10000 -alias pikr

# 2. Set environment variables
$env:KEY_STORE = "E:\PIKR-MANSEKU.MY.ID\pikr_app\pikr-release.jks"
$env:KEY_STORE_PASSWORD = "your_keystore_password"
$env:KEY_ALIAS = "pikr"
$env:KEY_PASSWORD = "your_key_password"

# 3. Build AAB (untuk Play Store)
cd E:\PIKR-MANSEKU.MY.ID\pikr_app
flutter build appbundle --release

# Output: build/app/outputs/bundle/release/app-release.aab
```

### iOS (App Store) — perlu macOS + Xcode

```bash
# 1. Install pods
cd ios && pod install && cd ..

# 2. Build IPA
flutter build ipa --release

# 3. Upload via Xcode Organizer atau Transporter
# Output: build/ios/ipa/*.ipa
```

---

## Firebase Setup

### Android
1. Buat project Firebase di https://console.firebase.google.com
2. Tambahkan Android app: package = `org.pikrmanseku.app`
3. Download `google-services.json` → taruh di `android/app/`
4. Aktifkan baris `id("com.google.gms.google-services")` di `android/app/build.gradle.kts`

### iOS
1. Tambahkan iOS app: bundle ID = `org.pikrmanseku.app`
2. Download `GoogleService-Info.plist` → taruh di `ios/Runner/`

---

## Struktur File Penting

```
pikr_app/
├── lib/
│   ├── main.dart                 ← Entry point, GoRouter
│   ├── core/
│   │   ├── api/client.dart       ← Dio + JWT interceptor
│   │   ├── api/endpoints.dart    ← URL constants
│   │   ├── auth/                 ← AuthProvider, SecureStorage
│   │   └── live/sse_client.dart  ← SSE realtime
│   ├── features/
│   │   ├── auth/login_page.dart
│   │   ├── home/home_page.dart
│   │   ├── messages/inbox_page.dart
│   │   ├── ai_counsel/           ← Sahabat AI + Breathing
│   │   ├── counsel/              ← Bilik Konseling
│   │   ├── notifications/
│   │   └── profile/
│   └── shared/
│       ├── theme/                ← AppTheme, colors, text styles
│       └── widgets/              ← Avatar, ShellScaffold
├── android_config/               ← Config files Android (copy ke tempat yang benar)
└── ios_config/                   ← Config files iOS (copy ke tempat yang benar)
```

---

## Perintah Berguna

```powershell
# Hot reload (debug mode)
# Tekan 'r' di terminal

# Analyze code
flutter analyze

# Format code
dart format lib/

# Update dependencies
flutter pub upgrade

# Clean build cache
flutter clean && flutter pub get
```

---

## Checklist Play Store

- [ ] App icon (adaptive icon — `android/app/src/main/res/mipmap-*/`)
- [ ] Splash screen
- [ ] `google-services.json` di `android/app/`
- [ ] Signing keystore
- [ ] Privacy Policy URL
- [ ] Target SDK 35
- [ ] Screenshot 2-8 untuk listing

## Checklist App Store

- [ ] App icon 1024×1024
- [ ] `GoogleService-Info.plist` di `ios/Runner/`
- [ ] `PrivacyInfo.xcprivacy` (Privacy Manifest)
- [ ] Provisioning profile + Distribution cert
- [ ] Screenshot untuk tiap device size (6.5", 5.5")
- [ ] Age Rating: 12+ (konten sosial)
