# SOGA 11 — Sorcery Gathering #11

Dokumentasi resmi arsitektur sistem, basis data, panduan pengembangan lokal, dan operasional situs web Sorcery Gathering #11.

---

## 1. Panduan Cepat Menjalankan Aplikasi (Quick Start)

Aplikasi ini mengusung arsitektur web murni tanpa ketergantungan pada bundler Node.js yang rumit. Anda tidak perlu menjalankan `npm install`. Cukup gunakan web server statis lokal sederhana untuk menjalankan aplikasi.

### 1.1. Prasyarat Sistem
* Peramban web modern (Google Chrome, Mozilla Firefox, Microsoft Edge, atau Apple Safari).
* Python 3 atau Node.js yang terpasang di sistem operasi Anda.

### 1.2. Cara Menjalankan Kode Sumber (Mode Development)

1. Buka terminal dan arahkan ke direktori proyek:
   ```bash
   cd /home/faiz/soga-11
   ```

2. Jalankan server lokal:

   *Menggunakan Python 3 (Direkomendasikan):*
   ```bash
   python3 -m http.server 8080
   ```

   *Atau menggunakan Node.js:*
   ```bash
   npx serve -l 8080 .
   ```

3. Buka peramban dan akses alamat berikut:
   * **Portal Publik (Landing, Pendaftaran, Cek Tiket)**: `http://localhost:8080/index.html`
   * **Admin Command Center (Presensi, Registri, Statistik)**: `http://localhost:8080/dashboard.html`
   * **Portal Sertifikat**: `http://localhost:8080/certificate.html`

### 1.3. Cara Menjalankan Versi Rilis Produksi (`dist/`)

Untuk menguji build rilis yang identik dengan server produksi Vercel:

1. Eksekusi skrip kompilasi rilis:
   ```bash
   ./scripts/build-release.sh
   ```

2. Jalankan server lokal langsung dari folder distribusi `dist/`:
   ```bash
   python3 -m http.server 8080 --directory dist
   ```

---

## 2. Konteks dan Identitas Proyek

SOGA 11 (Sorcery Gathering #11) adalah situs web resmi untuk konferensi teknologi komunitas yang diselenggarakan oleh **Data Sorcerers Indonesia**. Platform ini mencakup landing page publik, sistem pendaftaran peserta satu halaman, portal pencarian tiket mandiri, sistem klaim sertifikat kehadiran, serta Command Center operasional admin untuk manajemen presensi pada hari pelaksanaan.

### Informasi Kunci Acara

| Parameter | Detail |
|---|---|
| Penyelenggara | Data Sorcerers Indonesia |
| Tanggal Pelaksanaan | Minggu, 25 Oktober 2026 |
| Target Waktu Mulai | 08:00 WIB (Check-in dan pembukaan) |
| Lokasi | Yogyakarta, Indonesia |
| Format Acara | 100% Offline (Tatap Muka) |
| Tema Acara | "Orkestrasi Kecerdasan untuk Masa Depan Nusantara" |
| Bahasa Antarmuka | Bahasa Indonesia (Formal & Editorial) |
| URL Produksi | https://soga11.vercel.app/ |

---

## 3. Arsitektur dan Tech Stack

Sistem ini dibangun dengan pendekatan **Vanilla Web Architecture (Zero-Bundler)**. Keputusan arsitektur ini diambil untuk menjamin performa render maksimal, latensi nol, kesederhanaan pemeliharaan, serta kemandirian dari ekosistem dependensi Node.js yang berlebihan.

### Tabel Komponen Teknologi

| Lapisan | Teknologi / Pustaka | Keterangan |
|---|---|---|
| Bahasa Inti | HTML5, CSS3, JavaScript (ES6+ Native) | Standar web modern tanpa transpiler |
| Routing Publik | URL Hash Routing (`window.location.hash`) | Menangani navigasi SPA tanpa reload halaman |
| Backend & Database | Supabase (PostgreSQL 15+) | Database relasional, Auth, RLS, dan RPC Stored Procedures |
| Visualisasi Data | Chart.js v4 (via CDN) | Donut chart rasio presensi dan bar chart kedatangan per jam |
| QR Code Scanner | Html5Qrcode v2.3.8 (via CDN) | Pemindaian tiket via kamera smartphone/webcam di pintu masuk |
| QR Code Generator | QRCode.js v1.0.0 (via CDN) | Pembangkit gambar QR code tiket peserta secara dinamis |
| Tipografi | Plus Jakarta Sans & JetBrains Mono | Font utama antarmuka dan teks monospace teknis |
| Sistem Kompilasi | POSIX Shell Script (`scripts/build-release.sh`) | Kompilasi rilis deterministik berbasis manifest allowlist |
| Infrastruktur Hosting | Vercel Static Deployment | Distribusi aset statis terisolasi dari folder `dist/` |

---

## 4. Struktur Direktori Repositori

```text
/home/faiz/soga-11/
├── index.html                   # Shell aplikasi publik dan template tiket bersama
├── dashboard.html               # Entry point Admin: Login dan Command Center
├── certificate.html             # Entry point portal klaim dan verifikasi sertifikat
├── terms.html                   # Ketentuan partisipasi resmi (Bilingual)
├── privacy.html                 # Kebijakan privasi dan perlindungan data peserta
├── vercel.json                  # Konfigurasi build dan output direktori Vercel
├── release-manifest.txt         # Allowlist resmi berkas runtime yang diizinkan masuk rilis
│
├── css/                         # Berkas stylesheet global dan modular
│   ├── variables.css            # Token desain: warna, tipografi, radius, dan elevasi
│   ├── global.css               # Reset CSS, utilitas, tombol, form, dan kartu global
│   ├── dashboard.css            # Desain Command Center admin dan slide-over drawer
│   ├── certificate.css          # Desain tata letak sertifikat dan mode cetak/PDF
│   └── legal.css                # Desain tipografi editorial halaman legal
│
├── js/                          # Logika pemrograman sisi klien
│   ├── config.js                # Konfigurasi endpoint Supabase dan Anon Key publik
│   ├── api.js                   # Lapisan API perantara ke Supabase Client
│   ├── app.js                   # Router hash SPA publik, form registrasi, dan tiket
│   ├── dashboard.js             # Logika Command Center, presensi, tabel, chart, drawer
│   └── certificate.js           # Logika validasi dan rendering sertifikat
│
├── pages/                       # Fragmen halaman HTML yang dimuat dinamis oleh router
│   ├── home/                    # Fragmen beranda (Hero, Agenda, Speakers, Legacy, FAQ)
│   ├── register/                # Fragmen formulir registrasi peserta terintegrasi
│   └── find-ticket/             # Fragmen pencarian tiket mandiri peserta
│
├── components/                  # Modul komponen antarmuka yang dapat digunakan ulang
│   ├── navbar/                  # Navigasi sticky publik desktop dan mobile
│   └── footer/                  # Footer institusional Data Sorcerers
│
├── assets/                      # Aset statis teroptimasi (WebP & PNG)
│   ├── logo-web.png             # Logo resmi Data Sorcerers
│   ├── favicon.png              # Ikon browser
│   ├── hero/                    # Grafis header (siluet monumen, tipografi 11)
│   ├── agenda/                  # Etching visual agenda (Prambanan)
│   └── legacy/                  # Dokumentasi poster arsip SOGA edisi 01 s.d. 10
│
├── scripts/                     # Perkakas automasi operasional
│   └── build-release.sh         # Script verifikasi allowlist dan kompilasi folder dist/
│
└── dist/                        # Direktori rilis yang disajikan langsung ke web server
```

---

## 5. Alur Kerja Modul Aplikasi

Aplikasi terbagi menjadi tiga modul utama yang melayani segmen pengguna berbeda:

### 5.1. Portal Publik (`index.html`)
* **Arsitektur Hash Routing**: Navigasi menggunakan URL hash (`#home`, `#agenda`, `#speakers`, `#legacy`, `#faq`, `#register`, `#find-ticket`). Skrip `js/app.js` memuat fragmen HTML terkait dari folder `pages/` ke dalam kontainer `#app-root` menggunakan cache memori internal untuk transisi instan (0 milidetik).
* **Formulir Registrasi (`#register`)**: Formulir komprehensif yang mengumpulkan identitas, preferensi bidang minat, level keahlian data, tautan profil (LinkedIn/GitHub), serta pertanyaan untuk pembicara. Setelah data tervalidasi dan berhasil disimpan di Supabase, sistem langsung menampilkan kartu tiket digital peserta lengkap dengan QR code.
* **Portal Pencarian Tiket (`#find-ticket`)**: Memungkinkan peserta yang telah terdaftar mencari tiket mereka kembali menggunakan nomor WhatsApp atau kode tiket `SGN11-XXXXXX`.
* **Section The Legacy**: Menampilkan arsip sejarah SOGA dari edisi 10 hingga edisi 01. Untuk menjaga efisiensi rendering, 10 edisi terdahulu dikelompokkan ke dalam arsip yang dapat dibuka-tutup (*expandable archive*) dengan akselerasi GPU.

### 5.2. Admin Command Center (`dashboard.html`)
* **Autentikasi Mandiri**: Akses login admin menggunakan Supabase Auth dengan antarmuka split-screen modern dan fitur intip password.
* **Bento Stat Cards**: Empat metrik utama yang menyajikan ringkasan real-time: Total Peserta, Jumlah Hadir, Jumlah Belum Hadir, dan Sakelar Buka/Tutup Pendaftaran.
* **Sistem Tab Navigasi**:
  1. *Daftar Peserta*: Tabel berdensitas tinggi dengan avatar inisial, pencarian multikolom, filter status, tombol salin tiket 1-klik, dan ekspor CSV format Excel.
  2. *Check-in & Scan QR*: Meja presensi ganda yang mendukung input manual kode tiket serta pemindaian instan via kamera webcam/smartphone.
  3. *Statistik & Analisis*: Diagram lingkaran rasio kehadiran dan diagram batang waktu kedatangan per jam berbasis Chart.js.
  4. *Pengaturan & Info*: Pengendali gerbang registrasi publik dan metadata teknis sistem.
* **Slide-over Drawer ("Detail Tiket")**: Panel samping yang muncul saat admin memilih salah satu peserta. Menampilkan pratinjau kartu tiket kredensial ber-QR asli, biodata terperinci dengan pintasan langsung chat WhatsApp, serta tombol aksi cepat untuk menandai kehadiran peserta.

### 5.3. Portal Sertifikat (`certificate.html`)
Portal untuk validasi kehadiran pasca-acara. Peserta memasukkan nomor WhatsApp atau kode tiket; sistem memverifikasi bahwa status peserta adalah `hadir`, lalu merender sertifikat resmi bernomor seri unik yang siap dicetak atau disimpan sebagai PDF.

---

## 6. Integrasi Basis Data dan Backend (Supabase)

Backend sistem berjalan di atas platform **Supabase** (PostgreSQL berkinerja tinggi). Seluruh komunikasi data dilakukan melalui pustaka resmi `@supabase/supabase-js` yang diabstraksikan di dalam berkas `js/api.js`.

### 6.1. File Konfigurasi (`js/config.js`)
Berkas ini memuat kredensial publik Supabase:
```javascript
window.SOGA_CONFIG = {
  SUPABASE_URL: "https://<project-id>.supabase.co",
  SUPABASE_ANON_KEY: "<public-anon-key>",
};
```
*Catatan Keamanan*: `SUPABASE_ANON_KEY` adalah kunci publik yang aman disertakan di sisi klien karena seluruh izin baca/tulis data dikontrol ketat oleh kebijakan **Row Level Security (RLS)** di level database PostgreSQL. Jangan pernah menyertakan `service_role` key pada kode front-end.

### 6.2. Skema Tabel Utama

#### Tabel `participants`
Menyimpan seluruh data pendaftaran peserta:
* `id` (UUID, Primary Key): Pengidentifikasi unik baris data.
* `qr_token` (Text, Unique): Format `SGN11-XXXXXX`. Digunakan sebagai kode tiket dan string data pada QR Code.
* `full_name` (Text): Nama lengkap peserta.
* `email` (Text): Alamat surat elektronik peserta.
* `whatsapp` (Text): Nomor WhatsApp aktif untuk verifikasi dan kontak.
* `gender` (Text): Jenis kelamin (`L` atau `P`).
* `institution` (Text): Asal instansi, perusahaan, atau universitas.
* `job` (Text): Pekerjaan, profesi, atau jabatan.
* `linkedin` (Text, Nullable): URL profil LinkedIn.
* `github` (Text, Nullable): URL repositori atau portfolio teknis.
* `level` (Text): Tingkat keahlian (`beginner`, `intermediate`, `expert`).
* `focus` (Text): Bidang minat utama (Data Science, Data Engineering, AI/ML, BI).
* `tools` (Text): Perangkat lunak atau framework yang dikuasai.
* `source` (Text): Kanal informasi tempat peserta mengetahui SOGA 11.
* `expectation` (Text, Nullable): Harapan peserta mengikuti konferensi.
* `question` (Text, Nullable): Pertanyaan terkurasi untuk narasumber.
* `status` (Text): Status kehadiran (`pending` atau `hadir`). Nilai bawaan adalah `pending`.
* `checkin_time` (Timestamp with Time Zone, Nullable): Waktu peserta melakukan check-in di lokasi.
* `created_at` (Timestamp with Time Zone): Waktu pendaftaran pertama kali dibuat.

### 6.3. Fungsi Tersimpan (Stored Procedures / RPC)
Untuk menjaga keamanan data pribadi (PII) dari ekspos publik yang tidak disengaja, pencarian tiket dan klaim sertifikat menggunakan stored procedure PostgreSQL:

1. `rpc/find_ticket(p_lookup)`:
   Mencari data pendaftar berdasarkan `qr_token` atau nomor `whatsapp`. Mengembalikan objek tiket ringkas tanpa membuka data kontak lengkap ke pihak lain.
2. `rpc/claim_certificate(p_lookup)`:
   Memverifikasi bahwa pendaftar berstatus `hadir`. Jika valid, mengembalikan nama peserta dan status verifikasi untuk pencetakan sertifikat.
3. `rpc/is_registration_open()`:
   Memeriksa apakah kuota pendaftaran publik di tabel pengaturan masih aktif (`true`) atau telah ditutup (`false`).
4. `rpc/checkin_participant(p_qr_token)`:
   Prosedur operasional yang mengubah status tiket dari `pending` menjadi `hadir` dan membubuhkan timestamp server `NOW()` ke kolom `checkin_time`.

---

## 7. Mekanisme Kompilasi Release dan Deployment

Repositori ini menerapkan standar build deterministik berbasis allowlist. Hal ini memastikan hanya berkas yang secara eksplisit disetujui yang dapat dipublikasikan ke server production, mencegah kebocoran berkas dokumentasi internal, skrip pengujian, berkas arsip zip, atau konfigurasi lokal.

### 7.1. Berkas Manifest (`release-manifest.txt`)
Berkas teks baris-per-baris di root repositori yang mendaftarkan seluruh file runtime yang sah (saat ini berjumlah 56 berkas).

### 7.2. Menjalankan Kompilasi Rilis Lokal
Sebelum melakukan push atau untuk menguji keabsahan struktur distribusi:
```bash
./scripts/build-release.sh
```
Skrip akan melakukan tahapan:
1. Membaca dan memvalidasi setiap path di dalam `release-manifest.txt`.
2. Menolak tautan simbolik (*symlink*) dan path tidak aman.
3. Menyalin berkas ke direktori sementara (*staging area*).
4. Menghapus folder `dist/` lama dan menggantinya secara atomik dengan hasil staging yang bersih.

Untuk menguji hasil kompilasi folder `dist/`:
```bash
python3 -m http.server 8080 --directory dist
```

### 7.3. Alur Deployment Vercel
Deployment ke platform Vercel telah terkonfigurasi secara otomatis melalui `vercel.json`:
```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "buildCommand": "./scripts/build-release.sh",
  "outputDirectory": "dist"
}
```
Setiap kali ada commit baru yang di-push ke cabang utama GitHub (`master`), Vercel akan mengeksekusi `./scripts/build-release.sh` dan menyajikan isi direktori `dist/` ke Content Delivery Network (CDN) global.

---

## 8. Konvensi Pengembangan dan Pedoman Kontribusi

Bagi pengembang atau tim lain yang akan melanjutkan pengembangan repositori ini, aturan berikut bersifat wajib dipatuhi:

1. **Mempertahankan Vanilla Architecture**:
   Dilarang memigrasi atau membungkus aplikasi ini ke dalam framework seperti React, Next.js, Vue, Nuxt, Svelte, atau Tailwind CSS tanpa persetujuan arsitektur tertulis.
2. **Integritas Navigasi Hash**:
   Mekanisme navigasi publik wajib mempertahankan URL hash routing (`#home`, `#register`, dsb.) agar kompatibilitas hosting statis murni tetap terjaga.
3. **Penyelarasan Cabang Git**:
   Repositori memiliki dua cabang aktif: `master` (cabang produksi utama) dan `experiment/redesign`. Setiap perubahan pada `master` wajib digabungkan (*fast-forward merge*) ke `experiment/redesign` agar kedua cabang selalu berada dalam status sinkron.
4. **Keamanan Kredensial**:
   Dilarang keras melakukan commit atau mencatat kata sandi admin, secret token, atau Supabase Service Role key ke dalam basis kode maupun pesan commit git.
5. **Pembaruan Manifest Rilis**:
   Jika Anda menambahkan berkas aset, halaman, stylesheet, atau skrip baru yang dibutuhkan pada saat runtime, Anda wajib mendaftarkan path relatif berkas tersebut ke dalam `release-manifest.txt` agar berkas tersebut diikutsertakan oleh `./scripts/build-release.sh`.

---

## 9. Kontak dan Layanan Bantuan

Untuk koordinasi teknis, pelaporan kendala basis data, atau pertanyaan seputar operasional konferensi:
* **Penyelenggara**: Data Sorcerers Indonesia
* **Email Resmi**: contact@data-sorcerers.com
* **Alamat Operasional Acara**: Yogyakarta, Daerah Istimewa Yogyakarta, Indonesia
