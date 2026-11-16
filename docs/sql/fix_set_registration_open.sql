-- ============================================================
-- SOGA 11: Perbaikan Izin Mutasi Status Registrasi (set_registration_open)
-- Lokasi: docs/sql/fix_set_registration_open.sql
-- Petunjuk: Jalankan skrip ini di Supabase Dashboard -> SQL Editor
-- ============================================================

-- 1. Buat atau perbarui stored procedure set_registration_open
--    Memastikan hanya user yang terotentikasi (admin) yang dapat mengubah status registrasi.
CREATE OR REPLACE FUNCTION public.set_registration_open(p_open boolean)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Pastikan pemanggil adalah akun admin yang sedang login (authenticated)
  IF auth.role() <> 'authenticated' THEN
    RAISE EXCEPTION 'Unauthorized: admin only';
  END IF;

  -- Update atau insert nilai registration_open ke dalam tabel settings
  INSERT INTO public.settings (key, value)
  VALUES ('registration_open', p_open::text)
  ON CONFLICT (key) DO UPDATE
  SET value = EXCLUDED.value;
END;
$$;

-- 2. Atur hak akses eksekusi:
--    - authenticated: Diberikan izin eksekusi (Admin yang sudah login di Command Center)
--    - anon & public: Dicabut izinnya agar publik / bot tidak dapat mengubah status
GRANT EXECUTE ON FUNCTION public.set_registration_open(boolean) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.set_registration_open(boolean) FROM anon, public;

-- 3. Pastikan fungsi pembacaan status registrasi (is_registration_open) dapat diakses publik
CREATE OR REPLACE FUNCTION public.is_registration_open()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_val text;
BEGIN
  SELECT value INTO v_val FROM public.settings WHERE key = 'registration_open';
  IF v_val IS NULL THEN
    RETURN true; -- Default terbuka jika row belum diinisialisasi
  END IF;
  RETURN lower(trim(v_val)) = 'true';
END;
$$;

GRANT EXECUTE ON FUNCTION public.is_registration_open() TO anon, authenticated;
