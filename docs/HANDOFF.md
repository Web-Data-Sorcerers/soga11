# SOGA 11 — Handoff Document (UPDATED)

> **Tujuan:** biar AI/developer baru bisa lanjut kerja **tanpa kehilangan konteks**.
> Baca dari atas ke bawah. File pendamping: **`aturan.md`** (rules + log kesalahan) — WAJIB baca juga.
> Tanggal update terakhir: 12 September 2026.

---

## 1. Ringkasan Proyek

**Sorcery Gathering #11 (SOGA 11)** — website event komunitas **Data Sorcerers Indonesia**.
Versi BARU (bukan fork SOGA 10). SOGA 10 cuma referensi.

- **Tema desain:** "Light Magic Purple" — background terang (putih/lavender) + aksen ungu `#7c3aed` + glow halus. (Kebalikan SOGA 10 yang dark.)
- **Backend:** Supabase (PostgreSQL) — BUKAN Google Apps Script.
- **Tech stack:** Vanilla HTML/CSS/JS (tanpa framework, tanpa build tool).
- **Tanggal event:** Minggu, **25 Oktober 2026** (jam 09:00 WIB asumsi — bisa diubah).

---

## 2. Tech Stack (lengkap)

| Layer | Detail |
|---|---|
| Frontend | Vanilla HTML/CSS/JS, SPA pakai **hash routing** (`#home`, `#register`, `#find-ticket`). Routing pake `fetch()` |
| Backend | Supabase (PostgreSQL) + **Auth** (email/password) + **RLS** |
| Styling | CSS custom properties (`css/variables.css`), **tanpa** Tailwind/framework |

**Library CDN yang dipakai:**
| Library | CDN | Dipakai di |
|---|---|---|
| `@supabase/supabase-js` v2 (UMD) | jsdelivr | semua halaman |
| `qrcodejs` 1.0.0 | cdnjs | register + find-ticket (generate QR) |
| `html5-qrcode` 2.3.8 | jsdelivr | dashboard (scan QR kamera) |
| `chart.js` (latest) | jsdelivr | dashboard (chart analytics) |
| `html2canvas` 1.4.1 | cdnjs | certificate (download PNG) |
| `jspdf` 2.5.1 | cdnjs | certificate (download PDF) |
| Google Fonts `Plus Jakarta Sans` | fonts.googleapis.com | semua halaman |

---

## 3. CHECKPOINT — Semua yang SUDAH KELAR ✅

### Fungsional
- [x] Landing page (hero, stats, agenda, speakers, FAQ, countdown)
- [x] Register + generate QR (Supabase-backed, `qr_token` = `SGN11-XXXXXX` client-side)
- [x] Dashboard admin: login (Supabase Auth), stats, **chart** (doughnut + bar), check-in (manual + scan QR), tabel (search/filter), **detail/edit/hapus peserta** (modal), **export CSV**, **toggle buka/tutup pendaftaran**
- [x] Certificate claim page (lookup by qr_token/WA → PNG/PDF)
- [x] **Cari Tiket Saya** (recover QR by email/WA)
- [x] **Close registration** (toggle admin → register page nampil "ditutup")
- [x] **Event date** = 25 Okt 2026 (countdown + hero)
- [x] **Search dashboard** by email/whatsapp
- [x] **FAQ diperluas** — 6 pertanyaan (diambil dari SOGA 10, diadaptasi ke SOGA 11)
- [x] **Section "The Legacy"** — 16 kartu event SoGa #1–#9 (embed Instagram + shimmer loading + reveal-on-scroll)
- [x] **Footer diperkaya** — ekosistem asli, newsletter, legal links, social icon SVG (dari SOGA 10)

### Visual / Branding
- [x] Logo Data Sorcerers (dari SOGA 10) → favicon + navbar/footer/dashboard/sertifikat
- [x] Favicon + meta/OG tags (SEO) di 3 halaman
- [x] Semua emoji → ikon **SVG inline premium** (Lucide-style, `stroke="currentColor"`)
- [x] Konsolidasi CSS lintas halaman ke `global.css`
- [x] **Animasi** — reveal-on-scroll (semua section landing) + shimmer loading (embed Legacy)

### Keamanan (penting!)
- [x] RLS: anon **cuma INSERT**, admin (email-scoped) full access
- [x] RPC `checkin_participant` + `set_registration_open` = admin-only (guard email + revoke anon)
- [x] XSS: semua `innerHTML` di dashboard di-escape (`esc()`)
- [x] `service_role` key TIDAK pernah di frontend
- [x] Akun admin dibuat (`admin@data-sorcerers.com`)

---

## 4. Struktur File (current)

```
/home/faiz/soga-11/
├── index.html              → SPA (navbar + footer + router: #home, #register, #find-ticket)
├── dashboard.html          → admin (login + stats + chart + check-in + tabel + modal + toggle)
├── certificate.html        → klaim sertifikat (PNG/PDF)
├── css/
│   ├── variables.css       → design tokens (light magic purple)
│   ├── global.css          → global + shared components (badge, form, alert, btn-large, stats, navbar-brand, .ico, .brand-logo)
│   ├── dashboard.css       → dashboard + modal + chart + setting-row
│   └── certificate.css     → sertifikat
├── js/
│   ├── config.js           → kredensial Supabase (window.SOGA_CONFIG)
│   ├── api.js              → client Supabase + semua fungsi API (window.SOGA_API)
│   ├── app.js              → router + countdown + register + find-ticket + EVENT_DATE
│   ├── dashboard.js        → auth, data, chart, check-in, modal edit/delete, CSV, toggle reg
│   └── certificate.js      → klaim + download sertifikat
├── pages/
│   ├── home/home.html+css  → landing (hero, agenda, speakers, FAQ)
│   ├── register/register.html+css → form registrasi + success QR + closed state
│   ├── find-ticket/find-ticket.html+css → recover QR (NEW)
│   └── certificate/        → (kosong)
├── components/
│   ├── navbar/navbar.css
│   └── footer/footer.css
├── assets/                 → logo.png, logo-web.png, favicon.png/.ico, apple-touch-icon.png, og-image.png
├── docs/HANDOFF.md         → dokumen ini
└── aturan.md               → RULES + log kesalahan (WAJIB baca)
```

---

## 5. Database Schema (current)

### Tabel `public.participants`
| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | uuid PK | auto `gen_random_uuid()` |
| `qr_token` | text UNIQUE NOT NULL | `SGN11-XXXXXX` |
| `full_name` | text NOT NULL | |
| `email` | text NOT NULL | (belum UNIQUE — lihat Next Steps) |
| `whatsapp` | text NOT NULL | (belum UNIQUE) |
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
| `created_at` | timestamptz default `now()` | |

### Tabel `public.settings` (NEW — buat close registration)
| Kolom | Tipe |
|---|---|
| `key` | text PK |
| `value` | text NOT NULL |

Seed: `registration_open = 'true'`. RLS **enabled tanpa policy** (akses cuma lewat RPC SECURITY DEFINER).

### RPC Functions
| Function | Return | Akses | Keterangan |
|---|---|---|---|
| `claim_certificate(p_lookup)` | `(qr_token, full_name, status)` | **public** | HANYA peserta `status='hadir'`. Lookup by qr_token/WA |
| `find_ticket(p_lookup)` | `(qr_token, full_name)` | **public** | Lookup by email (case-insensitive) / WA. SEMUA status |
| `is_registration_open()` | `boolean` | **public** | Baca flag `registration_open` |
| `checkin_participant(p_qr_token)` | `void` | **admin-only** | Set status `hadir` + checkin_time. Guard email + revoke anon |
| `set_registration_open(p_open)` | `void` | **admin-only** | Toggle flag. Guard email + revoke anon |

> Semua RPC = `SECURITY DEFINER` + `SET search_path TO 'public'`.

### Row Level Security (RLS) — `participants`
- `public_can_register`: **INSERT**, `check = true` (anon boleh daftar).
- `admin_select` / `admin_update` / `admin_delete`: `auth.jwt() ->> 'email' = 'admin@data-sorcerers.com'`.

> ⚠️ Email admin di-hardcode di RLS + RPC. Kalau ganti email admin, WAJIB update keduanya.

---

## 6. Kredensial Supabase

| Item | Nilai |
|---|---|
| Project ref / ID | `metnsgficvfvkmmksoua` |
| URL | `https://metnsgficvfvkmmksoua.supabase.co` |
| Region | `ap-southeast-1` (Singapore) |
| Anon key | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1ldG5zZ2ZpY3ZmdmttbWtzb3VhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkwNDMxMjksImV4cCI6MjEwNDYxOTEyOX0.mQvJN4az9P5llBqDnDWEQBYMkTODUKqC8_clsTkpjIY` |
| **Email admin** | `admin@data-sorcerers.com` |
| **Password admin** | `[REMOVED: managed outside repository]` |
| service_role key | ❌ BELUM diambil (RAHASIA — jangan taruh frontend) |

Kredensial anon juga di-hardcode di `js/config.js`.

---

## 7. Arsitektur & Alur Data

```
User (browser)
  → index.html (SPA hash routing: #home / #register / #find-ticket)
  → [register] isi form → generate qr_token "SGN11-XXXXXX" (client-side)
      → INSERT ke participants via anon key (TANPA .select()!)
      → generate QR (qrcodejs) → tampilkan tiket
  → [find-ticket] input email/WA → RPC find_ticket → tampilkan ulang QR
  → [dashboard] login admin (Supabase Auth)
      → SELECT participants (RLS: email admin)
      → check-in: scan QR / input ID → RPC checkin_participant
      → detail/edit/hapus (modal) → update/delete via RLS
      → export CSV
      → toggle pendaftaran → RPC set_registration_open
  → [certificate] input ID/HP → RPC claim_certificate
      → render sertifikat → download PNG (html2canvas) / PDF (jspdf)
```

**Alur QR (penting):** QR digenerate di **browser** (isinya string `SGN11-XXXXXX`). Admin scan → dapet token → check-in. Peserta recover via find_ticket / klaim sertifikat via token atau WA.

---

## 8. Model Keamanan (jangan dilanggar!)

- ❌ Jangan expose `service_role` key di frontend.
- ❌ Jangan bikin policy SELECT buat `anon` (itu penyebab SOGA 10 bocor).
- ✅ anon cuma boleh INSERT peserta.
- ✅ Semua data peserta cuma dibaca admin (email-scoped).
- ✅ `claim_certificate` / `find_ticket` cuma balikin field terbatas (nama + token).
- ✅ Semua `innerHTML` pakai `esc()` (XSS-safe).
- ✅ **Public signup DIMATIKAN** (12 Sep 2026, Management API `disable_signup=true`); signup anon → `422 signup_disabled`, login admin normal.
- ⚠️ Leaked Password Protection **belum** (Pro Plan only, Free plan 402) → lihat Next Steps.

---

## 9. Git History (checkpoints)

```
08b4372 chore: bump cache version to v2
996de6e feat: find my ticket (recover QR by email/WA)
2f924d7 feat: close registration toggle
3a921a4 feat: dashboard search by email/whatsapp
0f2a20e feat: set event date to 25 Oct 2026
7ec2a19 docs: record checkin_participant EXECUTE revocation
50eebaa fix: guard renderCharts against Chart.js load failure
74b1c41 feat: add chart analytics (conversion + arrival time)
38c787d chore: cache-bust local assets with ?v=1
f5e2bdf fix: register - drop .select() on anon insert
da78cca feat: participant detail modal + edit/delete actions
43f03a6 docs: add aturan.md (project rules + error log)
e27d105 feat: countdown fallback and check-in status icons
14366a7 refactor: consolidate shared CSS into global.css and style icons
674856c feat: branding - favicon, SEO/OG meta, logo, and SVG icons
932c794 assets: add Data Sorcerers logo, favicon, and og-image
b627b95 feat: initial SOGA 11 project scaffold
ceec867 chore: add .gitignore
```

Branch: `master`. **Komit per-fitur** (user prefer commit terpisah tiap fitur/file).

---

## 10. Referensi: SOGA 10 (repo lama)

Lokasi: `/home/faiz/clone/sorcery-gathering/` (jangan di-edit, cuma referensi).

**Yang DIAMBIL dari SOGA 10:**
- Logo mark: `assets/images/logo_mark V2 (1).png` → udah di-copy ke SOGA 11.
- Konsep: struktur form registrasi (5 bagian), QR tiket, dashboard admin ("Command Center").

**Yang DIBUANG dari SOGA 10:**
- GAS backend (data bocor publik), obfuscation (JS di-obfuscate), dark theme, PIN client-side.

**Catatan SOGA 10:** dashboard admin-nya ("Command Center") punya fitur kaya (5 tab: overview + chart gauge, scanner, database, broadcast center WA, settings). SOGA 11 baru punya sebagian (chart ✅, check-in ✅, database ✅). Yang belum: **broadcast center** + **rundown/speaker readiness** (lihat Next Steps).

---

## 11. Cara Menjalankan

Static site, tapi pakai `fetch` untuk routing → **harus lewat server lokal** (bukan `file://`).

```bash
cd /home/faiz/soga-11
python3 -m http.server 8091
# buka http://localhost:8091/
```

- `http://localhost:8091/` → landing + register + find-ticket
- `http://localhost:8091/#register` → registrasi
- `http://localhost:8091/#find-ticket` → recover QR
- `http://localhost:8091/dashboard.html` → admin
- `http://localhost:8091/certificate.html` → klaim sertifikat

> ⚠️ **Cache-busting:** local asset pakai `?v=2`. Tiap edit JS/CSS, bump versinya (atau hard refresh `Ctrl+Shift+R`).

---

## 12. NEXT STEPS / Roadmap (yang BELUM kelar)

### Prioritas tinggi (sebelum deploy)
1. **Isi konten event** — butuh data dari user: speaker (masih "To Be Announced"), agenda final, venue detail, link sosmed/ekosistem/legal (masih `#`). `EVENT_DATE` ✅, FAQ ✅, Legacy ✅, Footer ✅ (semua dari SOGA 10).
2. **Deploy** — belum. Ke Vercel/Netlify (static site). Setelah deploy, update `og:image` ke URL absolut (sekarang masih relative `assets/og-image.png`).
3. ~~Matikan public signup~~ ✅ **DONE (12 Sep 2026)** via Management API `disable_signup=true` (`metnsgficvfvkmmksoua`). Sisa: **Leaked Password Protection** — **butuh Pro Plan** (Free plan ditolak 402). Opsional Free-plan: naikkan `password_min_length` (sekarang 6).

### Fitur (deferred / butuh keputusan)
4. **Double registration prevention** — email/WA belum UNIQUE. User minta di-defer, plan nanti.
5. **Broadcast center** (kirim WA massal) — butuh provider WA API (Fonnte/WATI/Twilio) + Supabase Edge Function. Paling kompleks.
6. **Rundown + Speaker Readiness** — frontend-only, butuh data speaker/agenda.
7. **Email/WA konfirmasi otomatis** setelah daftar — butuh service email/WA.

### Minor (opsional)
8. RLS `auth_rls_initplan` micro-opt (wrap `auth.jwt()` di `(select ...)`) — negligible di skala ini.
9. `og-image.png` belum diverifikasi visual (model nggak bisa lihat gambar).

---

## 13. RULES → baca `aturan.md`

`aturan.md` berisi:
- Supabase project yang dipakai = `soga-11` (`metnsgficvfvkmmksoua`). **JANGAN sentuh project `jelajah`.**
- Log kesalahan (query pg_policy, generated columns auth.users, bug register RLS).
- Keamanan & admin (email admin di-hardcode, RPC revoke).

**Aturan umum:** tiap ada kesalahan baru → TAMBAH ke `aturan.md`.
