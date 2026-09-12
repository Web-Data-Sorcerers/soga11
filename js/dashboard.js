// ============================================================
// SOGA 11 — Dashboard Admin Logic
// ============================================================
let participants = [];
let scanner = null;
let conversionChart = null;
let arrivalChart = null;
let registrationOpen = true;

const ICON_CHECK = '<svg class="ico" aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg>';
const ICON_X = '<svg class="ico" aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/></svg>';
const ICON_WARNING = '<svg class="ico" aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 8v4"/><path d="M12 16h.01"/></svg>';
const ICON_EYE = '<svg class="ico" aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>';
const ICON_PENCIL = '<svg class="ico" aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z"/><path d="m15 5 4 4"/></svg>';
const ICON_TRASH = '<svg class="ico" aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>';

const esc = (s) =>
  String(s ?? "").replace(
    /[&<>"']/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])
  );

// ============================================================
// Auth
// ============================================================
const loginForm = document.getElementById("login-form");
const loginEmail = document.getElementById("login-email");
const loginPassword = document.getElementById("login-password");
const loginButton = document.getElementById("btn-login");
const loginButtonLabel = document.getElementById("login-submit-label");
const loginError = document.getElementById("login-error");
const loginStatus = document.getElementById("login-status");
let loginSubmitting = false;

async function boot() {
  try {
    const user = await window.SOGA_API.getCurrentAdmin();
    if (user) {
      showDashboard(user);
      return;
    }
  } catch (e) {
    // Keep the normalized login surface available if session restoration fails.
  }

  document.getElementById("dashboard").classList.add("hidden");
  document.getElementById("login-screen").classList.remove("hidden");
}

function clearLoginError() {
  loginError.classList.add("hidden");
  loginEmail.removeAttribute("aria-invalid");
  loginPassword.removeAttribute("aria-invalid");
}

function setLoginPending(pending) {
  loginSubmitting = pending;
  loginButton.disabled = pending;
  if (pending) {
    loginButton.setAttribute("aria-busy", "true");
    loginForm.setAttribute("aria-busy", "true");
  } else {
    loginButton.removeAttribute("aria-busy");
    loginForm.removeAttribute("aria-busy");
  }
  loginEmail.readOnly = pending;
  loginPassword.readOnly = pending;
  loginButtonLabel.textContent = pending ? "Login / Verifying" : "Masuk";
  loginStatus.textContent = pending ? "Memverifikasi akun admin…" : "";
}

function showLoginError() {
  loginEmail.setAttribute("aria-invalid", "true");
  loginPassword.setAttribute("aria-invalid", "true");
  loginError.classList.remove("hidden");
  loginError.focus();
}

function showDashboard(user) {
  const adminName = document.getElementById("admin-name");
  document.getElementById("login-screen").classList.add("hidden");
  document.getElementById("dashboard").classList.remove("hidden");
  adminName.textContent = user.email;
  adminName.title = user.email;
  loadParticipants();
  loadRegistrationStatus();
}

loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  if (loginSubmitting) return;

  const email = loginEmail.value.trim();
  const password = loginPassword.value;
  clearLoginError();
  setLoginPending(true);

  try {
    const { user } = await window.SOGA_API.signInAdmin(email, password);
    showDashboard(user);
  } catch (e) {
    showLoginError();
  } finally {
    setLoginPending(false);
  }
});

[loginEmail, loginPassword].forEach((field) => {
  field.addEventListener("input", clearLoginError);
});

document.getElementById("btn-logout").addEventListener("click", async (event) => {
  const button = event.currentTarget;
  if (button.disabled) return;
  button.disabled = true;
  button.setAttribute("aria-busy", "true");

  try {
    await window.SOGA_API.signOutAdmin();
    location.reload();
  } catch (e) {
    button.disabled = false;
    button.removeAttribute("aria-busy");
  }
});

// ============================================================
// Data
// ============================================================
async function loadParticipants() {
  try {
    participants = await window.SOGA_API.getParticipants();
    renderStats();
    renderTable();
    renderCharts();
  } catch (e) {
    document.getElementById("table-body").innerHTML =
      `<tr class="registry-empty-row"><td colspan="7" data-cell="empty" class="text-center">Gagal memuat data.</td></tr>`;
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

function renderCharts() {
  if (typeof Chart === "undefined") return;
  const hadir = participants.filter((p) => p.status === "hadir").length;
  const pending = participants.length - hadir;
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const sharedChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    animation: reducedMotion ? false : { duration: 240 },
    color: "#746b80",
    font: { family: '"Plus Jakarta Sans", system-ui, sans-serif' },
  };

  const convCanvas = document.getElementById("chart-conversion");
  if (convCanvas) {
    if (conversionChart) conversionChart.destroy();
    conversionChart = new Chart(convCanvas, {
      type: "doughnut",
      data: {
        labels: ["Hadir", "Belum Hadir"],
        datasets: [{ data: [hadir, pending], backgroundColor: ["#15803d", "#ddd7e5"], borderWidth: 0 }],
      },
      options: {
        ...sharedChartOptions,
        cutout: "68%",
        plugins: {
          legend: {
            position: "bottom",
            labels: { boxWidth: 10, boxHeight: 10, padding: 16, usePointStyle: true },
          },
        },
      },
    });
  }

  const hourCounts = new Array(24).fill(0);
  participants.forEach((p) => {
    if (p.checkin_time) hourCounts[new Date(p.checkin_time).getHours()]++;
  });

  const arrCanvas = document.getElementById("chart-arrival");
  if (arrCanvas) {
    if (arrivalChart) arrivalChart.destroy();
    arrivalChart = new Chart(arrCanvas, {
      type: "bar",
      data: {
        labels: hourCounts.map((_, i) => String(i).padStart(2, "0") + ":00"),
        datasets: [{ label: "Check-in", data: hourCounts, backgroundColor: "#7c3aed", borderRadius: 4 }],
      },
      options: {
        ...sharedChartOptions,
        plugins: { legend: { display: false } },
        scales: {
          x: { grid: { display: false }, ticks: { maxTicksLimit: 8, color: "#746b80" } },
          y: {
            beginAtZero: true,
            border: { display: false },
            grid: { color: "rgba(199, 189, 210, 0.38)" },
            ticks: { precision: 0, color: "#746b80" },
          },
        },
      },
    });
  }
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
        p.institution?.toLowerCase().includes(q) ||
        p.email?.toLowerCase().includes(q) ||
        p.whatsapp?.toLowerCase().includes(q)
    );
  }

  if (!list.length) {
    body.innerHTML = `<tr class="registry-empty-row"><td colspan="7" data-cell="empty" class="text-center">Tidak ada data.</td></tr>`;
    return;
  }

  body.innerHTML = list
    .map(
      (p) => `
      <tr class="participant-record">
        <td data-label="Ticket ID" data-cell="ticket">${esc(p.qr_token)}</td>
        <td data-label="Nama" data-cell="name"><strong>${esc(p.full_name)}</strong></td>
        <td data-label="Instansi" data-cell="institution">${esc(p.institution)}</td>
        <td data-label="WhatsApp" data-cell="whatsapp">${esc(p.whatsapp)}</td>
        <td data-label="Status" data-cell="status"><span class="badge ${p.status === "hadir" ? "badge-hadir" : "badge-pending"}">${esc(p.status)}</span></td>
        <td data-label="Check-in" data-cell="checkin">${p.checkin_time ? new Date(p.checkin_time).toLocaleTimeString("id-ID") : "-"}</td>
        <td class="row-actions" data-label="Aksi" data-cell="actions">
          <button type="button" class="act-btn" data-action="view" data-id="${esc(p.id)}" title="Detail" aria-label="Lihat detail ${esc(p.full_name)}">${ICON_EYE}<span class="act-label">Lihat</span></button>
          <button type="button" class="act-btn" data-action="edit" data-id="${esc(p.id)}" title="Edit" aria-label="Edit ${esc(p.full_name)}">${ICON_PENCIL}<span class="act-label">Edit</span></button>
          <button type="button" class="act-btn act-btn-danger" data-action="delete" data-id="${esc(p.id)}" title="Hapus" aria-label="Hapus ${esc(p.full_name)}">${ICON_TRASH}<span class="act-label">Hapus</span></button>
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
const participantModal = document.getElementById("participant-modal");
const participantModalCard = participantModal.querySelector(".modal-card");
const modalDescription = document.getElementById("modal-description");
const modalStatus = document.getElementById("modal-status");
const dashboardRoot = document.getElementById("dashboard");
const MODAL_FOCUSABLE = [
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "[href]",
  '[tabindex]:not([tabindex="-1"])',
].join(",");
let modalReturnFocus = null;
let modalBusy = false;

function findParticipant(id) {
  return participants.find((p) => p.id === id);
}

document.getElementById("table-body").addEventListener("click", (e) => {
  const btn = e.target.closest("[data-action]");
  if (!btn) return;
  const p = findParticipant(btn.dataset.id);
  if (!p) return;
  modalReturnFocus = btn;
  if (btn.dataset.action === "view") openModal("view", p);
  else if (btn.dataset.action === "edit") openModal("edit", p);
  else if (btn.dataset.action === "delete") openModal("delete", p);
});

function openModal(mode, p) {
  const title = document.getElementById("modal-title");
  const body = document.getElementById("modal-body");
  const footer = document.getElementById("modal-footer");
  let initialFocusSelector = "#btn-modal-close";

  modalBusy = false;
  participantModal.removeAttribute("aria-busy");
  participantModal.dataset.mode = mode;
  document.getElementById("btn-modal-close").disabled = false;
  setModalStatus("", "");

  if (mode === "view") {
    title.textContent = "Detail Peserta";
    modalDescription.textContent = `Data pendaftaran ${p.full_name}.`;
    body.innerHTML = renderDetail(p);
    footer.innerHTML = `
      <button type="button" class="btn btn-secondary" id="modal-edit-btn">Edit Peserta</button>
      <button type="button" class="btn btn-ghost" id="modal-close-btn">Tutup</button>`;
    document.getElementById("modal-edit-btn").addEventListener("click", () => openModal("edit", p));
    document.getElementById("modal-close-btn").addEventListener("click", closeModal);
  } else if (mode === "edit") {
    title.textContent = "Edit Peserta";
    modalDescription.textContent = `Perbarui data yang diizinkan untuk ${p.full_name}.`;
    body.innerHTML = renderEditForm(p);
    footer.innerHTML = `
      <button type="button" class="btn btn-ghost" id="modal-cancel-btn">Batal</button>
      <button type="button" class="btn btn-primary" id="modal-save-btn">Simpan Perubahan</button>`;
    document.getElementById("modal-cancel-btn").addEventListener("click", () => openModal("view", p));
    document.getElementById("modal-save-btn").addEventListener("click", () => saveEdit(p));
    initialFocusSelector = "[data-field]";
  } else {
    title.textContent = "Hapus Peserta?";
    modalDescription.textContent = "Konfirmasi tindakan penghapusan data peserta.";
    body.innerHTML = `
      <div class="delete-confirmation">
        <span class="delete-confirmation-label">Delete / Participant</span>
        <strong>${esc(p.full_name)}</strong>
        <code>${esc(p.qr_token)}</code>
        <p>Tindakan ini akan menghapus data peserta dari sistem dan tidak dapat dibatalkan.</p>
      </div>`;
    footer.innerHTML = `
      <button type="button" class="btn btn-ghost" id="modal-delete-cancel-btn">Batal</button>
      <button type="button" class="btn btn-danger" id="modal-delete-confirm-btn">Hapus Peserta</button>`;
    document.getElementById("modal-delete-cancel-btn").addEventListener("click", closeModal);
    document.getElementById("modal-delete-confirm-btn").addEventListener("click", () => deleteParticipant(p));
    initialFocusSelector = "#modal-delete-cancel-btn";
  }

  dashboardRoot.inert = true;
  dashboardRoot.setAttribute("aria-hidden", "true");
  document.body.classList.add("modal-open");
  participantModal.classList.remove("hidden");
  requestAnimationFrame(() => {
    const initialFocus = participantModal.querySelector(initialFocusSelector) || participantModalCard;
    initialFocus.focus();
  });
}

function closeModal(options = {}) {
  if (modalBusy) return;
  const { restoreFocus = true } = options;
  participantModal.classList.add("hidden");
  participantModal.removeAttribute("data-mode");
  participantModal.removeAttribute("aria-busy");
  dashboardRoot.inert = false;
  dashboardRoot.removeAttribute("aria-hidden");
  document.body.classList.remove("modal-open");

  if (restoreFocus) {
    const target = modalReturnFocus?.isConnected
      ? modalReturnFocus
      : document.getElementById("search-input");
    target?.focus();
  }
  modalReturnFocus = null;
}

function setModalStatus(state, message) {
  modalStatus.textContent = message;
  if (state) modalStatus.dataset.state = state;
  else modalStatus.removeAttribute("data-state");
}

function setModalBusy(busy, busyLabel) {
  modalBusy = busy;
  const closeButton = document.getElementById("btn-modal-close");
  const actionButton = document.getElementById("modal-save-btn") ||
    document.getElementById("modal-delete-confirm-btn");
  const secondaryButtons = participantModal.querySelectorAll(".modal-footer button:not(#modal-save-btn):not(#modal-delete-confirm-btn)");

  closeButton.disabled = busy;
  secondaryButtons.forEach((button) => { button.disabled = busy; });
  if (actionButton) {
    if (!actionButton.dataset.idleLabel) actionButton.dataset.idleLabel = actionButton.textContent;
    actionButton.disabled = busy;
    actionButton.textContent = busy ? busyLabel : actionButton.dataset.idleLabel;
    if (busy) actionButton.setAttribute("aria-busy", "true");
    else actionButton.removeAttribute("aria-busy");
  }

  if (busy) participantModal.setAttribute("aria-busy", "true");
  else participantModal.removeAttribute("aria-busy");
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
    const value = formatValue(f, p[f]);
    const valueMarkup = f === "status"
      ? `<span class="badge ${p.status === "hadir" ? "badge-hadir" : "badge-pending"}">${esc(value)}</span>`
      : `<span class="d-value ${f === "qr_token" ? "detail-ticket-id" : ""}">${esc(value)}</span>`;
    return `<div class="detail-item ${full ? "detail-full" : ""}">
      <span class="d-label">${esc(FIELD_LABELS[f] || f)}</span>
      ${valueMarkup}
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
    return `<div class="form-group ${full ? "detail-full" : ""}"><label for="edit-${f}">${esc(label)}</label>${input}</div>`;
  }).join("");
  return `<div class="form-row">${controls}</div>`;
}

async function saveEdit(p) {
  if (modalBusy) return;
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

  setModalStatus("loading", "Menyimpan perubahan peserta...");
  setModalBusy(true, "Menyimpan...");
  try {
    await window.SOGA_API.updateParticipant(p.id, updates);
    setModalBusy(false);
    closeModal({ restoreFocus: false });
    await loadParticipants();
    document.getElementById("search-input").focus();
  } catch (e) {
    setModalBusy(false);
    setModalStatus("error", "Perubahan belum dapat disimpan. Periksa data dan coba kembali.");
    modalStatus.focus();
  }
}

async function deleteParticipant(p) {
  if (modalBusy) return;
  setModalStatus("loading", "Menghapus data peserta...");
  setModalBusy(true, "Menghapus...");
  try {
    await window.SOGA_API.deleteParticipant(p.id);
    setModalBusy(false);
    closeModal({ restoreFocus: false });
    await loadParticipants();
    document.getElementById("search-input").focus();
  } catch (e) {
    setModalBusy(false);
    setModalStatus("error", "Data peserta belum dapat dihapus. Silakan coba kembali.");
    modalStatus.focus();
  }
}

document.getElementById("btn-modal-close").addEventListener("click", closeModal);
participantModal.addEventListener("click", (e) => {
  if (e.target === e.currentTarget) closeModal();
});

document.addEventListener("keydown", (e) => {
  if (participantModal.classList.contains("hidden")) return;

  if (e.key === "Escape") {
    e.preventDefault();
    closeModal();
    return;
  }

  if (e.key !== "Tab") return;
  const focusable = [...participantModal.querySelectorAll(MODAL_FOCUSABLE)]
    .filter((element) => element.getClientRects().length > 0);
  if (!focusable.length) {
    e.preventDefault();
    participantModalCard.focus();
    return;
  }

  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  if (e.shiftKey && document.activeElement === first) {
    e.preventDefault();
    last.focus();
  } else if (!e.shiftKey && document.activeElement === last) {
    e.preventDefault();
    first.focus();
  }
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
function renderCheckinStatus(state, message) {
  const status = document.getElementById("checkin-status");
  const icons = {
    success: ICON_CHECK,
    warning: ICON_WARNING,
    invalid: ICON_X,
    error: ICON_X,
  };

  status.innerHTML = icons[state] || "";
  status.appendChild(document.createTextNode(message));
  status.className = "submit-status";
  status.dataset.state = state;
}

async function doCheckin(token) {
  token = token.trim().toUpperCase();
  if (!token.startsWith("SGN11-")) {
    renderCheckinStatus("invalid", "Format Ticket ID belum sesuai. Contoh: SGN11-ABC123.");
    return;
  }
  try {
    await window.SOGA_API.checkInParticipant(token);
    renderCheckinStatus("success", `${token} berhasil diverifikasi dan check-in.`);
    document.getElementById("checkin-input").value = "";
    await loadParticipants();
  } catch (e) {
    renderCheckinStatus(
      "error",
      "Check-in belum dapat diproses. Periksa Ticket ID atau coba kembali."
    );
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
      ).catch(() => renderCheckinStatus(
        "error",
        "Kamera tidak tersedia. Gunakan input Ticket ID manual."
      ));
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
// Registration toggle
// ============================================================
async function loadRegistrationStatus() {
  try {
    registrationOpen = await window.SOGA_API.isRegistrationOpen();
  } catch (e) {
    registrationOpen = true;
  }
  renderRegistrationToggle();
}

function renderRegistrationToggle() {
  const txt = document.getElementById("reg-status-text");
  const btn = document.getElementById("btn-toggle-registration");
  const badge = document.getElementById("reg-status-badge");
  if (!txt || !btn || !badge) return;
  txt.textContent = registrationOpen ? "Pendaftaran terbuka" : "Pendaftaran ditutup";
  badge.textContent = registrationOpen ? "Open" : "Closed";
  badge.dataset.state = registrationOpen ? "open" : "closed";
  btn.textContent = registrationOpen ? "Tutup Pendaftaran" : "Buka Pendaftaran";
  btn.className = registrationOpen
    ? "btn btn-secondary admin-registration-action is-close"
    : "btn btn-primary admin-registration-action";
  btn.setAttribute(
    "aria-label",
    registrationOpen ? "Tutup pendaftaran peserta" : "Buka pendaftaran peserta"
  );
}

document.getElementById("btn-toggle-registration").addEventListener("click", async () => {
  const btn = document.getElementById("btn-toggle-registration");
  btn.disabled = true;
  try {
    await window.SOGA_API.setRegistrationOpen(!registrationOpen);
    registrationOpen = !registrationOpen;
    renderRegistrationToggle();
  } catch (e) {
    alert("Gagal mengubah status: " + (e.message || "terjadi kesalahan"));
  } finally {
    btn.disabled = false;
  }
});

// ============================================================
boot();
