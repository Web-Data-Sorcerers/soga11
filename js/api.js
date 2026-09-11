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
    const { data: row, error } = await supabase
      .from("participants")
      .insert([data])
      .select()
      .single();
    if (error) throw error;
    return row;
  }

  /**
   * Klaim sertifikat — lookup by qr_token / whatsapp.
   * Hanya balikin nama + status (bukan PII lengkap).
   * @param {string} lookup - ID (SGN11-XXX) atau nomor HP
   */
  async function claimCertificate(lookup) {
    const { data, error } = await supabase.rpc("claim_certificate", {
      p_lookup: lookup,
    });
    if (error) throw error;
    return data && data.length ? data[0] : null;
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

  // Expose API
  window.SOGA_API = {
    supabase,
    registerParticipant,
    claimCertificate,
    signInAdmin,
    signOutAdmin,
    getCurrentAdmin,
    getParticipants,
    checkInParticipant,
    updateParticipant,
    deleteParticipant,
  };
})();
