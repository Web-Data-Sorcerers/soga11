// ============================================================
// SOGA 11 — Dashboard Admin Logic
// ============================================================
let participants = [];
let scanner = null;

const ICON_CHECK = '<svg class="ico" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg>';
const ICON_X = '<svg class="ico" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/></svg>';

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
      `<tr><td colspan="6" class="text-center">Gagal memuat data.</td></tr>`;
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
    body.innerHTML = `<tr><td colspan="6" class="text-center">Tidak ada data.</td></tr>`;
    return;
  }

  body.innerHTML = list
    .map(
      (p) => `
      <tr>
        <td>${p.qr_token}</td>
        <td><strong>${p.full_name}</strong></td>
        <td>${p.institution}</td>
        <td>${p.whatsapp}</td>
        <td><span class="badge ${p.status === "hadir" ? "badge-hadir" : "badge-pending"}">${p.status}</span></td>
        <td>${p.checkin_time ? new Date(p.checkin_time).toLocaleTimeString("id-ID") : "-"}</td>
      </tr>`
    )
    .join("");
}

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
