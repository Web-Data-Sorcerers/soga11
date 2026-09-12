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
  "find-ticket": "pages/find-ticket/find-ticket.html",
};

const ANCHORS = new Set(["agenda", "speakers", "legacy", "faq"]);

async function route() {
  const hash = location.hash.replace("#", "") || "home";

  if (ANCHORS.has(hash)) {
    if (!document.getElementById(hash)) {
      await loadPage(routes.home, "home");
    }
    const el = document.getElementById(hash);
    if (el) el.scrollIntoView({ behavior: "smooth" });
    else window.scrollTo(0, 0);
    return;
  }

  const target = routes[hash] || routes.home;
  await loadPage(target, hash);
  window.scrollTo(0, 0);
}

async function loadPage(target, hash) {
  const app = document.getElementById("app");
  try {
    const res = await fetch(target);
    app.innerHTML = await res.text();
    if (hash === "register") initRegister();
    else if (hash === "find-ticket") initFindTicket();
    else initHome();
  } catch (e) {
    app.innerHTML = `<div class="container" style="padding:60px 0"><p>Gagal memuat halaman. Pastikan dijalankan lewat server lokal (bukan file://).</p></div>`;
  }
}

window.addEventListener("hashchange", route);

// ============================================================
// Public navigation
// ============================================================
function initNavbar() {
  const burger = document.getElementById("hamburger");
  const menu = document.getElementById("mobile-menu");
  const closeButton = document.getElementById("mobile-menu-close");
  const header = document.getElementById("site-header");
  if (!burger || !menu || !closeButton || !header) return;

  const focusableSelector = [
    "a[href]",
    "button:not([disabled])",
    "input:not([disabled])",
    "select:not([disabled])",
    "textarea:not([disabled])",
    "[tabindex]:not([tabindex='-1'])",
  ].join(",");
  const desktopNavigation = window.matchMedia("(min-width: 1024px)");
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  let menuOpen = false;
  let closeTimer = null;

  function getFocusableItems() {
    return [...menu.querySelectorAll(focusableSelector)].filter(
      (element) => !element.hidden && element.getClientRects().length
    );
  }

  function updateActiveNavigation() {
    const requestedHash = location.hash.replace("#", "") || "home";
    const isKnownHash = Boolean(routes[requestedHash]) || ANCHORS.has(requestedHash);
    const activeHash = isKnownHash ? requestedHash : "home";

    document.querySelectorAll("[data-nav-link]").forEach((link) => {
      const linkHash = link.getAttribute("href")?.replace("#", "");
      const active = linkHash === activeHash;
      link.classList.toggle("is-active", active);
      if (active) link.setAttribute("aria-current", "page");
      else link.removeAttribute("aria-current");
    });
  }

  function openMenu() {
    if (menuOpen || desktopNavigation.matches) return;
    clearTimeout(closeTimer);
    menuOpen = true;
    menu.hidden = false;
    menu.inert = false;
    menu.setAttribute("aria-hidden", "false");
    burger.setAttribute("aria-expanded", "true");
    burger.setAttribute("aria-label", "Tutup menu navigasi");
    document.body.classList.add("mobile-menu-open");

    requestAnimationFrame(() => {
      menu.classList.add("is-open");
      closeButton.focus();
    });
  }

  function closeMenu({ restoreFocus = true } = {}) {
    if (!menuOpen) return;
    menuOpen = false;
    menu.classList.remove("is-open");
    menu.inert = true;
    menu.setAttribute("aria-hidden", "true");
    burger.setAttribute("aria-expanded", "false");
    burger.setAttribute("aria-label", "Buka menu navigasi");
    document.body.classList.remove("mobile-menu-open");

    if (restoreFocus && !desktopNavigation.matches) burger.focus();
    closeTimer = window.setTimeout(() => {
      if (!menuOpen) menu.hidden = true;
    }, reducedMotion.matches ? 0 : 280);
  }

  burger.addEventListener("click", () => {
    if (menuOpen) closeMenu();
    else openMenu();
  });
  closeButton.addEventListener("click", () => closeMenu());

  menu.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      event.preventDefault();
      closeMenu();
      return;
    }
    if (event.key !== "Tab") return;

    const focusableItems = getFocusableItems();
    if (!focusableItems.length) return;
    const first = focusableItems[0];
    const last = focusableItems[focusableItems.length - 1];

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  });

  menu.querySelectorAll("a[href]").forEach((link) => {
    link.addEventListener("click", () => closeMenu());
  });

  window.addEventListener("hashchange", () => {
    updateActiveNavigation();
    closeMenu();
  });
  window.addEventListener("scroll", () => {
    header.classList.toggle("is-scrolled", window.scrollY > 16);
  }, { passive: true });

  const handleDesktopChange = (event) => {
    if (event.matches) closeMenu({ restoreFocus: false });
  };
  desktopNavigation.addEventListener("change", handleDesktopChange);

  updateActiveNavigation();
  header.classList.toggle("is-scrolled", window.scrollY > 16);
}

// ============================================================
// Home: countdown
// ============================================================
function initReveal() {
  const targets = document.querySelectorAll(
    ".hero-copy, .hero-visual, .section-header, .stat-card, .timeline-item, .speaker-card, .legacy-card, .faq-item"
  );
  targets.forEach((t) => t.classList.add("reveal"));
  if (!targets.length) return;

  if (!("IntersectionObserver" in window)) {
    targets.forEach((t) => t.classList.add("revealed"));
    return;
  }

  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("revealed");
          io.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
  );
  targets.forEach((t) => io.observe(t));
}

function initHome() {
  initReveal();
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

async function initRegister() {
  const form = document.getElementById("register-form");
  if (!form) return;

  let open = true;
  try {
    open = await window.SOGA_API.isRegistrationOpen();
  } catch (e) {
    open = true;
  }
  if (!open) {
    form.classList.add("hidden");
    document.getElementById("register-closed").classList.remove("hidden");
    return;
  }

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
// Find Ticket: recover QR by email / WhatsApp
// ============================================================
function initFindTicket() {
  const input = document.getElementById("find-input");
  const btn = document.getElementById("btn-find");
  const err = document.getElementById("find-error");
  const result = document.getElementById("find-result");
  if (!input || !btn) return;

  async function doFind() {
    const lookup = input.value.trim();
    if (!lookup) return;
    err.classList.add("hidden");
    result.classList.add("hidden");
    btn.disabled = true;
    try {
      const data = await window.SOGA_API.findTicket(lookup);
      if (!data) {
        err.classList.remove("hidden");
        return;
      }
      document.getElementById("find-name").textContent = data.full_name;
      document.getElementById("find-ticket-id").textContent = data.qr_token;
      const qrBox = document.getElementById("find-qr");
      qrBox.innerHTML = "";
      new QRCode(qrBox, {
        text: data.qr_token,
        width: 220,
        height: 220,
        colorDark: "#2a1a3d",
        colorLight: "#ffffff",
      });
      result.classList.remove("hidden");
    } catch (e) {
      err.classList.remove("hidden");
    } finally {
      btn.disabled = false;
    }
  }

  btn.addEventListener("click", doFind);
  input.addEventListener("keypress", (e) => {
    if (e.key === "Enter") doFind();
  });

  document.getElementById("btn-find-download").addEventListener("click", () => {
    const qrBox = document.getElementById("find-qr");
    const canvas = qrBox.querySelector("canvas") || qrBox.querySelector("img");
    if (!canvas) return;
    const url = canvas.toDataURL ? canvas.toDataURL("image/png") : canvas.src;
    const a = document.createElement("a");
    a.href = url;
    a.download = document.getElementById("find-ticket-id").textContent + ".png";
    a.click();
  });
}

// ============================================================
// Boot
// ============================================================
initNavbar();
route();
