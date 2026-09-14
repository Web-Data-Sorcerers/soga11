// ============================================================
// SOGA 11 — API Layer (Supabase)
// Semua interaksi dengan database lewat sini.
// ============================================================
(function () {
  const { SUPABASE_URL, SUPABASE_ANON_KEY } = window.SOGA_CONFIG;

  // Buat client Supabase (dari UMD build yang di-load di index.html)
  const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  /**
   * Daftarkan peserta baru.
   * @param {object} data - data formulir registrasi
   * @returns {Promise<object>} - hasil insert (data atau error)
   */
  async function registerParticipant(data) {
    const { error } = await supabase
      .from("participants")
      .insert([data]);
    if (error) throw error;
  }

  /**
   * Menghasilkan variasi format lookup (telepon, email, token)
   * agar pencarian fleksibel terhadap data baru (+62...) maupun data lama (8... / 08...).
   * @param {string} lookup
   * @returns {string[]}
   */
  function buildLookupCandidates(lookup) {
    const raw = String(lookup || "").trim();
    if (!raw) return [];

    // Jika format email
    if (raw.includes("@")) {
      return [raw.toLowerCase(), raw];
    }

    // Jika format Ticket ID (misal SGN11-XXXXXX)
    if (/^sgn11-/i.test(raw)) {
      return [raw.toUpperCase(), raw];
    }

    // Cek apakah input berupa digit nomor telepon
    const digits = raw.replace(/\D/g, "");
    if (digits.length >= 8 && digits.length <= 16) {
      let sub = digits;
      if (sub.startsWith("62")) {
        sub = sub.slice(2);
      } else if (sub.startsWith("0")) {
        sub = sub.slice(1);
      }
      sub = sub.replace(/^0+/, "");

      if (sub) {
        return [
          "+62" + sub, // Format standar internasional
          sub,         // Format raw lokal (legacy database)
          "0" + sub,   // Format 08...
          "62" + sub,  // Format 62...
          raw          // Input asli
        ].filter((val, idx, self) => self.indexOf(val) === idx);
      }
    }

    return [raw];
  }

  /**
   * Klaim sertifikat — lookup by qr_token / whatsapp / email.
   * Hanya balikin nama + status (bukan PII lengkap).
   * @param {string} lookup - ID (SGN11-XXX), nomor HP, atau email
   */
  async function claimCertificate(lookup) {
    const candidates = buildLookupCandidates(lookup);
    let lastError = null;

    for (const candidate of candidates) {
      try {
        const { data, error } = await supabase.rpc("claim_certificate", {
          p_lookup: candidate,
        });
        if (error) {
          lastError = error;
          continue;
        }
        if (data && data.length > 0) {
          return data[0];
        }
      } catch (err) {
        lastError = err;
      }
    }

    if (lastError && candidates.length === 1) throw lastError;
    return null;
  }

  async function isRegistrationOpen() {
    const { data, error } = await supabase.rpc("is_registration_open");
    if (error) throw error;
    return data === true;
  }

  async function findTicket(lookup) {
    const candidates = buildLookupCandidates(lookup);
    let lastError = null;

    for (const candidate of candidates) {
      try {
        const { data, error } = await supabase.rpc("find_ticket", {
          p_lookup: candidate,
        });
        if (error) {
          lastError = error;
          continue;
        }
        if (data && data.length > 0) {
          return data[0];
        }
      } catch (err) {
        lastError = err;
      }
    }

    if (lastError && candidates.length === 1) throw lastError;
    return null;
  }

  // ============ Admin (butuh login) ============

  async function signInAdmin(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    return data;
  }

  async function signOutAdmin() {
    await supabase.auth.signOut();
  }

  async function getCurrentAdmin() {
    const { data } = await supabase.auth.getSession();
    return data?.session?.user ?? null;
  }

  async function getParticipants() {
    const { data, error } = await supabase
      .from("participants")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data;
  }

  async function checkInParticipant(qrToken) {
    const { error } = await supabase.rpc("checkin_participant", {
      p_qr_token: qrToken,
    });
    if (error) throw error;
  }

  async function updateParticipant(id, updates) {
    const { data, error } = await supabase
      .from("participants")
      .update(updates)
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async function deleteParticipant(id) {
    const { error } = await supabase
      .from("participants")
      .delete()
      .eq("id", id);
    if (error) throw error;
  }

  async function setRegistrationOpen(open) {
    const { error } = await supabase.rpc("set_registration_open", {
      p_open: open,
    });
    if (error) throw error;
  }

  // Expose API
  window.SOGA_API = {
    supabase,
    registerParticipant,
    claimCertificate,
    findTicket,
    signInAdmin,
    signOutAdmin,
    getCurrentAdmin,
    getParticipants,
    checkInParticipant,
    updateParticipant,
    deleteParticipant,
    isRegistrationOpen,
    setRegistrationOpen,
  };
})();
