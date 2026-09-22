# ERP Scanner — Aplikasi Mobile Scan Barcode Material

Aplikasi Expo (React Native) untuk memindai barcode material, melihat info stok, dan melakukan penyesuaian stok langsung dari HP. Terhubung ke backend `lin-packaging-service` melalui REST API.

## Prasyarat

- Node.js >= 18
- [Expo Go](https://expo.dev/go) di HP Android/iOS (untuk testing cepat), atau Emulator Android/Simulator iOS
- Backend `lin-packaging-service` sedang berjalan (jalankan `npm run dev` di folder `lin-packaging-service`)

## Cara Menjalankan

### 1. Install dependencies

```bash
cd mobile-scanner
npm install
```

### 2. Konfigurasi URL backend

Salin `.env.example` ke `.env`:

```bash
cp .env.example .env
```

Edit `.env` sesuai environment:

| Environment | `EXPO_PUBLIC_API_URL` |
|---|---|
| Emulator Android | `http://10.0.2.2:3000` |
| Simulator iOS | `http://localhost:3000` |
| HP fisik (WiFi) | `http://<IP-LAN-server>:3000` |
| Expo Go via tunnel | `http://localhost:3000` (gunakan flag `--tunnel`) |

Untuk mengetahui IP LAN server (macOS):

```bash
ipconfig getifaddr en0
```

### 3. Jalankan aplikasi

```bash
# Mode development (QR code untuk Expo Go)
npx expo start

# HP fisik tanpa satu jaringan (pakai Expo tunnel - perlu akun Expo)
npx expo start --tunnel

# Khusus Android
npx expo start --android

# Khusus iOS
npx expo start --ios
```

## Alur Penggunaan

1. **Login** — Masuk dengan akun ERP yang memiliki akses ke modul Material & Stok (role: OWNER, WAREHOUSE, PURCHASING, atau PRODUCTION_PLANNER).
2. **Scan** — Arahkan kamera ke barcode material (Code128) yang dicetak dari halaman web app `Material & Stok → Barcode`.
3. **Detail** — Lihat info lengkap material: nama, kategori, stok total/reserved/tersedia, supplier, dsb.
4. **Adjust Stok** — Masukkan jumlah (+/-) dan catatan, lalu simpan. Penyesuaian dicatat ke database dengan audit trail (tercatat nama user yang melakukan).

## Struktur Folder

```
mobile-scanner/
  app/
    _layout.tsx          # Root layout + auth guard + stack navigator
    login.tsx            # Layar login email & password
    scan.tsx             # Layar scan barcode (kamera)
    material/[id].tsx    # Layar detail material + form adjust stok
  src/
    lib/
      api.ts             # Fetch wrapper ke backend API
      auth-context.tsx   # Context React untuk autentikasi
      storage.ts         # SecureStore (simpan token JWT di HP)
      types.ts           # Tipe TypeScript (Material, AuthUser, dll)
  .env.example           # Template environment variable
  app.json               # Konfigurasi Expo
  package.json
  tsconfig.json
```

## Backend API yang Digunakan

Semua endpoint di bawah prefix `/api/mobile/*` pada `lin-packaging-service`. Autentikasi via header `Authorization: Bearer <token>` (JWT 30 hari).

| Method | Path | Deskripsi |
|---|---|---|
| `POST` | `/api/mobile/auth/login` | Login & dapat token JWT |
| `GET` | `/api/mobile/materials/:sku` | Cari material by SKU (hasil scan) |
| `POST` | `/api/mobile/materials/:id/adjust` | Sesuaikan stok material |

## Build untuk Produksi

Gunakan [EAS Build](https://docs.expo.dev/build/introduction/) dari Expo:

```bash
npm install -g eas-cli
eas login
eas build --platform android   # APK/AAB
eas build --platform ios       # IPA (perlu Apple Developer Account)
```

Pastikan `EXPO_PUBLIC_API_URL` sudah diset ke URL backend production sebelum build.

## Catatan Keamanan

- Token JWT mobile berlaku **30 hari** dan disimpan di SecureStore (encrypted storage HP).
- Logout akan menghapus token dari HP (stateless — tidak ada blacklist server-side).
- Hanya akun dengan akses modul Material & Stok yang bisa login ke aplikasi ini.
- Setiap penyesuaian stok tercatat di AuditTrail database beserta userId pelaku.
