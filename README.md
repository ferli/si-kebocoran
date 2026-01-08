# Laporan Kebocoran PDAM

Sistem Pelaporan Kebocoran Air Berbasis Komunitas untuk PDAM Indonesia 💧

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Deploy to Cloudflare Workers](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/ferli/si-kebocoran)

## 🎯 Masalah
Tingkat Kehilangan Air (NRW) di Indonesia rata-rata masih di atas 40%. Salah satu penyebab utamanya adalah **keterlambatan laporan kebocoran fisik**. Warga sering bingung harus lapor ke mana, atau laporan mereka tidak ditindaklanjuti karena lokasi kurang jelas.

## 💡 Solusi
Aplikasi web sederhana (PWA) yang memungkinkan warga melaporkan kebocoran dalam < 1 menit.
- **Akurasi Tinggi**: Menggunakan GPS smartphone + pilihan manual di peta.
- **Bukti Valid**: Wajib foto real-time.
- **Zero Cost**: Menggunakan infrastruktur serverless graits (Cloudflare).

## 🛠️ Arsitektur Teknologi

Aplikasi ini dibangun dengan konsep **Modern Serverless**:
- **Frontend**: HTML5, CSS3, Vanilla JS (Tanpa framework berat).
- **Backend API**: Cloudflare Pages Functions (Serverless).
- **Database**: Cloudflare D1 (SQLite at the Edge).
- **Hosting**: Cloudflare Pages.

## 📖 Panduan Implementasi (Self-Hosting)

PDAM atau komunitas dapat menginstal aplikasi ini sendiri **GRATIS** selamanya menggunakan Free Tier Cloudflare.

### Persiapan
1.  Akun [Cloudflare](https://dash.cloudflare.com/sign-up) (Gratis).
2.  Install [Node.js](https://nodejs.org/).
3.  Terminal/Command Prompt.

### Langkah 1: Clone Repository
Download source code ke komputer Anda:

```bash
git clone https://github.com/ferli/si-kebocoran.git
cd si-kebocoran
```

### Langkah 2: Install Wrangler
Wrangler adalah tool manajemen Cloudflare.

```bash
npm install -g wrangler
wrangler login
# (Ikuti instruksi login di browser)
```

### Langkah 3: Setup Database
Buat database D1 baru di akun Cloudflare Anda:

```bash
wrangler d1 create si-kebocoran-db
```

**PENTING**: Copy `database_id` yang muncul dari perintah di atas, lalu buka file `wrangler.toml` dan update baris berikut:

```toml
[[d1_databases]]
binding = "DB"
database_name = "si-kebocoran-db"
database_id = "PASTE_ID_DISINI" # <--- Ganti dengan ID Anda
```

### Langkah 4: Buat Tabel (Migrasi)
Jalankan perintah ini untuk membuat struktur tabel di database:

```bash
wrangler d1 execute si-kebocoran-db --file=database/schema.sql --remote
```

### Langkah 5: Test Lokal
Coba jalankan aplikasi di komputer Anda:

```bash
wrangler pages dev src
# Buka http://localhost:8788 di browser
```

### Langkah 6: Deploy ke Internet 🚀
Jika sudah siap live:

```bash
wrangler pages deploy src --project-name laporan-pdam
```

Selamat! Aplikasi Anda sudah live di `https://laporan-pdam.pages.dev`.

## ⚙️ Kustomisasi
- **Logo & Judul**: Edit `src/index.html`.
- **Warna**: Edit `src/css/style.css` (Ganti variabel CSS root).
- **WhatsApp Notifikasi**: (Opsional) Uncomment fitur webhook di `functions/api/laporan.js` jika ingin menghubungkan ke WhatsApp Gateway.

## 🤝 Kontribusi
Project ini Open Source. Silakan fork dan kirim Pull Request jika ada perbaikan.

## 📄 Lisensi
MIT License - Bebas digunakan dan dimodifikasi untuk tujuan komersial maupun non-komersial oleh PDAM manapun.
