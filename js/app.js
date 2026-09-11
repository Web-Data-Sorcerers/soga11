// ============================================================
// SOGA 11 — Router & App Logic
// Hash-based SPA: #home (default), #register
// ============================================================

// --- Konfigurasi event (ganti di sini) ---
const EVENT_DATE = "2026-10-25T09:00:00+07:00"; // Minggu, 25 Oktober 2026

// ============================================================
// Router
// ============================================================
const routes = {
  home: "pages/home/home.html",
  register: "pages/register/register.html",
};

async function route() {
  const hash = location.hash.replace("#", "") || "home";
  const target = routes[hash] || routes.home;
  const app = document.getElementById("app");

  try {
    const res = await fetch(target);
    app.innerHTML = await res.text();
    if (hash === "register") initRegister();
    else initHome();
    window.scrollTo(0, 0);
  } catch (e) {
    app.innerHTML = `<div class="container" style="padding:60px 0"><p>Gagal memuat halaman. Pastikan dijalankan lewat server lokal (bukan file://).</p></div>`;
  }
}

window.addEventListener("hashchange", route);

// ============================================================
// Navbar (hamburger)
// ============================================================
function initNavbar() {
  const burger = document.getElementById("hamburger");
  const menu = document.getElementById("mobile-menu");
  if (burger && menu) {
    burger.addEventListener("click", () => menu.classList.toggle("open"));
    menu.querySelectorAll("a").forEach((a) =>
      a.addEventListener("click", () => menu.classList.remove("open"))
    );
  }
}

// ============================================================
// Home: countdown
// ============================================================
function initHome() {
  const cd = document.getElementById("countdown");
  if (!cd) return;

  if (!EVENT_DATE) {
    const status = document.getElementById("countdown-text");
    if (status) status.textContent = "Tanggal segera diumumkan";
    cd.style.display = "none";
    return;
  }

  const dateEl = document.getElementById("event-date");
  if (dateEl) {
    dateEl.textContent = new Date(EVENT_DATE).toLocaleDateString("id-ID", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  }

  const target = new Date(EVENT_DATE).getTime();

  function tick() {
    const now = Date.now();
    let diff = target - now;
    const status = document.getElementById("countdown-text");

    if (diff <= 0) {
      if (status) status.textContent = "Acara sedang berlangsung!";
      return;
    }
    const d = Math.floor(diff / 86400000);
    const h = Math.floor((diff % 86400000) / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    const s = Math.floor((diff % 60000) / 1000);
    document.getElementById("cd-days").textContent = String(d).padStart(2, "0");
    document.getElementById("cd-hours").textContent = String(h).padStart(2, "0");
    document.getElementById("cd-mins").textContent = String(m).padStart(2, "0");
    document.getElementById("cd-secs").textContent = String(s).padStart(2, "0");
  }
  tick();
  setInterval(tick, 1000);
}

// ============================================================
// Register: form + QR
// ============================================================
function generateToken() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return "SGN11-" + code;
}

function initRegister() {
  const form = document.getElementById("register-form");
  if (!form) return;

  const fields = [
    "f-name", "f-email", "f-whatsapp", "f-gender",
    "f-institution", "f-job", "f-level", "f-focus",
    "f-source", "f-expectation",
  ];

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const errBox = document.getElementById("form-error");
    errBox.classList.add("hidden");

    // Validasi
    let valid = true;
    fields.forEach((id) => {
      const el = document.getElementById(id);
      const ok = el.checkValidity();
      el.classList.toggle("invalid", !ok);
      el.closest(".form-group")?.classList.toggle("invalid", !ok);
      if (!ok) valid = false;
    });
    ["f-attend", "f-doc", "f-consent"].forEach((id) => {
      const el = document.getElementById(id);
      if (!el.checked) {
        valid = false;
        el.closest(".form-group")?.classList.add("invalid");
      }
    });

    if (!valid) {
      errBox.classList.remove("hidden");
      return;
    }

    const btn = document.getElementById("btn-submit");
    const status = document.getElementById("submit-status");
    btn.disabled = true;
    status.textContent = "Menyimpan data...";

    const qrToken = generateToken();
    const data = {
      qr_token: qrToken,
      full_name: document.getElementById("f-name").value.trim(),
      email: document.getElementById("f-email").value.trim(),
      whatsapp: document.getElementById("f-whatsapp").value.trim(),
      gender: document.getElementById("f-gender").value,
      institution: document.getElementById("f-institution").value.trim(),
      job: document.getElementById("f-job").value.trim(),
      linkedin: document.getElementById("f-linkedin").value.trim() || null,
      github: document.getElementById("f-github").value.trim() || null,
      level: document.getElementById("f-level").value,
      focus: document.getElementById("f-focus").value,
      tools: document.getElementById("f-tools").value.trim() || null,
      source: document.getElementById("f-source").value,
      expectation: document.getElementById("f-expectation").value.trim(),
      question: document.getElementById("f-question").value.trim() || null,
    };

    try {
      await window.SOGA_API.registerParticipant(data);
      showSuccess(qrToken);
    } catch (err) {
      status.textContent = "Gagal: " + (err.message || "terjadi kesalahan");
    } finally {
      btn.disabled = false;
    }
  });

  // Clear error styling on input
  fields.forEach((id) => {
    const el = document.getElementById(id);
    el.addEventListener("input", () => {
      el.classList.remove("invalid");
      el.closest(".form-group")?.classList.remove("invalid");
    });
  });
}

function showSuccess(qrToken) {
  document.getElementById("register-form").classList.add("hidden");
  document.getElementById("register-success").classList.remove("hidden");
  document.getElementById("ticket-id").textContent = qrToken;

  // Generate QR (encode token)
  const qrBox = document.getElementById("qr-code");
  qrBox.innerHTML = "";
  new QRCode(qrBox, {
    text: qrToken,
    width: 220,
    height: 220,
    colorDark: "#2a1a3d",
    colorLight: "#ffffff",
  });

  // Download QR sebagai PNG
  document.getElementById("btn-download").addEventListener("click", () => {
    const canvas = qrBox.querySelector("canvas") || qrBox.querySelector("img");
    if (!canvas) return;
    const url = canvas.toDataURL ? canvas.toDataURL("image/png") : canvas.src;
    const a = document.createElement("a");
    a.href = url;
    a.download = qrToken + ".png";
    a.click();
  });
}

// ============================================================
// Boot
// ============================================================
initNavbar();
route();
