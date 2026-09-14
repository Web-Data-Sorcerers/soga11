-- ============================================================
-- SOGA 11: Normalisasi Nomor WhatsApp & Pembaruan RPC
-- Lokasi: docs/sql/normalize_phone_and_rpc.sql
-- Petunjuk: Buka Supabase Dashboard -> SQL Editor -> Tempel dan jalankan skrip ini.
-- ============================================================

-- 1. Normalisasi data nomor WhatsApp yang sudah ada di tabel participants
--    Mengubah nomor yang belum berawalan '+62' menjadi format standar E.164 (+628...)
UPDATE participants
SET whatsapp = '+62' || regexp_replace(regexp_replace(trim(whatsapp), '^\+?62', ''), '^0+', '')
WHERE whatsapp IS NOT NULL
  AND trim(whatsapp) != ''
  AND NOT (whatsapp ~ '^\+62');

-- 2. Perbarui Stored Procedure find_ticket(p_lookup)
--    Mendukung pencarian via:
--    - Email (case-insensitive)
--    - Ticket ID / qr_token (case-insensitive)
--    - Nomor WhatsApp dalam berbagai variasi format (08..., +628..., 628..., atau digit murni)
CREATE OR REPLACE FUNCTION find_ticket(p_lookup text)
RETURNS TABLE (qr_token text, full_name text)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_lookup text := trim(p_lookup);
  v_phone_digits text;
  v_phone_sub text;
BEGIN
  -- Bersihkan karakter non-digit untuk deteksi nomor HP
  v_phone_digits := regexp_replace(v_lookup, '\D', '', 'g');

  IF length(v_phone_digits) >= 8 AND length(v_phone_digits) <= 16 THEN
    v_phone_sub := v_phone_digits;
    IF v_phone_sub ~ '^62' THEN
      v_phone_sub := substr(v_phone_sub, 3);
    ELSIF v_phone_sub ~ '^0' THEN
      v_phone_sub := substr(v_phone_sub, 2);
    END IF;
    v_phone_sub := regexp_replace(v_phone_sub, '^0+', '');
  ELSE
    v_phone_sub := '';
  END IF;

  RETURN QUERY
  SELECT p.qr_token, p.full_name
  FROM participants p
  WHERE lower(trim(p.email)) = lower(v_lookup)
     OR upper(trim(p.qr_token)) = upper(v_lookup)
     OR p.whatsapp = v_lookup
     OR (v_phone_sub <> '' AND regexp_replace(p.whatsapp, '\D', '', 'g') LIKE '%' || v_phone_sub)
  LIMIT 1;
END;
$$;

-- 3. Perbarui Stored Procedure claim_certificate(p_lookup)
--    Mendukung verifikasi tiket dengan fleksibilitas yang sama untuk peserta yang telah hadir
CREATE OR REPLACE FUNCTION claim_certificate(p_lookup text)
RETURNS TABLE (qr_token text, full_name text, status text)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_lookup text := trim(p_lookup);
  v_phone_digits text;
  v_phone_sub text;
BEGIN
  v_phone_digits := regexp_replace(v_lookup, '\D', '', 'g');

  IF length(v_phone_digits) >= 8 AND length(v_phone_digits) <= 16 THEN
    v_phone_sub := v_phone_digits;
    IF v_phone_sub ~ '^62' THEN
      v_phone_sub := substr(v_phone_sub, 3);
    ELSIF v_phone_sub ~ '^0' THEN
      v_phone_sub := substr(v_phone_sub, 2);
    END IF;
    v_phone_sub := regexp_replace(v_phone_sub, '^0+', '');
  ELSE
    v_phone_sub := '';
  END IF;

  RETURN QUERY
  SELECT p.qr_token, p.full_name, p.status
  FROM participants p
  WHERE p.status = 'hadir'
    AND (
      lower(trim(p.email)) = lower(v_lookup)
      OR upper(trim(p.qr_token)) = upper(v_lookup)
      OR p.whatsapp = v_lookup
      OR (v_phone_sub <> '' AND regexp_replace(p.whatsapp, '\D', '', 'g') LIKE '%' || v_phone_sub)
    )
  LIMIT 1;
END;
$$;
