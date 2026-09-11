# ATURAN — SOGA 11

> Catatan aturan & pelajaran yang harus diikuti selama ngerjain project ini.
> **JANGAN dihapus.** Kalau ada aturan baru atau kesalahan baru, TAMBAH di file ini.

---

## 1. Supabase: project yang benar

| Project | Ref | Status |
|---|---|---|
| **soga-11** (INI YANG DIPAKAI) | `metnsgficvfvkmmksoua` | ACTIVE_HEALTHY |
| jelajah | `vzohtezrdhselrommvcm` | INACTIVE |

- ⚠️ **JANGAN pernah sentuh project `jelajah`** (`vzohtezrdhselrommvcm`).
- Semua operasi database (SQL, migration, auth) HANYA ke project **`soga-11`** = `metnsgficvfvkmmksoua`.
- URL: `https://metnsgficvfvkmmksoua.supabase.co`
- **Akses via MCP** `supabase-jelajah` (nama MCP misleading — token-nya **account-wide**, nyakup `soga-11` + `jelajah`).
- Token `SUPABASE_ACCESS_TOKEN` ada di **`~/.config/opencode/opencode.json`** (config GLOBAL opencode, BUKAN di repo). Jangan copy token ke file repo.

---

## 2. Log Kesalahan (diisi tiap kali ada error)

> Format: tanggal — apa kesalahannya — solusi/aturan biar nggak keulang.

### 2026-09-11 — Query RLS policy gagal (kolom salah)
- **Kesalahan:** `select ... from pg_policy where schemaname='public' ...` → error `column "schemaname" does not exist`.
- **Penyebab:** tabel `pg_policy` **tidak punya** kolom `schemaname` / `tablename`.
- **Solusi:** filter tabel pakai `polrelid = 'public.participants'::regclass`.
  Kolom `pg_policy` yang valid: `polname`, `polcmd`, `polpermissive`, `polroles`, `polqual`, `polwithcheck`.
  Contoh yang benar:
  ```sql
  select polname, polcmd, polpermissive,
         pg_get_expr(polqual, polrelid)      as using_expr,
         pg_get_expr(polwithcheck, polrelid) as check_expr
  from pg_policy
  where polrelid = 'public.participants'::regclass;
  ```

### 2026-09-11 — Insert admin ke auth.users/identities gagal (generated column)
- **Kesalahan 1:** `insert into auth.users (...) values (... confirmed_at ...)` → error `cannot insert a non-DEFAULT value into column "confirmed_at"` (generated column).
- **Kesalahan 2:** `insert into auth.identities (... email ...)` → error `cannot insert a non-DEFAULT value into column "email"` (generated column).
- **Solusi:** JANGAN insert kolom **generated** ini:
  - `auth.users.confirmed_at` → auto-generated.
  - `auth.identities.email` → auto-generated dari `identity_data->>'email'`.
  Kolom `auth.users` yang AMAN di-insert manual: `instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, recovery_token, email_change, email_change_token_new, email_change_token_current, email_change_confirm_status, is_super_admin, is_sso_user, is_anonymous`.

### 2026-09-11 — Registrasi gagal: "new row violates row-level security policy"
- **Kesalahan:** `registerParticipant` di `js/api.js` pakai `.insert([data]).select().single()` → jadi `INSERT ... RETURNING *`.
- **Penyebab:** `.select()` (RETURNING) butuh policy SELECT, tapi role `anon` TIDAK punya policy SELECT (by design cuma INSERT via `public_can_register`). Error: `new row violates row-level security policy for table "participants"`.
- **Solusi:** JANGAN pakai `.select()` pada INSERT untuk role anon. Cukup `.insert([data])` tanpa RETURNING. (Register nggak butuh return value — qr_token digenerate client-side.)

### 2026-09-12 — PATCH Management API 402 (HIBP Pro-only) bikin SEMUA field ikut gagal
- **Kesalahan:** PATCH config Auth dengan `{"disable_signup":true,"password_hibp_enabled":true}` → HTTP **402**, pesan `"Configuring leaked password protection via HaveIBeenPwned.org is available on Pro Plans and up."` Akibatnya `disable_signup` IKUT gagal (PATCH bersifat atomic).
- **Solusi:** JANGAN gabung `password_hibp_enabled` dengan field lain — kirim `disable_signup` sendiri. Di Free plan, HIBP memang tidak bisa diaktifkan lewat API; cukup andalkan `disable_signup=true` + RLS admin-only.
- **Verifikasi sukses:** `disable_signup=true` → signup anon balik `422 signup_disabled`; login admin tetap `200`.

---

## 3. Keamanan & Admin

- **Email admin:** `admin@data-sorcerers.com` — SUDAH di-hardcode di RLS policy + RPC `checkin_participant`.
- **Password admin:** diberikan langsung ke user. **JANGAN commit ke repo / tulis di file.**
- **RLS di-hardened:** policy `admin_select/update/delete` sekarang cek `auth.jwt() ->> 'email' = 'admin@data-sorcerers.com'` (BUKAN cuma `authenticated`). Jadi walaupun public signup masih NYALA, user random nggak bisa baca data.
- ✅ **Public signup DIMATIKAN** (12 Sep 2026) via Management API: `PATCH https://api.supabase.com/v1/projects/metnsgficvfvkmmksoua/config/auth` body `{"disable_signup":true}`. Terverifikasi: signup via anon key balik `422 signup_disabled`; login admin normal.
- ⚠️ **Leaked Password Protection (`password_hibp_enabled`) = Pro Plan only** (Free plan → HTTP 402). Belum aktif; alternatif yang tersedia: `password_min_length` dinaikkan.
- 🔑 **Management API**: pakai Personal Access Token (`sbp_...`) HANYA lewat env shell, JANGAN tulis/commit ke repo. Revoke setelah dipakai.
- Kalau email admin diganti → WAJIB update RLS policy + RPC `checkin_participant` juga.
- RPC `checkin_participant`: EXECUTE sudah di-`revoke` dari `public`/`anon` → hanya `authenticated` + `service_role` yang bisa panggil. (`claim_certificate` TETAP public, by design — cuma balikin nama/status peserta yang sudah hadir.)
