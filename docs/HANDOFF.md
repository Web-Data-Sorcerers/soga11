# SOGA 11 — Handoff Document

> **Tujuan dokumen ini:** supaya AI lain (atau developer) bisa lanjut kerja **tanpa kehilangan konteks**.
> Semua keputusan, kredensial, schema, dan progress ada di sini. Baca dari atas ke bawah.

---

## 1. Ringkasan Proyek

**Sorcery Gathering #11 (SOGA 11)** — website event untuk komunitas **Data Sorcerers Indonesia**.
Ini versi BARU yang dibangun **dari nol** (bukan fork dari SOGA 10). SOGA 10 cuma jadi referensi.

- **Tema desain:** "Light Magic Purple" — background terang (putih/lavender) + aksen ungu (#7c3aed) + glow halus.
  *(SOGA 10 = dark purple glassmorphism. SOGA 11 = kebalikannya: LIGHT.)*
- **Backend:** Supabase (PostgreSQL) — BUKAN Google Apps Script.
  Alasan: SOGA 10 pakai GAS dan **datanya bocor publik** (209 peserta kebuka tanpa auth). Supabase fix ini dengan RLS + auth.
- **Tech stack:** Vanilla HTML/CSS/JS (tanpa framework, tanpa build tool, tanpa obfuscation).

---

## 2. Status Pengerjaan (sekarang)

### ✅ Sudah selesai
| Bagian | Status |
|---|---|
| Supabase project `soga-11` dibuat | ✅ (region ap-southeast-1, free tier) |
| Schema `participants` + RLS + RPC | ✅ |
| Design system (light magic purple) | ✅ |
| Landing page (hero, stats, agenda, speakers, FAQ) | ✅ |
| Register + generate QR (Supabase-backed) | ✅ |
| Dashboard admin (login auth, tabel, scan QR check-in, CSV export) | ✅ |
| Certificate claim page | ✅ |

### ⚠️ Belum / perlu diisi (TODO untuk AI berikutnya)
1. **Isi konten event** — tanggal, tema, speaker, sponsor masih PLACEHOLDER.
   - `index.html` → `EVENT_DATE` di `js/app.js` (baris `const EVENT_DATE = ...`) masih `2026-12-31` placeholder.
   - `pages/home/home.html` → speaker masih "Speaker 1/2/3" placeholder.
   - `pages/home/home.html` → agenda masih placeholder.
2. **Buat akun admin** (belum ada user admin di Supabase Auth).
   - Buka Supabase Dashboard → Authentication → Users → **Add user** (email + password).
   - **Matikan public signup**: Authentication → Providers → Email → **disable "Allow new users to sign up"** (biar cuma admin yang bisa login).
3. **Gambar/logo** — belum ada logo/avatar/foto (pakai emoji placeholder ✦ 👤).
4. **Deploy** — belum di-deploy. Bisa deploy ke Vercel/Netlify (static site).
5. **Favicon & meta tags** (SEO/OG) — belum.

---

## 3. Kredensial Supabase

> ⚠️ `anon key` = PUBLIC (aman disimpan di frontend, memang untuk client).
> `service_role key` = RAHASIA (JANGAN taruh di frontend). Belum diambil, ada di Supabase Dashboard → Settings → API.

| Item | Nilai |
|---|---|
| Project ref / ID | `metnsgficvfvkmmksoua` |
| URL | `https://metnsgficvfvkmmksoua.supabase.co` |
| Anon key | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1ldG5zZ2ZpY3ZmdmttbWtzb3VhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkwNDMxMjksImV4cCI6MjEwNDYxOTEyOX0.mQvJN4az9P5llBqDnDWEQBYMkTODUKqC8_clsTkpjIY` |
| Region | `ap-southeast-1` (Singapore) |

Kredensial ini juga sudah di-hardcode di `js/config.js`.

---

## 4. Database Schema (PostgreSQL)

### Tabel `public.participants`
| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | uuid PK | auto (gen_random_uuid) |
| `qr_token` | text UNIQUE NOT NULL | ID tiket, format `SGN11-XXXXXX` |
| `full_name` | text NOT NULL | |
| `email` | text NOT NULL | |
| `whatsapp` | text NOT NULL | |
| `gender` | text NOT NULL | `L` / `P` |
| `institution` | text NOT NULL | |
| `job` | text NOT NULL | |
| `linkedin` | text (nullable) | |
| `github` | text (nullable) | |
| `level` | text NOT NULL | beginner/intermediate/expert |
| `focus` | text NOT NULL | |
| `tools` | text (nullable) | |
| `source` | text NOT NULL | |
| `expectation` | text NOT NULL | |
| `question` | text (nullable) | |
| `status` | text NOT NULL default `'pending'` | `pending` / `hadir` |
| `checkin_time` | timestamptz (nullable) | |
| `created_at` | timestamptz default now() | |

### Row Level Security (RLS)
- **anon (public):** hanya boleh `INSERT` (registrasi). Tidak bisa `SELECT`/`UPDATE`/`DELETE`.
- **authenticated (admin):** boleh `SELECT`/`UPDATE`/`DELETE`.

### RPC Functions
1. `claim_certificate(p_lookup text)` → balikin `(qr_token, full_name, status)` HANYA untuk peserta yang `status='hadir'`. Dipakai halaman certificate. (SECURITY DEFINER, tapi aman — cuma balikin field terbatas.)
2. `checkin_participant(p_qr_token text)` → update status jadi `hadir` + set checkin_time. **Hanya authenticated (admin)** — ada guard `auth.role() <> 'authenticated'` di dalamnya.

---

## 5. Struktur File

```
/home/faiz/soga-11/
├── index.html              → landing + register (hash routing: #home, #register)
├── dashboard.html          → admin (login auth + tabel + scan + CSV export)
├── certificate.html        → klaim sertifikat (PNG/PDF)
├── css/
│   ├── variables.css       → design tokens (light magic purple)
│   ├── global.css          → global styles + tombol + kartu + grid
│   ├── dashboard.css       → style dashboard
│   └── certificate.css     → style sertifikat
├── js/
│   ├── config.js           → kredensial Supabase
│   ├── api.js              → client Supabase + semua fungsi API (window.SOGA_API)
│   ├── app.js              → router + countdown + logika register & QR
│   ├── dashboard.js        → logika admin (auth, tabel, check-in, CSV)
│   └── certificate.js      → logika klaim sertifikat + download
├── pages/
│   ├── home/
│   │   ├── home.html       → konten landing (hero, agenda, speakers, FAQ)
│   │   └── home.css
│   └── register/
│       ├── register.html   → form registrasi
│       └── register.css
├── components/
│   ├── navbar/navbar.css   → style navbar (navbar inline di index.html)
│   └── footer/footer.css   → style footer (footer inline di index.html)
└── docs/
    └── HANDOFF.md          → dokumen ini
```

---

## 6. Arsitektur & Alur Data

```
User (browser)
  → index.html (SPA hash routing: #home / #register)
  → [register] isi form → generate qr_token "SGN11-XXXXXX" (client-side)
      → INSERT ke Supabase (table participants) via anon key
      → generate QR (qrcodejs) → tampilkan tiket
  → [dashboard] login admin (Supabase Auth: email+password)
      → SELECT participants (RLS: authenticated only)
      → check-in: scan QR / input ID → RPC checkin_participant
      → export CSV
  → [certificate] input ID/HP → RPC claim_certificate
      → render sertifikat → download PNG (html2canvas) / PDF (jspdf)
```

### Alur QR Code (penting)
1. QR **digenerate di browser** (library `qrcodejs`) — isinya string `SGN11-XXXXXX`.
2. Saat event, admin scan QR → dapet `SGN11-XXXXXX` → RPC `checkin_participant` → status jadi `hadir`.
3. Peserta klaim sertifikat pakai `SGN11-XXXXXX` (atau HP) → RPC `claim_certificate`.

### Library CDN yang dipakai
| Library | CDN | Dipakai di |
|---|---|---|
| `@supabase/supabase-js` v2 (UMD) | jsdelivr | semua halaman |
| `qrcodejs` 1.0.0 | cdnjs | register (generate QR) |
| `html5-qrcode` 2.3.8 | jsdelivr | dashboard (scan QR kamera) |
| `html2canvas` 1.4.1 | cdnjs | certificate (download PNG) |
| `jspdf` 2.5.1 | cdnjs | certificate (download PDF) |
| Google Fonts `Plus Jakarta Sans` | fonts.googleapis.com | semua halaman |

---

## 7. Cara Menjalankan

Proyek ini **static site** (vanilla), tapi pakai `fetch` buat routing → **harus lewat server lokal**, bukan `file://`.

```bash
cd /home/faiz/soga-11
python3 -m http.server 8091
# buka http://localhost:8091/
```

Halaman:
- `http://localhost:8091/` → landing + register (klik "Register Now" → #register)
- `http://localhost:8091/dashboard.html` → admin
- `http://localhost:8091/certificate.html` → klaim sertifikat

---

## 8. Keputusan Penting yang Sudah Diambil

1. **Backend = Supabase** (bukan GAS). Karena SOGA 10 (GAS) datanya bocor publik.
2. **Stack = Vanilla** (bukan React/Next). Karena event site simpel + tanpa build + gampang deploy.
3. **Desain = Light magic purple** (bukan dark). User minta "magic purple tapi white/light".
4. **QR = client-side** (qrcodejs), isinya `SGN11-XXXXXX` (bukan URL).
5. **Admin auth = Supabase Auth** (email+password), bukan PIN client-side.
6. **Data aman = RLS**: anon cuma INSERT, admin (authenticated) full access.

---

## 9. Referensi: SOGA 10 (repo lama)

Lokasi: `/home/faiz/clone/sorcery-gathering` (jangan di-edit, cuma referensi).

Hal yang diambil dari SOGA 10: struktur form registrasi (5 bagian), konsep QR tiket, konsep dashboard admin.
Hal yang DIBUANG dari SOGA 10: GAS backend, obfuscation, dark theme, PIN client-side.

---

## 10. Catatan Keamanan (biar nggak ngulangin kesalahan SOGA 10)

- ❌ Jangan pernah expose `service_role key` di frontend.
- ❌ Jangan bikin policy SELECT buat `anon` (itu yang bikin SOGA 10 bocor).
- ✅ Semua data peserta cuma bisa dibaca admin (authenticated).
- ✅ `claim_certificate` cuma balikin nama + status (bukan email/HP).
- ✅ Matikan public signup di Supabase Auth (biar cuma admin yang bisa login).
