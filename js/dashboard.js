// ============================================================
// SOGA 11 — Dashboard Admin Logic
// ============================================================
let participants = [];
let scanner = null;

const ICON_CHECK = '<svg class="ico" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg>';
const ICON_X = '<svg class="ico" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/></svg>';
const ICON_EYE = '<svg class="ico" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>';
const ICON_PENCIL = '<svg class="ico" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z"/><path d="m15 5 4 4"/></svg>';
const ICON_TRASH = '<svg class="ico" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>';

const esc = (s) =>
  String(s ?? "").replace(
    /[&<>"']/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])
  );

// ============================================================
// Auth
// ============================================================
async function boot() {
  const user = await window.SOGA_API.getCurrentAdmin();
  if (user) {
    showDashboard(user);
  } else {
    document.getElementById("login-screen").classList.remove("hidden");
  }
}

function showDashboard(user) {
  document.getElementById("login-screen").classList.add("hidden");
  document.getElementById("dashboard").classList.remove("hidden");
  document.getElementById("admin-name").textContent = user.email;
  loadParticipants();
}

document.getElementById("login-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = document.getElementById("login-email").value.trim();
  const password = document.getElementById("login-password").value;
  const err = document.getElementById("login-error");
  err.classList.add("hidden");
  try {
    const { user } = await window.SOGA_API.signInAdmin(email, password);
    showDashboard(user);
  } catch (e) {
    err.classList.remove("hidden");
  }
});

document.getElementById("btn-logout").addEventListener("click", async () => {
  await window.SOGA_API.signOutAdmin();
  location.reload();
});

// ============================================================
// Data
// ============================================================
async function loadParticipants() {
  try {
    participants = await window.SOGA_API.getParticipants();
    renderStats();
    renderTable();
  } catch (e) {
    document.getElementById("table-body").innerHTML =
      `<tr><td colspan="7" class="text-center">Gagal memuat data.</td></tr>`;
  }
}

function renderStats() {
  const total = participants.length;
  const present = participants.filter((p) => p.status === "hadir").length;
  const conversion = total ? Math.round((present / total) * 100) : 0;
  document.getElementById("stat-total").textContent = total;
  document.getElementById("stat-present").textContent = present;
  document.getElementById("stat-conversion").textContent = conversion + "%";
}

function renderTable(filter = "all", query = "") {
  const body = document.getElementById("table-body");
  let list = participants;

  if (filter !== "all") list = list.filter((p) => p.status === filter);
  if (query) {
    const q = query.toLowerCase();
    list = list.filter(
      (p) =>
        p.full_name?.toLowerCase().includes(q) ||
        p.qr_token?.toLowerCase().includes(q) ||
        p.institution?.toLowerCase().includes(q)
    );
  }

  if (!list.length) {
    body.innerHTML = `<tr><td colspan="7" class="text-center">Tidak ada data.</td></tr>`;
    return;
  }

  body.innerHTML = list
    .map(
      (p) => `
      <tr>
        <td>${esc(p.qr_token)}</td>
        <td><strong>${esc(p.full_name)}</strong></td>
        <td>${esc(p.institution)}</td>
        <td>${esc(p.whatsapp)}</td>
        <td><span class="badge ${p.status === "hadir" ? "badge-hadir" : "badge-pending"}">${esc(p.status)}</span></td>
        <td>${p.checkin_time ? new Date(p.checkin_time).toLocaleTimeString("id-ID") : "-"}</td>
        <td class="row-actions">
          <button class="act-btn" data-action="view" data-id="${esc(p.id)}" title="Detail">${ICON_EYE}</button>
          <button class="act-btn" data-action="edit" data-id="${esc(p.id)}" title="Edit">${ICON_PENCIL}</button>
          <button class="act-btn act-btn-danger" data-action="delete" data-id="${esc(p.id)}" title="Hapus">${ICON_TRASH}</button>
        </td>
      </tr>`
    )
    .join("");
}

// ============================================================
// Detail / Edit / Hapus peserta
// ============================================================
const FIELD_LABELS = {
  qr_token: "ID Tiket",
  full_name: "Nama Lengkap",
  email: "Email",
  whatsapp: "WhatsApp",
  gender: "Jenis Kelamin",
  institution: "Instansi / Perguruan Tinggi",
  job: "Pekerjaan / Jabatan",
  linkedin: "LinkedIn",
  github: "GitHub / Portfolio",
  level: "Level Keahlian",
  focus: "Bidang Minat",
  tools: "Tools / Framework",
  source: "Sumber Info",
  expectation: "Ekspektasi",
  question: "Pertanyaan",
  status: "Status",
  checkin_time: "Waktu Check-in",
  created_at: "Terdaftar",
};

const DETAIL_FIELDS = [
  "qr_token", "full_name", "email", "whatsapp", "gender",
  "institution", "job", "linkedin", "github", "level",
  "focus", "tools", "source", "expectation", "question",
  "status", "checkin_time", "created_at",
];

const EDITABLE_FIELDS = [
  "full_name", "gender", "institution", "job", "linkedin", "github",
  "level", "focus", "tools", "source", "expectation", "question", "status",
];

const SELECT_OPTIONS = {
  gender: { L: "Laki-laki", P: "Perempuan" },
  level: { beginner: "Beginner", intermediate: "Intermediate", expert: "Expert" },
  status: { pending: "Pending", hadir: "Hadir" },
};

const TEXTAREA_FIELDS = new Set(["expectation", "question"]);

function findParticipant(id) {
  return participants.find((p) => p.id === id);
}

document.getElementById("table-body").addEventListener("click", (e) => {
  const btn = e.target.closest("[data-action]");
  if (!btn) return;
  const p = findParticipant(btn.dataset.id);
  if (!p) return;
  if (btn.dataset.action === "view") openModal("view", p);
  else if (btn.dataset.action === "edit") openModal("edit", p);
  else if (btn.dataset.action === "delete") confirmDelete(p);
});

function openModal(mode, p) {
  const title = document.getElementById("modal-title");
  const body = document.getElementById("modal-body");
  const footer = document.getElementById("modal-footer");

  if (mode === "view") {
    title.textContent = "Detail Peserta";
    body.innerHTML = renderDetail(p);
    footer.innerHTML = `
      <button class="btn btn-secondary" id="modal-edit-btn">Edit</button>
      <button class="btn btn-ghost" id="modal-close-btn">Tutup</button>`;
    document.getElementById("modal-edit-btn").addEventListener("click", () => openModal("edit", p));
    document.getElementById("modal-close-btn").addEventListener("click", closeModal);
  } else {
    title.textContent = "Edit Peserta";
    body.innerHTML = renderEditForm(p);
    footer.innerHTML = `
      <button class="btn btn-ghost" id="modal-cancel-btn">Batal</button>
      <button class="btn btn-primary" id="modal-save-btn">Simpan</button>`;
    document.getElementById("modal-cancel-btn").addEventListener("click", () => openModal("view", p));
    document.getElementById("modal-save-btn").addEventListener("click", () => saveEdit(p));
  }

  document.getElementById("participant-modal").classList.remove("hidden");
}

function closeModal() {
  document.getElementById("participant-modal").classList.add("hidden");
}

function formatValue(f, v) {
  if (v == null || v === "") return "-";
  if (f === "checkin_time" || f === "created_at") return new Date(v).toLocaleString("id-ID");
  const opts = SELECT_OPTIONS[f];
  if (opts && opts[v]) return opts[v];
  return v;
}

function renderDetail(p) {
  const rows = DETAIL_FIELDS.map((f) => {
    const full = f === "expectation" || f === "question";
    return `<div class="detail-item ${full ? "detail-full" : ""}">
      <span class="d-label">${esc(FIELD_LABELS[f] || f)}</span>
      <span class="d-value">${esc(formatValue(f, p[f]))}</span>
    </div>`;
  }).join("");
  return `<div class="detail-grid">${rows}</div>`;
}

function renderEditForm(p) {
  const controls = EDITABLE_FIELDS.map((f) => {
    const label = FIELD_LABELS[f];
    const val = p[f] ?? "";
    const opts = SELECT_OPTIONS[f];
    const full = opts || TEXTAREA_FIELDS.has(f);
    let input;
    if (opts) {
      input = `<select id="edit-${f}" data-field="${f}">` +
        Object.entries(opts)
          .map(([v, l]) => `<option value="${esc(v)}" ${v === val ? "selected" : ""}>${esc(l)}</option>`)
          .join("") +
        `</select>`;
    } else if (TEXTAREA_FIELDS.has(f)) {
      input = `<textarea id="edit-${f}" data-field="${f}" rows="2">${esc(val)}</textarea>`;
    } else {
      input = `<input type="text" id="edit-${f}" data-field="${f}" value="${esc(val)}" />`;
    }
    return `<div class="form-group ${full ? "detail-full" : ""}"><label>${esc(label)}</label>${input}</div>`;
  }).join("");
  return `<div class="form-row">${controls}</div>`;
}

async function saveEdit(p) {
  const updates = {};
  EDITABLE_FIELDS.forEach((f) => {
    const el = document.querySelector(`[data-field="${f}"]`);
    if (el) updates[f] = el.value.trim();
  });

  if (updates.status === "hadir" && !p.checkin_time) {
    updates.checkin_time = new Date().toISOString();
  } else if (updates.status !== "hadir" && p.status === "hadir") {
    updates.checkin_time = null;
  }

  const saveBtn = document.getElementById("modal-save-btn");
  saveBtn.disabled = true;
  try {
    await window.SOGA_API.updateParticipant(p.id, updates);
    closeModal();
    await loadParticipants();
  } catch (e) {
    alert("Gagal menyimpan: " + (e.message || "terjadi kesalahan"));
    saveBtn.disabled = false;
  }
}

function confirmDelete(p) {
  const ok = confirm(`Hapus peserta "${p.full_name}" (${p.qr_token})? Tindakan ini tidak bisa dibatalkan.`);
  if (!ok) return;
  window.SOGA_API.deleteParticipant(p.id)
    .then(() => loadParticipants())
    .catch((e) => alert("Gagal menghapus: " + (e.message || "terjadi kesalahan")));
}

document.getElementById("btn-modal-close").addEventListener("click", closeModal);
document.getElementById("participant-modal").addEventListener("click", (e) => {
  if (e.target === e.currentTarget) closeModal();
});

document.getElementById("search-input").addEventListener("input", (e) => {
  renderTable(document.getElementById("filter-status").value, e.target.value);
});
document.getElementById("filter-status").addEventListener("change", (e) => {
  renderTable(e.target.value, document.getElementById("search-input").value);
});
document.getElementById("btn-refresh").addEventListener("click", loadParticipants);

// ============================================================
// Check-in
// ============================================================
async function doCheckin(token) {
  const status = document.getElementById("checkin-status");
  token = token.trim().toUpperCase();
  if (!token.startsWith("SGN11-")) {
    status.textContent = "Format ID salah. Contoh: SGN11-ABC123";
    status.className = "submit-status";
    return;
  }
  try {
    await window.SOGA_API.checkInParticipant(token);
    status.innerHTML = ICON_CHECK;
    status.appendChild(document.createTextNode(" " + token + " berhasil check-in!"));
    status.className = "submit-status ok";
    document.getElementById("checkin-input").value = "";
    await loadParticipants();
  } catch (e) {
    status.innerHTML = ICON_X;
    status.appendChild(document.createTextNode(" " + (e.message || "gagal check-in (mungkin sudah hadir / ID tidak ditemukan)")));
    status.className = "submit-status err";
  }
}

document.getElementById("btn-checkin").addEventListener("click", () => {
  doCheckin(document.getElementById("checkin-input").value);
});
document.getElementById("checkin-input").addEventListener("keypress", (e) => {
  if (e.key === "Enter") doCheckin(e.target.value);
});

// QR scanner (html5-qrcode)
document.getElementById("btn-scan-toggle").addEventListener("click", () => {
  const box = document.getElementById("scanner-box");
  if (box.classList.contains("hidden")) {
    box.classList.remove("hidden");
    if (!scanner) {
      scanner = new Html5Qrcode("scanner-box");
      scanner.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: 250 },
        (text) => {
          doCheckin(text);
          stopScanner();
        }
      ).catch((e) => (document.getElementById("checkin-status").textContent = "Kamera tidak tersedia"));
    }
  } else {
    stopScanner();
  }
});

function stopScanner() {
  const box = document.getElementById("scanner-box");
  box.classList.add("hidden");
  if (scanner) {
    scanner.stop().then(() => scanner.clear()).catch(() => {});
    scanner = null;
  }
}

// ============================================================
// Export CSV (bisa dibuka di Excel)
// ============================================================
document.getElementById("btn-export").addEventListener("click", () => {
  const headers = [
    "qr_token", "full_name", "email", "whatsapp", "gender",
    "institution", "job", "linkedin", "github", "level",
    "focus", "tools", "source", "expectation", "question",
    "status", "checkin_time", "created_at",
  ];
  const rows = participants.map((p) =>
    headers.map((h) => {
      const v = p[h] ?? "";
      const s = typeof v === "string" ? v : JSON.stringify(v);
      return '"' + s.replace(/"/g, '""') + '"';
    }).join(",")
  );
  const csv = [headers.join(","), ...rows].join("\n");
  const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "soga11_peserta.csv";
  a.click();
  URL.revokeObjectURL(a.href);
});

// ============================================================
boot();
