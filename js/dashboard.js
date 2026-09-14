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

function formatWhatsAppChatUrl(phone) {
  if (!phone) return "";
  let clean = String(phone).replace(/\D/g, "");
  if (clean.startsWith("0")) {
    clean = "62" + clean.slice(1);
  } else if (!clean.startsWith("62")) {
    clean = "62" + clean;
  }
  return "https://wa.me/" + clean;
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

  initDashboardRouting();
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
// Route Configuration & Tab Switching (Two-Way Sync + Hash)
// ============================================================
const ROUTE_CONFIG = {
  dashboard: {
    paneId: "pane-registry",
    sidebarId: "nav-item-dashboard",
    tabId: "tab-btn-registry",
    bottomTabId: "bottom-nav-dashboard",
  },
  peserta: {
    paneId: "pane-registry",
    sidebarId: "nav-item-peserta",
    tabId: "tab-btn-registry",
    bottomTabId: "bottom-nav-peserta",
    focusEl: "search-input",
  },
  checkin: {
    paneId: "pane-checkin",
    sidebarId: "nav-item-checkin",
    tabId: "tab-btn-checkin",
    bottomTabId: "bottom-nav-checkin",
    focusEl: "checkin-input",
  },
  scan: {
    paneId: "pane-checkin",
    sidebarId: "nav-item-scan",
    tabId: "tab-btn-checkin",
    bottomTabId: "bottom-nav-checkin",
    scrollToEl: "scanner-station-card",
  },
  analytics: {
    paneId: "pane-analytics",
    sidebarId: "nav-item-statistik",
    tabId: "tab-btn-analytics",
    bottomTabId: "bottom-nav-analytics",
  },
  settings: {
    paneId: "pane-settings",
    sidebarId: "nav-item-settings",
    tabId: "tab-btn-settings",
    bottomTabId: null,
  },
};

const ROUTE_ALIASES = {
  "#dashboard": "dashboard",
  "#peserta": "peserta",
  "#registry": "peserta",
  "#checkin": "checkin",
  "#scan": "scan",
  "#scan-qr": "scan",
  "#statistik": "analytics",
  "#analytics": "analytics",
  "#pengaturan": "settings",
  "#settings": "settings",
  "tab-registry": "peserta",
  "tab-checkin": "checkin",
  "tab-analytics": "analytics",
  "tab-settings": "settings",
  "pane-registry": "peserta",
  "pane-checkin": "checkin",
  "pane-analytics": "analytics",
  "pane-settings": "settings",
};

let routingInitialized = false;

function navigateToRoute(rawRoute, updateHash = true) {
  const clean = String(rawRoute || "").trim().toLowerCase();
  const resolvedKey = ROUTE_ALIASES[clean] || ROUTE_ALIASES[`#${clean.replace(/^#/, "")}`] || clean.replace(/^#/, "") || "dashboard";
  const config = ROUTE_CONFIG[resolvedKey] || ROUTE_CONFIG.dashboard;

  // 1. Activate Target Pane
  document.querySelectorAll(".dash-pane").forEach((p) => {
    p.classList.toggle("is-active", p.id === config.paneId);
  });

  // 2. Sync Sidebar Nav Items (EXACTLY 1 item gets is-active)
  document.querySelectorAll(".nav-item").forEach((item) => {
    const isActive = item.id === config.sidebarId;
    item.classList.toggle("is-active", isActive);
    if (isActive) {
      item.setAttribute("aria-current", "page");
    } else {
      item.removeAttribute("aria-current");
    }
  });

  // 3. Sync Horizontal Tab Buttons
  document.querySelectorAll(".dash-tab-btn").forEach((b) => {
    const isActive = b.id === config.tabId;
    b.classList.toggle("is-active", isActive);
    b.setAttribute("aria-selected", String(isActive));
  });

  // 4. Sync Mobile Bottom Nav Items
  document.querySelectorAll(".bottom-nav-item").forEach((b) => {
    const isActive = b.id === config.bottomTabId;
    b.classList.toggle("is-active", isActive);
  });

  // 5. Close Mobile Sidebar if open
  toggleSidebar(false);

  // 6. Update URL Hash cleanly without jumping
  if (updateHash) {
    const targetHash = `#${resolvedKey}`;
    if (window.location.hash !== targetHash) {
      if (window.history && window.history.replaceState) {
        window.history.replaceState(null, "", targetHash);
      } else {
        window.location.hash = targetHash;
      }
    }
  }

  // 7. Contextual Auto-focus & Scrolling
  if (config.focusEl) {
    setTimeout(() => {
      const el = document.getElementById(config.focusEl);
      if (el && typeof el.focus === "function") {
        el.focus();
      }
    }, 100);
  }

  if (config.scrollToEl) {
    setTimeout(() => {
      const el = document.querySelector(`.${config.scrollToEl}`) || document.getElementById(config.scrollToEl);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }, 100);
  }

  // 8. Re-render Charts if entering analytics
  if (config.paneId === "pane-analytics") {
    setTimeout(renderCharts, 60);
  }

  // 9. Stop scanner camera when navigating away from check-in pane
  if (config.paneId !== "pane-checkin" && typeof stopScanner === "function") {
    stopScanner();
  }
}

// Backward compatibility helper
function switchTab(target) {
  navigateToRoute(target, true);
}

function initDashboardRouting() {
  if (routingInitialized) return;
  routingInitialized = true;

  // Sidebar navigation click handlers
  document.querySelectorAll(".nav-item[data-route]").forEach((btn) => {
    btn.addEventListener("click", () => {
      navigateToRoute(btn.dataset.route, true);
    });
  });

  // Horizontal tab buttons click handlers
  document.querySelectorAll(".dash-tab-btn[data-route]").forEach((btn) => {
    btn.addEventListener("click", () => {
      navigateToRoute(btn.dataset.route, true);
    });
  });

  // Mobile bottom nav click handlers
  document.querySelectorAll(".bottom-nav-item[data-route]").forEach((btn) => {
    btn.addEventListener("click", () => {
      navigateToRoute(btn.dataset.route, true);
    });
  });

  // Browser back / forward buttons listener
  window.addEventListener("hashchange", () => {
    if (window.location.hash) {
      navigateToRoute(window.location.hash, false);
    }
  });

  // Handle initial page hash
  if (window.location.hash) {
    navigateToRoute(window.location.hash, false);
  } else {
    navigateToRoute("dashboard", false);
  }
}

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
    const qDigits = q.replace(/\D/g, "");
    let qSub = qDigits;
    if (qSub.startsWith("62")) qSub = qSub.slice(2);
    else if (qSub.startsWith("0")) qSub = qSub.slice(1);
    qSub = qSub.replace(/^0+/, "");

    list = list.filter((p) => {
      if (
        p.full_name?.toLowerCase().includes(q) ||
        p.qr_token?.toLowerCase().includes(q) ||
        p.institution?.toLowerCase().includes(q) ||
        p.email?.toLowerCase().includes(q) ||
        p.whatsapp?.toLowerCase().includes(q)
      ) {
        return true;
      }
      if (qSub.length >= 4 && p.whatsapp) {
        const pDigits = p.whatsapp.replace(/\D/g, "");
        return pDigits.includes(qSub);
      }
      return false;
    });
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
          ${isHadir ? "VALID TICKET" : "BELUM HADIR"}
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
            ${p.whatsapp ? `<a href="${formatWhatsAppChatUrl(p.whatsapp)}" target="_blank" rel="noopener">${esc(p.whatsapp)}</a>` : "-"}
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
      ${isHadir ? "Batalkan Check-in" : "Check-in Sekarang"}
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
let scanLock = false;
let scanCooldownTimer = null;
let audioCtx = null;

function getAudioContext() {
  try {
    if (!audioCtx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) audioCtx = new AudioContext();
    }
    if (audioCtx && audioCtx.state === "suspended") {
      audioCtx.resume().catch(() => {});
    }
    return audioCtx;
  } catch (_) {
    return null;
  }
}

function playScanAudio(type) {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    if (type === "success") {
      const freqs = [523.25, 659.25, 783.99, 1046.5];
      freqs.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, now + idx * 0.08);

        gain.gain.setValueAtTime(0.001, now + idx * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.24, now + idx * 0.08 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.08 + 0.28);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + idx * 0.08);
        osc.stop(now + idx * 0.08 + 0.3);
      });
    } else if (type === "already-checked" || type === "warning") {
      const tones = [440, 369.99];
      tones.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "triangle";
        osc.frequency.setValueAtTime(freq, now + idx * 0.15);

        gain.gain.setValueAtTime(0.001, now + idx * 0.15);
        gain.gain.exponentialRampToValueAtTime(0.26, now + idx * 0.15 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.15 + 0.26);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + idx * 0.15);
        osc.stop(now + idx * 0.15 + 0.28);
      });
    } else if (type === "error" || type === "invalid") {
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = "sawtooth";
      osc2.type = "sawtooth";
      osc1.frequency.setValueAtTime(220, now);
      osc2.frequency.setValueAtTime(216, now);
      osc1.frequency.exponentialRampToValueAtTime(120, now + 0.28);
      osc2.frequency.exponentialRampToValueAtTime(116, now + 0.28);

      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.3);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 0.31);
      osc2.stop(now + 0.31);
    }
  } catch (_) {
    // Non-blocking audio fallback
  }
}

function extractQrToken(raw) {
  if (!raw) return "";
  const match = String(raw).toUpperCase().match(/SGN11-[A-Z0-9]+/);
  return match ? match[0] : String(raw).trim().toUpperCase();
}

function renderCheckinStatus(state, payload) {
  const statusEl = document.getElementById("checkin-status");
  if (!statusEl) return;

  let kicker = "";
  let title = "";
  let meta = "";
  let badge = "";

  if (typeof payload === "string") {
    title = payload;
  } else if (payload && typeof payload === "object") {
    kicker = payload.kicker || "";
    title = payload.title || "";
    meta = payload.meta || "";
    badge = payload.badge || "";
  }

  let iconSvg = "";
  if (state === "success") {
    iconSvg = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>`;
  } else if (state === "already-checked") {
    iconSvg = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 9v4"/><path d="M12 17h.01"/><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/></svg>`;
  } else if (state === "verifying") {
    iconSvg = `<svg class="loading-spinner" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/></svg>`;
  } else {
    iconSvg = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>`;
  }

  statusEl.dataset.state = state;
  statusEl.innerHTML = `
    <div class="checkin-alert-icon-box" aria-hidden="true">
      ${iconSvg}
    </div>
    <div class="checkin-alert-content">
      ${kicker ? `<span class="checkin-alert-kicker">${esc(kicker)}</span>` : ""}
      <strong class="checkin-alert-title">${esc(title)}</strong>
      ${meta ? `<span class="checkin-alert-meta">${esc(meta)}</span>` : ""}
      ${badge ? `<span class="checkin-alert-badge">${esc(badge)}</span>` : ""}
    </div>
  `;
}

function renderScannerHud(state, data = {}) {
  const hud = document.getElementById("scanner-hud-overlay");
  if (!hud) return;

  hud.dataset.state = state;
  hud.classList.remove("hidden");

  if (state === "verifying") {
    hud.innerHTML = `
      <div class="hud-radar-spinner" aria-hidden="true"></div>
      <div class="hud-verifying-text">Memverifikasi Tiket...</div>
      <div class="hud-verifying-sub">${esc(data.token || "Menghubungkan ke basis data")}</div>
    `;
    return;
  }

  if (state === "success") {
    const p = data.participant || {};
    hud.innerHTML = `
      <div class="hud-icon-badge" aria-hidden="true">
        <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
      </div>
      <span class="hud-kicker">Presensi Berhasil</span>
      <h3 class="hud-name">${esc(p.full_name || "Peserta SOGA 11")}</h3>
      <div class="hud-meta">${esc(p.institution || "Peserta Umum")}</div>
      <div class="hud-token-pill">${esc(data.token || p.qr_token || "")}</div>
      <div class="hud-time">Check-in: ${esc(data.time || "Baru saja")}</div>
      <div class="scanner-hud-footer">
        <div class="hud-countdown-track" aria-hidden="true"><div class="hud-countdown-fill"></div></div>
        <button type="button" class="btn-hud-next" id="btn-hud-scan-next">Scan Tiket Berikutnya</button>
      </div>
    `;
  } else if (state === "already-checked") {
    const p = data.participant || {};
    hud.innerHTML = `
      <div class="hud-icon-badge" aria-hidden="true">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 9v4"/><path d="M12 17h.01"/><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/></svg>
      </div>
      <span class="hud-kicker">Perhatian: Sudah Hadir</span>
      <h3 class="hud-name">${esc(p.full_name || "Peserta SOGA 11")}</h3>
      <div class="hud-meta">${esc(p.institution || "Peserta Umum")}</div>
      <div class="hud-token-pill">${esc(data.token || p.qr_token || "")}</div>
      <div class="hud-time">Telah check-in pada: ${esc(data.time || "-")}</div>
      <div class="hud-warning-notice">Tiket ini telah diverifikasi sebelumnya. Presensi ganda otomatis dicegah.</div>
      <div class="scanner-hud-footer">
        <div class="hud-countdown-track" aria-hidden="true"><div class="hud-countdown-fill"></div></div>
        <button type="button" class="btn-hud-next" id="btn-hud-scan-next">Scan Tiket Berikutnya</button>
      </div>
    `;
  } else {
    // error / invalid
    hud.innerHTML = `
      <div class="hud-icon-badge" aria-hidden="true">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
      </div>
      <span class="hud-kicker">Peringatan Keamanan</span>
      <h3 class="hud-name">${esc(data.title || "Tiket Tidak Valid")}</h3>
      <div class="hud-meta">${esc(data.message || "Nomor tiket tidak terdaftar pada sistem presensi.")}</div>
      <div class="hud-token-pill">${esc(data.token || "-")}</div>
      <div class="scanner-hud-footer">
        <div class="hud-countdown-track" aria-hidden="true"><div class="hud-countdown-fill"></div></div>
        <button type="button" class="btn-hud-next" id="btn-hud-scan-next">Scan Tiket Berikutnya</button>
      </div>
    `;
  }

  const btnNext = hud.querySelector("#btn-hud-scan-next");
  if (btnNext) {
    btnNext.onclick = () => {
      resetScannerCooldown();
    };
  }
}

function startScannerCooldown(durationMs = 3500) {
  const laser = document.getElementById("scanner-laser-line");
  if (laser) laser.classList.add("hidden");
  if (scanCooldownTimer) clearTimeout(scanCooldownTimer);

  const btnNext = document.getElementById("btn-hud-scan-next");
  if (btnNext) {
    btnNext.addEventListener("click", () => {
      resetScannerCooldown();
    }, { once: true });
  }

  scanCooldownTimer = setTimeout(() => {
    resetScannerCooldown();
  }, durationMs);
}

function resetScannerCooldown() {
  if (scanCooldownTimer) {
    clearTimeout(scanCooldownTimer);
    scanCooldownTimer = null;
  }
  const hud = document.getElementById("scanner-hud-overlay");
  if (hud) {
    hud.classList.add("hidden");
    hud.innerHTML = "";
    delete hud.dataset.state;
  }
  const laser = document.getElementById("scanner-laser-line");
  const box = document.getElementById("scanner-box");
  if (laser && scanner && box && !box.classList.contains("hidden")) {
    laser.classList.remove("hidden");
  }
  scanLock = false;
}

async function doCheckin(rawToken, isFromCamera = false) {
  getAudioContext();
  const token = extractQrToken(rawToken);
  const isCameraActive = !!(scanner && scannerBox && !scannerBox.classList.contains("hidden"));

  if (!token || !token.startsWith("SGN11-")) {
    playScanAudio("error");
    renderCheckinStatus("invalid", {
      kicker: "Format Tiket Salah",
      title: "Format Ticket ID belum sesuai",
      meta: "Kode tiket wajib diawali 'SGN11-'. Contoh: SGN11-ABC123.",
      badge: rawToken || "KOSONG",
    });

    if (isCameraActive) {
      renderScannerHud("invalid", {
        title: "Format Tiket Tidak Sesuai",
        message: "Format kode tiket harus diawali SGN11-.",
        token: rawToken || "KOSONG",
      });
      startScannerCooldown();
    }
    return false;
  }

  // Check in-memory list
  const existing = participants.find(
    (p) => (p.qr_token || "").trim().toUpperCase() === token
  );

  // If already checked in
  if (existing && existing.status === "hadir") {
    playScanAudio("already-checked");
    const checkinTimeFormatted = existing.checkin_time
      ? new Date(existing.checkin_time).toLocaleTimeString("id-ID", {
          hour: "2-digit",
          minute: "2-digit",
        }) + " WIB"
      : "Waktu tidak tercatat";

    renderCheckinStatus("already-checked", {
      kicker: "Perhatian: Sudah Hadir",
      title: `${existing.full_name} sudah presensi`,
      meta: `Check-in tercatat pada pukul ${checkinTimeFormatted}. Mencegah presensi ganda.`,
      badge: existing.qr_token,
    });

    if (isCameraActive) {
      renderScannerHud("already-checked", {
        participant: existing,
        token: existing.qr_token,
        time: checkinTimeFormatted,
      });
      startScannerCooldown();
    }
    return false;
  }

  // Show verifying state
  if (isCameraActive) {
    renderScannerHud("verifying", { token });
  } else {
    renderCheckinStatus("verifying", {
      kicker: "Memverifikasi...",
      title: `Memproses presensi untuk ${existing ? existing.full_name : token}`,
      meta: "Menyinkronkan status dengan server presensi...",
      badge: token,
    });
  }

  try {
    await window.SOGA_API.checkInParticipant(token);

    const nowIso = new Date().toISOString();
    const timeFormatted =
      new Date(nowIso).toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
      }) + " WIB";

    // Immediate local optimistic update
    if (existing) {
      existing.status = "hadir";
      existing.checkin_time = nowIso;
    }

    renderStats();
    renderTable();
    renderCharts();

    playScanAudio("success");

    const displayName = existing ? existing.full_name : "Peserta SOGA 11";
    const displayInst = existing ? (existing.institution || "Peserta Umum") : "Berhasil diverifikasi";

    renderCheckinStatus("success", {
      kicker: "Presensi Berhasil",
      title: `${displayName} berhasil check-in`,
      meta: `${displayInst} - Waktu: ${timeFormatted}`,
      badge: token,
    });

    const input = document.getElementById("checkin-input");
    if (input) input.value = "";

    if (isCameraActive) {
      renderScannerHud("success", {
        participant: existing || { full_name: displayName, institution: displayInst, qr_token: token },
        token: token,
        time: timeFormatted,
      });
      startScannerCooldown();
    }

    loadParticipants().catch(() => {});
    return true;
  } catch (e) {
    playScanAudio("error");
    const errMsg = e.message || "Tiket tidak terdaftar atau koneksi terganggu.";

    renderCheckinStatus("error", {
      kicker: "Gagal Verifikasi",
      title: "Check-in tidak dapat diproses",
      meta: "Periksa kembali kode tiket atau status peserta dalam database.",
      badge: token,
    });

    if (isCameraActive) {
      renderScannerHud("error", {
        title: "Tiket Tidak Terdaftar",
        message: errMsg.includes("tidak ditemukan")
          ? errMsg
          : "Nomor tiket tidak terdaftar pada sistem presensi SOGA 11.",
        token: token,
      });
      startScannerCooldown();
    }
    return false;
  }
}

document.getElementById("btn-checkin")?.addEventListener("click", () => {
  getAudioContext();
  const input = document.getElementById("checkin-input");
  if (input) doCheckin(input.value);
});

document.getElementById("checkin-input")?.addEventListener("keypress", (e) => {
  if (e.key === "Enter") {
    getAudioContext();
    doCheckin(e.target.value);
  }
});

// QR Scanner via Camera
const btnScanToggle = document.getElementById("btn-scan-toggle");
const scanToggleLabel = document.getElementById("scan-toggle-label");
const scannerBox = document.getElementById("scanner-box");
const scannerPlaceholder = document.getElementById("scanner-placeholder");
const scannerLaserLine = document.getElementById("scanner-laser-line");
const scannerHudOverlay = document.getElementById("scanner-hud-overlay");

scannerHudOverlay?.addEventListener("click", (e) => {
  if (e.target && e.target.closest("#btn-hud-scan-next")) {
    resetScannerCooldown();
  }
});

btnScanToggle?.addEventListener("click", () => {
  getAudioContext();
  if (!scannerBox) return;

  if (scannerBox.classList.contains("hidden")) {
    scannerBox.classList.remove("hidden");
    scannerPlaceholder?.classList.add("hidden");
    scannerLaserLine?.classList.remove("hidden");
    scannerHudOverlay?.classList.add("hidden");
    if (scanToggleLabel) scanToggleLabel.textContent = "Tutup Kamera";

    if (!scanner && typeof Html5Qrcode !== "undefined") {
      scanner = new Html5Qrcode("scanner-box");
      scanner.start(
        { facingMode: "environment" },
        { fps: 15, qrbox: 250 },
        (text) => {
          if (scanLock) return;
          scanLock = true;
          doCheckin(text, true);
        },
        () => {}
      ).catch(() => {
        renderCheckinStatus("error", {
          kicker: "Akses Kamera Ditolak",
          title: "Kamera tidak dapat diakses",
          meta: "Pastikan izin kamera telah diberikan di browser atau gunakan input manual.",
        });
        stopScanner();
      });
    }
  } else {
    stopScanner();
  }
});

function stopScanner() {
  resetScannerCooldown();
  if (scannerBox) scannerBox.classList.add("hidden");
  if (scannerLaserLine) scannerLaserLine.classList.add("hidden");
  if (scannerPlaceholder) scannerPlaceholder.classList.remove("hidden");
  if (scanToggleLabel) scanToggleLabel.textContent = "Buka Kamera Scanner";
  if (scanner) {
    const cur = scanner;
    scanner = null;
    cur.stop().then(() => cur.clear()).catch(() => {});
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
