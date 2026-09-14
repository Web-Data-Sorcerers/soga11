// ============================================================
// SOGA 11 — Command Center Admin Application Logic
// Sorcery Gathering #11 — Operational System
// Reference: 08-admin-command-center-reference-board.png
// ============================================================

let participants = [];
let scanner = null;
let conversionChart = null;
let arrivalChart = null;
let registrationOpen = null;
let registrationStatusLoading = false;
let registrationToggleBusy = false;
let currentViewingParticipant = null;

// SVG Icons
const ICON_CHECK = '<svg class="ico" aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg>';
const ICON_X = '<svg class="ico" aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/></svg>';
const ICON_WARNING = '<svg class="ico" aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 8v4"/><path d="M12 16h.01"/></svg>';
const ICON_EYE = '<svg class="ico" aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>';
const ICON_PENCIL = '<svg class="ico" aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z"/><path d="m15 5 4 4"/></svg>';
const ICON_TRASH = '<svg class="ico" aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>';
const ICON_COPY = '<svg class="ico" aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>';

const esc = (s) =>
  String(s ?? "").replace(
    /[&<>"']/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])
  );

function getInitials(name, email) {
  if (name && name.trim()) {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return parts[0].slice(0, 2).toUpperCase();
  }
  if (email && email.trim()) {
    return email.slice(0, 2).toUpperCase();
  }
  return "DS";
}

// ============================================================
// Auth & Initialization
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
    // Keep login screen open if session check fails
  }

  document.getElementById("dashboard").classList.add("hidden");
  document.getElementById("login-screen").classList.remove("hidden");
}

function clearLoginError() {
  loginError?.classList.add("hidden");
  loginEmail?.removeAttribute("aria-invalid");
  loginPassword?.removeAttribute("aria-invalid");
}

function setLoginPending(pending) {
  loginSubmitting = pending;
  if (!loginButton) return;
  loginButton.disabled = pending;
  if (pending) {
    loginButton.setAttribute("aria-busy", "true");
    loginForm?.setAttribute("aria-busy", "true");
  } else {
    loginButton.removeAttribute("aria-busy");
    loginForm?.removeAttribute("aria-busy");
  }
  if (loginEmail) loginEmail.readOnly = pending;
  if (loginPassword) loginPassword.readOnly = pending;
  if (loginButtonLabel) loginButtonLabel.textContent = pending ? "Memverifikasi Akun..." : "Masuk ke Command Center";
  if (loginStatus) loginStatus.textContent = pending ? "Memverifikasi akun admin..." : "";
}

function showLoginError() {
  loginEmail?.setAttribute("aria-invalid", "true");
  loginPassword?.setAttribute("aria-invalid", "true");
  loginError?.classList.remove("hidden");
  loginError?.focus();
}

function showDashboard(user) {
  document.getElementById("login-screen")?.classList.add("hidden");
  document.getElementById("dashboard")?.classList.remove("hidden");

  const email = user?.email || "admin@datasorcerers.id";
  const namePart = email.split("@")[0].replace(/[-_.]/g, " ");
  const displayName = namePart.charAt(0).toUpperCase() + namePart.slice(1);
  const initials = getInitials(displayName, email);

  // Bind admin profile info
  const adminName = document.getElementById("admin-name");
  if (adminName) adminName.textContent = displayName;
  const adminAvatar = document.getElementById("admin-avatar");
  if (adminAvatar) adminAvatar.textContent = initials;
  const welcomeName = document.getElementById("admin-welcome-name");
  if (welcomeName) welcomeName.textContent = displayName;
  const dropdownEmail = document.getElementById("dropdown-user-email");
  if (dropdownEmail) dropdownEmail.textContent = email;
  const settingsEmail = document.getElementById("settings-admin-email");
  if (settingsEmail) settingsEmail.textContent = email;

  loadParticipants();
  loadRegistrationStatus();
}

// Password toggle
const btnTogglePwd = document.getElementById("btn-toggle-pwd");
if (btnTogglePwd && loginPassword) {
  btnTogglePwd.addEventListener("click", () => {
    const isPassword = loginPassword.type === "password";
    loginPassword.type = isPassword ? "text" : "password";
    btnTogglePwd.querySelector(".eye-open")?.classList.toggle("hidden", isPassword);
    btnTogglePwd.querySelector(".eye-closed")?.classList.toggle("hidden", !isPassword);
  });
}

loginForm?.addEventListener("submit", async (e) => {
  e.preventDefault();
  if (loginSubmitting) return;

  const email = loginEmail?.value.trim() || "";
  const password = loginPassword?.value || "";
  clearLoginError();
  setLoginPending(true);

  try {
    const { user } = await window.SOGA_API.signInAdmin(email, password);
    showDashboard(user);
  } catch (err) {
    showLoginError();
  } finally {
    setLoginPending(false);
  }
});

[loginEmail, loginPassword].forEach((f) => {
  f?.addEventListener("input", clearLoginError);
});

// Admin Logout
document.getElementById("btn-logout")?.addEventListener("click", async (e) => {
  const btn = e.currentTarget;
  if (btn.disabled) return;
  btn.disabled = true;
  try {
    await window.SOGA_API.signOutAdmin();
    location.reload();
  } catch (err) {
    btn.disabled = false;
  }
});

// Admin Profile Dropdown
const btnAdminProfile = document.getElementById("btn-admin-profile");
const adminDropdown = document.getElementById("admin-dropdown");
if (btnAdminProfile && adminDropdown) {
  btnAdminProfile.addEventListener("click", (e) => {
    e.stopPropagation();
    const isExpanded = btnAdminProfile.getAttribute("aria-expanded") === "true";
    btnAdminProfile.setAttribute("aria-expanded", String(!isExpanded));
    adminDropdown.classList.toggle("hidden", isExpanded);
  });
  document.addEventListener("click", (e) => {
    if (!adminDropdown.contains(e.target) && !btnAdminProfile.contains(e.target)) {
      adminDropdown.classList.add("hidden");
      btnAdminProfile.setAttribute("aria-expanded", "false");
    }
  });
}

// Mobile Sidebar Toggle
const btnSidebarToggle = document.getElementById("btn-sidebar-toggle");
const btnSidebarClose = document.getElementById("btn-sidebar-close");
const dashSidebar = document.getElementById("dash-sidebar");
const sidebarBackdrop = document.getElementById("sidebar-backdrop");

function toggleSidebar(open) {
  dashSidebar?.classList.toggle("is-open", open);
  sidebarBackdrop?.classList.toggle("is-open", open);
}

btnSidebarToggle?.addEventListener("click", () => toggleSidebar(true));
btnSidebarClose?.addEventListener("click", () => toggleSidebar(false));
sidebarBackdrop?.addEventListener("click", () => toggleSidebar(false));

// ============================================================
// Tab Switching
// ============================================================
function switchTab(paneId) {
  // Activate pane
  document.querySelectorAll(".dash-pane").forEach((p) => {
    p.classList.toggle("is-active", p.id === paneId);
  });

  // Sync tab buttons
  document.querySelectorAll(".dash-tab-btn").forEach((b) => {
    const active = b.dataset.target === paneId;
    b.classList.toggle("is-active", active);
    b.setAttribute("aria-selected", String(active));
  });

  // Sync sidebar items
  document.querySelectorAll(".nav-item").forEach((item) => {
    item.classList.toggle("is-active", item.dataset.tab === paneId);
  });

  // Sync mobile bottom nav
  document.querySelectorAll(".bottom-nav-item").forEach((item) => {
    item.classList.toggle("is-active", item.dataset.bottomTab === paneId);
  });

  // Close mobile sidebar
  toggleSidebar(false);

  // If opening analytics, resize charts
  if (paneId === "pane-analytics") {
    setTimeout(renderCharts, 50);
  }
}

document.querySelectorAll(".dash-tab-btn").forEach((btn) => {
  btn.addEventListener("click", () => switchTab(btn.dataset.target));
});

document.querySelectorAll(".nav-item[data-tab]").forEach((btn) => {
  btn.addEventListener("click", () => switchTab(btn.dataset.tab));
});

document.querySelectorAll(".bottom-nav-item[data-bottom-tab]").forEach((btn) => {
  btn.addEventListener("click", () => switchTab(btn.dataset.bottomTab));
});

// ============================================================
// Data Loading & Statistics
// ============================================================
async function loadParticipants() {
  try {
    participants = await window.SOGA_API.getParticipants();
    renderStats();
    renderTable();
    renderCharts();
  } catch (e) {
    const tbody = document.getElementById("table-body");
    if (tbody) {
      tbody.innerHTML = `<tr><td colspan="7" class="table-loading-cell">Gagal memuat data peserta. Silakan tekan tombol Refresh.</td></tr>`;
    }
  }
}

function renderStats() {
  const total = participants.length;
  const present = participants.filter((p) => p.status === "hadir").length;
  const pending = total - present;
  const conversion = total ? Math.round((present / total) * 100) : 0;
  const pendingRate = total ? Math.round((pending / total) * 100) : 0;

  const statTotal = document.getElementById("stat-total");
  if (statTotal) statTotal.textContent = total.toLocaleString("id-ID");

  const statPresent = document.getElementById("stat-present");
  if (statPresent) statPresent.textContent = present.toLocaleString("id-ID");

  const statPresentRate = document.getElementById("stat-present-rate");
  if (statPresentRate) statPresentRate.textContent = `${conversion}% dari total peserta`;

  const statPending = document.getElementById("stat-pending");
  if (statPending) statPending.textContent = pending.toLocaleString("id-ID");

  const statPendingRate = document.getElementById("stat-pending-rate");
  if (statPendingRate) statPendingRate.textContent = `${pendingRate}% dari total peserta`;

  // Counters
  const navBadge = document.getElementById("nav-badge-peserta");
  if (navBadge) navBadge.textContent = total;
  const tabCounter = document.getElementById("tab-count-participants");
  if (tabCounter) tabCounter.textContent = total;
  const rateBadge = document.getElementById("analytics-attendance-rate");
  if (rateBadge) rateBadge.textContent = `${conversion}% Hadir`;
}

function renderCharts() {
  if (typeof Chart === "undefined") return;
  const hadir = participants.filter((p) => p.status === "hadir").length;
  const pending = participants.length - hadir;
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const sharedOptions = {
    responsive: true,
    maintainAspectRatio: false,
    animation: reducedMotion ? false : { duration: 250 },
    color: "#746b80",
    font: { family: '"Plus Jakarta Sans", system-ui, sans-serif' },
  };

  const convCanvas = document.getElementById("chart-conversion");
  if (convCanvas) {
    if (conversionChart) conversionChart.destroy();
    conversionChart = new Chart(convCanvas, {
      type: "doughnut",
      data: {
        labels: ["Sudah Hadir", "Belum Hadir"],
        datasets: [{
          data: [hadir, pending],
          backgroundColor: ["#15803d", "#ede9fe"],
          hoverBackgroundColor: ["#16a34a", "#ddd6fe"],
          borderWidth: 0,
        }],
      },
      options: {
        ...sharedOptions,
        cutout: "70%",
        plugins: {
          legend: {
            position: "bottom",
            labels: { boxWidth: 12, boxHeight: 12, padding: 18, usePointStyle: true },
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
        datasets: [{
          label: "Jumlah Check-in",
          data: hourCounts,
          backgroundColor: "#7c3aed",
          borderRadius: 6,
          hoverBackgroundColor: "#6d28d9",
        }],
      },
      options: {
        ...sharedOptions,
        plugins: { legend: { display: false } },
        scales: {
          x: { grid: { display: false }, ticks: { maxTicksLimit: 8, color: "#746b80" } },
          y: {
            beginAtZero: true,
            border: { display: false },
            grid: { color: "rgba(199, 189, 210, 0.35)" },
            ticks: { precision: 0, color: "#746b80" },
          },
        },
      },
    });
  }
}

// ============================================================
// Participant Table Rendering
// ============================================================
function renderTable(filter = "all", query = "") {
  const body = document.getElementById("table-body");
  const paginationInfo = document.getElementById("pagination-info");
  if (!body) return;

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

  if (paginationInfo) {
    paginationInfo.textContent = `Menampilkan ${list.length} dari ${participants.length} peserta`;
  }

  if (!list.length) {
    body.innerHTML = `<tr><td colspan="7" class="table-loading-cell">Tidak ada data peserta yang cocok dengan kriteria pencarian.</td></tr>`;
    return;
  }

  body.innerHTML = list
    .map((p, idx) => {
      const initials = getInitials(p.full_name, p.email);
      const isHadir = p.status === "hadir";
      const checkinTimeFormatted = p.checkin_time
        ? new Date(p.checkin_time).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) + " WIB"
        : "-";

      return `
      <tr class="participant-row" data-id="${esc(p.id)}">
        <td class="cell-num">${idx + 1}</td>
        <td>
          <div class="participant-cell">
            <div class="participant-avatar">${esc(initials)}</div>
            <div class="participant-info">
              <strong>${esc(p.full_name)}</strong>
              <small>${esc(p.email || "-")}</small>
            </div>
          </div>
        </td>
        <td>${esc(p.institution || "-")}</td>
        <td>
          <span class="badge ${isHadir ? "badge-hadir" : "badge-pending"}">
            ${isHadir ? ICON_CHECK + " Sudah Hadir" : ICON_WARNING + " Belum Hadir"}
          </span>
        </td>
        <td>
          <button type="button" class="ticket-tag-btn" data-copy="${esc(p.qr_token)}" title="Klik untuk salin kode tiket">
            <span>${esc(p.qr_token)}</span>
            <span class="copy-hint">${ICON_COPY}</span>
          </button>
        </td>
        <td>${checkinTimeFormatted}</td>
        <td class="cell-actions">
          <div class="actions-wrap">
            <button type="button" class="btn-view-ticket" data-action="view" data-id="${esc(p.id)}">Lihat</button>
            <button type="button" class="act-btn" data-action="edit" data-id="${esc(p.id)}" title="Edit Data" aria-label="Edit ${esc(p.full_name)}">${ICON_PENCIL}</button>
            <button type="button" class="act-btn act-btn-danger" data-action="delete" data-id="${esc(p.id)}" title="Hapus Data" aria-label="Hapus ${esc(p.full_name)}">${ICON_TRASH}</button>
          </div>
        </td>
      </tr>`;
    })
    .join("");
}

// Table Action Events
document.getElementById("table-body")?.addEventListener("click", (e) => {
  // Copy ticket
  const copyBtn = e.target.closest("[data-copy]");
  if (copyBtn) {
    const code = copyBtn.dataset.copy;
    navigator.clipboard.writeText(code).then(() => {
      const originalText = copyBtn.innerHTML;
      copyBtn.innerHTML = `<span>Disalin!</span>`;
      setTimeout(() => { copyBtn.innerHTML = originalText; }, 1200);
    });
    return;
  }

  // Row actions
  const btn = e.target.closest("[data-action]");
  if (!btn) return;
  const p = participants.find((item) => item.id === btn.dataset.id);
  if (!p) return;

  if (btn.dataset.action === "view") {
    openTicketDrawer(p);
  } else if (btn.dataset.action === "edit") {
    openEditModal(p);
  } else if (btn.dataset.action === "delete") {
    openDeleteModal(p);
  }
});

// Search & Filter Events
document.getElementById("search-input")?.addEventListener("input", (e) => {
  renderTable(document.getElementById("filter-status")?.value || "all", e.target.value);
});

document.getElementById("filter-status")?.addEventListener("change", (e) => {
  renderTable(e.target.value, document.getElementById("search-input")?.value || "");
});

document.getElementById("btn-refresh")?.addEventListener("click", loadParticipants);

// ============================================================
// Slide-over Drawer: "Detail Tiket"
// ============================================================
const ticketDrawer = document.getElementById("ticket-drawer");
const drawerBackdrop = document.getElementById("drawer-backdrop");
const btnDrawerClose = document.getElementById("btn-drawer-close");
const drawerBody = document.getElementById("drawer-body");
const drawerFooter = document.getElementById("drawer-footer");

function openTicketDrawer(p) {
  if (!ticketDrawer || !drawerBody || !drawerFooter) return;
  currentViewingParticipant = p;

  const isHadir = p.status === "hadir";
  const checkinTimeFormatted = p.checkin_time
    ? new Date(p.checkin_time).toLocaleString("id-ID")
    : "Belum check-in";
  const createdAtFormatted = p.created_at
    ? new Date(p.created_at).toLocaleString("id-ID")
    : "-";

  // Render Credential Preview Card
  drawerBody.innerHTML = `
    <div class="credential-preview-card">
      <svg class="credential-bg-geometry" viewBox="0 0 520 760" aria-hidden="true">
        <path d="M26 152 102 92 176 142 266 58 358 120 492 44M102 92l42 188 118 58 96-218 82 226M144 280 70 440l156 92 214-186M226 532l-48 174M358 120l-92-62" />
        <circle cx="26" cy="152" r="3" />
        <circle cx="102" cy="92" r="5" />
        <circle cx="176" cy="142" r="3" />
        <circle cx="266" cy="58" r="4" />
        <circle cx="358" cy="120" r="6" fill="#7c3aed" />
        <circle cx="492" cy="44" r="3" />
        <circle cx="226" cy="532" r="4" fill="#d9ba91" />
      </svg>

      <div class="credential-card-top">
        <div class="credential-brand-flex">
          <img src="assets/logo-web.png" alt="Data Sorcerers" />
          <strong>Data Sorcerers</strong>
        </div>
        <span class="credential-badge-edition">SOGA / 011</span>
      </div>

      <div class="credential-card-title">
        <small>Participant Credential</small>
        <h3>${esc(p.full_name)}</h3>
      </div>

      <div class="credential-qr-wrap" id="drawer-qr-container"></div>

      <div class="credential-ticket-pill" id="drawer-ticket-pill" title="Klik untuk salin kode tiket">
        <span>${esc(p.qr_token)}</span>
        ${ICON_COPY}
      </div>

      <div class="credential-card-footer">
        <span>25 OKT 2026 • YOGYAKARTA</span>
        <span class="credential-status-pill ${isHadir ? "is-valid" : "is-pending"}">
          ${isHadir ? "✔ VALID TICKET" : "⏱ BELUM HADIR"}
        </span>
      </div>
    </div>

    <div class="drawer-details-box">
      <h4>Data Lengkap Peserta</h4>
      <dl class="detail-grid">
        <div class="detail-item">
          <dt>Nama Lengkap</dt>
          <dd>${esc(p.full_name)}</dd>
        </div>
        <div class="detail-item">
          <dt>Email</dt>
          <dd><a href="mailto:${esc(p.email)}">${esc(p.email || "-")}</a></dd>
        </div>
        <div class="detail-item">
          <dt>Nomor WhatsApp</dt>
          <dd>
            ${p.whatsapp ? `<a href="https://wa.me/${p.whatsapp.replace(/\D/g, '')}" target="_blank" rel="noopener">📱 ${esc(p.whatsapp)}</a>` : "-"}
          </dd>
        </div>
        <div class="detail-item">
          <dt>Jenis Kelamin</dt>
          <dd>${p.gender === "L" ? "Laki-laki" : p.gender === "P" ? "Perempuan" : "-"}</dd>
        </div>
        <div class="detail-item full-width">
          <dt>Instansi / Kampus</dt>
          <dd>${esc(p.institution || "-")}</dd>
        </div>
        <div class="detail-item">
          <dt>Pekerjaan / Posisi</dt>
          <dd>${esc(p.job || "-")}</dd>
        </div>
        <div class="detail-item">
          <dt>Level Keahlian</dt>
          <dd>${esc(p.level || "-")}</dd>
        </div>
        <div class="detail-item full-width">
          <dt>Bidang Minat</dt>
          <dd>${esc(p.focus || "-")}</dd>
        </div>
        <div class="detail-item full-width">
          <dt>Tools / Framework</dt>
          <dd>${esc(p.tools || "-")}</dd>
        </div>
        <div class="detail-item">
          <dt>Waktu Check-in</dt>
          <dd>${checkinTimeFormatted}</dd>
        </div>
        <div class="detail-item">
          <dt>Terdaftar Pada</dt>
          <dd>${createdAtFormatted}</dd>
        </div>
        ${p.expectation ? `<div class="detail-item full-width"><dt>Ekspektasi</dt><dd>${esc(p.expectation)}</dd></div>` : ""}
        ${p.question ? `<div class="detail-item full-width"><dt>Pertanyaan</dt><dd>${esc(p.question)}</dd></div>` : ""}
      </dl>
    </div>
  `;

  // Render QR Code inside drawer
  const qrContainer = document.getElementById("drawer-qr-container");
  if (qrContainer && typeof QRCode !== "undefined") {
    try {
      new QRCode(qrContainer, {
        text: p.qr_token,
        width: 138,
        height: 138,
        colorDark: "#21152f",
        colorLight: "#ffffff",
      });
    } catch (e) {
      qrContainer.innerHTML = `<span style="font-family:monospace;font-size:12px;color:#746b80;">${esc(p.qr_token)}</span>`;
    }
  }

  // Copy Ticket Pill click
  document.getElementById("drawer-ticket-pill")?.addEventListener("click", () => {
    navigator.clipboard.writeText(p.qr_token).then(() => {
      const pill = document.getElementById("drawer-ticket-pill");
      if (pill) {
        const orig = pill.innerHTML;
        pill.innerHTML = `<span>Kode Disalin!</span>`;
        setTimeout(() => { pill.innerHTML = orig; }, 1200);
      }
    });
  });

  // Render Drawer Action Buttons
  drawerFooter.innerHTML = `
    <button type="button" class="btn btn-ghost" id="drawer-btn-close">Tutup</button>
    <button type="button" class="btn btn-secondary" id="drawer-btn-edit">Edit Data</button>
    <button type="button" class="btn ${isHadir ? "btn-secondary" : "btn-primary"}" id="drawer-btn-toggle-checkin">
      ${isHadir ? "Batalkan Check-in" : "✔ Check-in Sekarang"}
    </button>
  `;

  document.getElementById("drawer-btn-close")?.addEventListener("click", closeTicketDrawer);
  document.getElementById("drawer-btn-edit")?.addEventListener("click", () => {
    closeTicketDrawer();
    openEditModal(p);
  });
  document.getElementById("drawer-btn-toggle-checkin")?.addEventListener("click", async () => {
    if (isHadir) {
      await undoCheckin(p);
    } else {
      await doCheckin(p.qr_token);
      const updated = participants.find((item) => item.id === p.id);
      if (updated) openTicketDrawer(updated);
    }
  });

  ticketDrawer.classList.remove("hidden");
  document.body.classList.add("modal-open");
}

function closeTicketDrawer() {
  if (!ticketDrawer) return;
  ticketDrawer.classList.add("hidden");
  document.body.classList.remove("modal-open");
  currentViewingParticipant = null;
}

btnDrawerClose?.addEventListener("click", closeTicketDrawer);
drawerBackdrop?.addEventListener("click", closeTicketDrawer);

async function undoCheckin(p) {
  if (!confirm(`Batalkan status check-in untuk ${p.full_name}?`)) return;
  try {
    await window.SOGA_API.updateParticipant(p.id, {
      status: "pending",
      checkin_time: null,
    });
    await loadParticipants();
    const updated = participants.find((item) => item.id === p.id);
    if (updated) openTicketDrawer(updated);
  } catch (e) {
    alert("Gagal membatalkan check-in: " + (e.message || "terjadi kesalahan"));
  }
}

// ============================================================
// Check-in Operations (Manual & Scanner)
// ============================================================
function renderCheckinStatus(state, message) {
  const status = document.getElementById("checkin-status");
  if (!status) return;
  const icons = {
    success: ICON_CHECK,
    warning: ICON_WARNING,
    invalid: ICON_X,
    error: ICON_X,
  };

  status.innerHTML = (icons[state] || "") + `<span>${esc(message)}</span>`;
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
    renderCheckinStatus("success", `Tiket ${token} berhasil diverifikasi dan check-in tercatat.`);
    const input = document.getElementById("checkin-input");
    if (input) input.value = "";
    await loadParticipants();
  } catch (e) {
    renderCheckinStatus(
      "error",
      "Check-in tidak dapat diproses. Periksa Ticket ID atau status peserta, lalu coba kembali."
    );
  }
}

document.getElementById("btn-checkin")?.addEventListener("click", () => {
  const input = document.getElementById("checkin-input");
  if (input) doCheckin(input.value);
});

document.getElementById("checkin-input")?.addEventListener("keypress", (e) => {
  if (e.key === "Enter") doCheckin(e.target.value);
});

// QR Scanner via Camera
const btnScanToggle = document.getElementById("btn-scan-toggle");
const scanToggleLabel = document.getElementById("scan-toggle-label");
const scannerBox = document.getElementById("scanner-box");
const scannerPlaceholder = document.getElementById("scanner-placeholder");

btnScanToggle?.addEventListener("click", () => {
  if (!scannerBox) return;

  if (scannerBox.classList.contains("hidden")) {
    scannerBox.classList.remove("hidden");
    scannerPlaceholder?.classList.add("hidden");
    if (scanToggleLabel) scanToggleLabel.textContent = "Tutup Kamera";

    if (!scanner && typeof Html5Qrcode !== "undefined") {
      scanner = new Html5Qrcode("scanner-box");
      scanner.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: 250 },
        (text) => {
          doCheckin(text);
          stopScanner();
        }
      ).catch(() => {
        renderCheckinStatus("error", "Kamera tidak dapat diakses. Gunakan input manual Ticket ID.");
        stopScanner();
      });
    }
  } else {
    stopScanner();
  }
});

function stopScanner() {
  if (scannerBox) scannerBox.classList.add("hidden");
  if (scannerPlaceholder) scannerPlaceholder.classList.remove("hidden");
  if (scanToggleLabel) scanToggleLabel.textContent = "Buka Kamera Scanner";
  if (scanner) {
    scanner.stop().then(() => scanner.clear()).catch(() => {});
    scanner = null;
  }
}

// ============================================================
// Export CSV
// ============================================================
const CSV_HEADERS = [
  "qr_token", "full_name", "email", "whatsapp", "gender",
  "institution", "job", "linkedin", "github", "level",
  "focus", "tools", "source", "expectation", "question",
  "status", "checkin_time", "created_at",
];

function sanitizeSpreadsheetCell(value) {
  const raw = typeof value === "string" ? value : JSON.stringify(value);
  const text = raw ?? "";
  return /^[=+\-@]/.test(text) ? `'${text}` : text;
}

function quoteCsvCell(value) {
  return `"${sanitizeSpreadsheetCell(value).replace(/"/g, '""')}"`;
}

function buildParticipantsCsv(data = participants) {
  const rows = data.map((p) =>
    CSV_HEADERS.map((header) => quoteCsvCell(p[header] ?? "")).join(",")
  );
  return [CSV_HEADERS.join(","), ...rows].join("\n");
}

document.getElementById("btn-export")?.addEventListener("click", () => {
  const csv = buildParticipantsCsv();
  const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `soga11_peserta_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(a.href);
});

// ============================================================
// Registration Status Control
// ============================================================
async function loadRegistrationStatus() {
  if (registrationStatusLoading) return;
  registrationStatusLoading = true;
  registrationOpen = null;
  renderRegistrationToggle();

  try {
    const nextStatus = await window.SOGA_API.isRegistrationOpen();
    if (typeof nextStatus !== "boolean") throw new Error("Invalid registration status");
    registrationOpen = nextStatus;
  } catch (e) {
    registrationOpen = null;
  } finally {
    registrationStatusLoading = false;
    renderRegistrationToggle();
  }
}

function renderRegistrationToggle() {
  const txt = document.getElementById("reg-status-text");
  const btn = document.getElementById("btn-toggle-registration");
  const badge = document.getElementById("reg-status-badge");
  const settingsTitle = document.getElementById("settings-reg-status-title");
  const settingsDesc = document.getElementById("settings-reg-status-desc");
  const settingsBtn = document.getElementById("btn-settings-toggle-reg");

  if (!txt || !btn || !badge) return;

  if (registrationStatusLoading) {
    txt.textContent = "Memuat status...";
    badge.textContent = "Loading";
    badge.dataset.state = "loading";
    btn.textContent = "Memuat...";
    btn.disabled = true;
    return;
  }

  if (typeof registrationOpen !== "boolean") {
    txt.textContent = "Status gagal dimuat.";
    badge.textContent = "Error";
    badge.dataset.state = "closed";
    btn.textContent = "Coba Lagi";
    btn.disabled = false;
    return;
  }

  txt.textContent = registrationOpen ? "Pendaftaran dibuka untuk publik" : "Pendaftaran ditutup";
  badge.textContent = registrationOpen ? "Open" : "Closed";
  badge.dataset.state = registrationOpen ? "open" : "closed";
  btn.textContent = registrationToggleBusy
    ? "Menyimpan..."
    : registrationOpen ? "Tutup Pendaftaran" : "Buka Pendaftaran";
  btn.className = registrationOpen
    ? "btn btn-sm btn-outline-danger"
    : "btn btn-sm btn-primary";
  btn.disabled = registrationToggleBusy;

  if (settingsTitle) {
    settingsTitle.textContent = registrationOpen ? "Status Pendaftaran: Buka (Open)" : "Status Pendaftaran: Ditutup (Closed)";
  }
  if (settingsDesc) {
    settingsDesc.textContent = registrationOpen
      ? "Formulir pendaftaran dapat diakses oleh publik secara terbuka di landing page."
      : "Formulir pendaftaran dinonaktifkan. Publik tidak dapat mendaftar.";
  }
  if (settingsBtn) {
    settingsBtn.textContent = registrationOpen ? "Tutup Pendaftaran" : "Buka Pendaftaran";
    settingsBtn.className = registrationOpen ? "btn btn-outline-danger" : "btn btn-primary";
    settingsBtn.disabled = registrationToggleBusy;
  }
}

async function handleToggleRegistration() {
  if (registrationStatusLoading || registrationToggleBusy) return;
  if (typeof registrationOpen !== "boolean") {
    await loadRegistrationStatus();
    return;
  }

  const confirmMsg = registrationOpen
    ? "Tutup pendaftaran sekarang? Calon peserta tidak akan dapat mendaftar lagi."
    : "Buka kembali pendaftaran untuk publik?";
  if (!confirm(confirmMsg)) return;

  registrationToggleBusy = true;
  renderRegistrationToggle();
  try {
    await window.SOGA_API.setRegistrationOpen(!registrationOpen);
    registrationOpen = !registrationOpen;
  } catch (e) {
    alert("Gagal mengubah status: " + (e.message || "terjadi kesalahan"));
  } finally {
    registrationToggleBusy = false;
    renderRegistrationToggle();
  }
}

document.getElementById("btn-toggle-registration")?.addEventListener("click", handleToggleRegistration);
document.getElementById("btn-settings-toggle-reg")?.addEventListener("click", handleToggleRegistration);

// ============================================================
// Edit & Delete Participant Modals
// ============================================================
const participantModal = document.getElementById("participant-modal");
const modalTitle = document.getElementById("modal-title");
const modalDescription = document.getElementById("modal-description");
const modalBody = document.getElementById("modal-body");
const modalFooter = document.getElementById("modal-footer");
const modalStatus = document.getElementById("modal-status");
let modalBusy = false;

function openEditModal(p) {
  if (!participantModal || !modalBody || !modalFooter) return;
  modalBusy = false;
  modalTitle.textContent = "Edit Peserta";
  modalDescription.textContent = `Perbarui data untuk ${p.full_name} (${p.qr_token}).`;
  modalStatus.textContent = "";

  modalBody.innerHTML = `
    <form id="form-edit-participant">
      <div class="form-row">
        <div class="form-group">
          <label for="edit-name">Nama Lengkap</label>
          <input type="text" id="edit-name" value="${esc(p.full_name)}" required />
        </div>
        <div class="form-group">
          <label for="edit-gender">Jenis Kelamin</label>
          <select id="edit-gender">
            <option value="L" ${p.gender === "L" ? "selected" : ""}>Laki-laki</option>
            <option value="P" ${p.gender === "P" ? "selected" : ""}>Perempuan</option>
          </select>
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label for="edit-institution">Instansi / Kampus</label>
          <input type="text" id="edit-institution" value="${esc(p.institution || "")}" />
        </div>
        <div class="form-group">
          <label for="edit-job">Pekerjaan / Jabatan</label>
          <input type="text" id="edit-job" value="${esc(p.job || "")}" />
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label for="edit-level">Level Keahlian</label>
          <select id="edit-level">
            <option value="beginner" ${p.level === "beginner" ? "selected" : ""}>Beginner</option>
            <option value="intermediate" ${p.level === "intermediate" ? "selected" : ""}>Intermediate</option>
            <option value="expert" ${p.level === "expert" ? "selected" : ""}>Expert</option>
          </select>
        </div>
        <div class="form-group">
          <label for="edit-status">Status Kehadiran</label>
          <select id="edit-status">
            <option value="pending" ${p.status === "pending" ? "selected" : ""}>Belum Hadir (Pending)</option>
            <option value="hadir" ${p.status === "hadir" ? "selected" : ""}>Sudah Hadir (Hadir)</option>
          </select>
        </div>
      </div>
      <div class="form-group">
        <label for="edit-focus">Bidang Minat</label>
        <input type="text" id="edit-focus" value="${esc(p.focus || "")}" />
      </div>
      <div class="form-group">
        <label for="edit-tools">Tools / Framework</label>
        <input type="text" id="edit-tools" value="${esc(p.tools || "")}" />
      </div>
    </form>
  `;

  modalFooter.innerHTML = `
    <button type="button" class="btn btn-ghost" id="btn-modal-cancel">Batal</button>
    <button type="button" class="btn btn-primary" id="btn-modal-save">Simpan Perubahan</button>
  `;

  document.getElementById("btn-modal-cancel")?.addEventListener("click", closeParticipantModal);
  document.getElementById("btn-modal-save")?.addEventListener("click", async () => {
    const name = document.getElementById("edit-name")?.value.trim();
    if (!name) {
      alert("Nama lengkap tidak boleh kosong");
      return;
    }
    const updates = {
      full_name: name,
      gender: document.getElementById("edit-gender")?.value,
      institution: document.getElementById("edit-institution")?.value.trim(),
      job: document.getElementById("edit-job")?.value.trim(),
      level: document.getElementById("edit-level")?.value,
      focus: document.getElementById("edit-focus")?.value.trim(),
      tools: document.getElementById("edit-tools")?.value.trim(),
      status: document.getElementById("edit-status")?.value,
    };
    if (updates.status === "hadir" && !p.checkin_time) {
      updates.checkin_time = new Date().toISOString();
    } else if (updates.status === "pending") {
      updates.checkin_time = null;
    }

    try {
      await window.SOGA_API.updateParticipant(p.id, updates);
      closeParticipantModal();
      await loadParticipants();
    } catch (e) {
      alert("Gagal menyimpan perubahan: " + (e.message || "terjadi kesalahan"));
    }
  });

  participantModal.classList.remove("hidden");
  document.body.classList.add("modal-open");
}

function openDeleteModal(p) {
  if (!participantModal || !modalBody || !modalFooter) return;
  modalBusy = false;
  modalTitle.textContent = "Hapus Peserta?";
  modalDescription.textContent = "Konfirmasi penghapusan data peserta dari database.";
  modalStatus.textContent = "";

  modalBody.innerHTML = `
    <div class="delete-confirmation">
      <span class="delete-confirmation-label">PERINGATAN HAPUS DATA</span>
      <strong>${esc(p.full_name)}</strong>
      <code>${esc(p.qr_token)}</code>
      <p>Apakah kamu yakin ingin menghapus data peserta ini dari sistem? Tindakan ini tidak dapat dibatalkan.</p>
    </div>
  `;

  modalFooter.innerHTML = `
    <button type="button" class="btn btn-ghost" id="btn-modal-delete-cancel">Batal</button>
    <button type="button" class="btn btn-danger" id="btn-modal-delete-confirm">Hapus Peserta</button>
  `;

  document.getElementById("btn-modal-delete-cancel")?.addEventListener("click", closeParticipantModal);
  document.getElementById("btn-modal-delete-confirm")?.addEventListener("click", async () => {
    try {
      await window.SOGA_API.deleteParticipant(p.id);
      closeParticipantModal();
      await loadParticipants();
    } catch (e) {
      alert("Gagal menghapus peserta: " + (e.message || "terjadi kesalahan"));
    }
  });

  participantModal.classList.remove("hidden");
  document.body.classList.add("modal-open");
}

function closeParticipantModal() {
  if (!participantModal) return;
  participantModal.classList.add("hidden");
  document.body.classList.remove("modal-open");
}

document.getElementById("btn-modal-close")?.addEventListener("click", closeParticipantModal);
participantModal?.addEventListener("click", (e) => {
  if (e.target === participantModal) closeParticipantModal();
});

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    if (ticketDrawer && !ticketDrawer.classList.contains("hidden")) {
      closeTicketDrawer();
    } else if (participantModal && !participantModal.classList.contains("hidden")) {
      closeParticipantModal();
    }
  }
});

// Start application
boot();
