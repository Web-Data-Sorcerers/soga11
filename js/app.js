// ============================================================
// SOGA 11 — Router & App Logic
// Hash-based SPA: #home (default), #register
// ============================================================

// --- Konfigurasi event (ganti di sini) ---
const EVENT_DATE = "2026-10-25T08:00:00+07:00"; // Minggu, 25 Oktober 2026 — check-in dimulai
let homeCountdownTimer = null;
let routeRequestId = 0;

// ============================================================
// Router
// ============================================================
const routes = {
  home: "pages/home/home.html",
  register: "pages/register/register.html",
  "find-ticket": "pages/find-ticket/find-ticket.html",
};

const ANCHORS = new Set(["agenda", "speakers", "legacy", "faq"]);
const pageCache = new Map();

async function route() {
  const requestId = ++routeRequestId;
  const hash = location.hash.replace("#", "") || "home";

  if (ANCHORS.has(hash)) {
    if (!document.getElementById(hash)) {
      const loaded = await loadPage(routes.home, "home", requestId);
      if (!loaded || requestId !== routeRequestId) return;
    }
    const el = document.getElementById(hash);
    if (el) el.scrollIntoView({ behavior: "smooth" });
    else window.scrollTo(0, 0);
    return;
  }

  const target = routes[hash] || routes.home;
  const loaded = await loadPage(target, hash, requestId);
  if (!loaded || requestId !== routeRequestId) return;
  window.scrollTo(0, 0);
}

async function loadPage(target, hash, requestId) {
  const app = document.getElementById("app");
  if (target !== routes.home) stopHomeCountdown();
  try {
    let markup = pageCache.get(target);
    if (!markup) {
      const res = await fetch(target);
      markup = await res.text();
      pageCache.set(target, markup);
    }
    if (requestId !== routeRequestId) return false;
    app.innerHTML = markup;
    if (hash === "register") initRegister();
    else if (hash === "find-ticket") initFindTicket();
    else initHome();
    return true;
  } catch (e) {
    if (requestId !== routeRequestId) return false;
    app.innerHTML = `<div class="container" style="padding:60px 0"><p>Gagal memuat halaman. Pastikan dijalankan lewat server lokal (bukan file://).</p></div>`;
    return false;
  }
}

window.addEventListener("hashchange", route);

// ============================================================
// Public navigation
// ============================================================
function initNavbar() {
  const skipLink = document.querySelector(".skip-link");
  const burger = document.getElementById("hamburger");
  const menu = document.getElementById("mobile-menu");
  const backdrop = document.getElementById("mobile-menu-backdrop");
  const header = document.getElementById("site-header");
  if (!burger || !menu || !header) return;

  const burgerLabel = burger.querySelector(".menu-trigger-label");
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

  skipLink?.addEventListener("click", (event) => {
    const app = document.getElementById("app");
    if (!app) return;
    event.preventDefault();
    app.focus({ preventScroll: true });
    app.scrollIntoView({ behavior: reducedMotion.matches ? "auto" : "smooth" });
  });

  function getFocusableItems() {
    return [...menu.querySelectorAll(focusableSelector)].filter(
      (element) => !element.hidden && element.getClientRects().length
    );
  }

  function updateNavbarState() {
    const requestedHash = location.hash.replace("#", "") || "home";
    const isHomeOrAnchor = requestedHash === "home" || ANCHORS.has(requestedHash);
    
    // Hysteresis deadband: activate at >32px, release at <14px to prevent boundary jitter
    const isCurrentlyScrolled = header.classList.contains("is-scrolled");
    const threshold = isCurrentlyScrolled ? 14 : 32;
    const isScrolled = window.scrollY > threshold;

    header.classList.toggle("is-scrolled", isScrolled);
    header.classList.toggle("is-transparent", isHomeOrAnchor && !isScrolled);
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

    updateNavbarState();
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
    burger.classList.add("is-active");
    if (burgerLabel) burgerLabel.textContent = "Close";
    if (backdrop) backdrop.classList.add("is-open");

    requestAnimationFrame(() => {
      menu.classList.add("is-open");
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
    burger.classList.remove("is-active");
    if (burgerLabel) burgerLabel.textContent = "Menu";
    if (backdrop) backdrop.classList.remove("is-open");

    if (restoreFocus && !desktopNavigation.matches) burger.focus();
    closeTimer = window.setTimeout(() => {
      if (!menuOpen) menu.hidden = true;
    }, reducedMotion.matches ? 0 : 280);
  }

  burger.addEventListener("click", () => {
    if (menuOpen) closeMenu();
    else openMenu();
  });

  if (backdrop) {
    backdrop.addEventListener("click", () => closeMenu());
  }

  document.addEventListener("click", (event) => {
    if (!menuOpen) return;
    if (!menu.contains(event.target) && !burger.contains(event.target) && (!backdrop || !backdrop.contains(event.target))) {
      closeMenu();
    }
  });

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

  // Mobile menu links routing and smooth scroll
  menu.querySelectorAll("a[href]").forEach((link) => {
    link.addEventListener("click", (event) => {
      const href = link.getAttribute("href");
      closeMenu();
      if (!href || !href.startsWith("#")) return;

      const targetHash = href.replace("#", "");
      if (ANCHORS.has(targetHash) || targetHash === "home") {
        const currentHash = location.hash.replace("#", "") || "home";
        if (currentHash === "home" || ANCHORS.has(currentHash)) {
          // Already on home/anchor view: scroll directly!
          event.preventDefault();
          history.replaceState(null, "", href);
          updateActiveNavigation();
          if (targetHash === "home") {
            window.scrollTo({ top: 0, behavior: reducedMotion.matches ? "auto" : "smooth" });
          } else {
            const el = document.getElementById(targetHash);
            if (el) {
              el.scrollIntoView({ behavior: reducedMotion.matches ? "auto" : "smooth" });
            }
          }
        }
      }
    });
  });

  window.addEventListener("hashchange", () => {
    updateActiveNavigation();
    closeMenu();
  });

  let scrollTicking = false;
  window.addEventListener("scroll", () => {
    if (!scrollTicking) {
      requestAnimationFrame(() => {
        updateNavbarState();
        scrollTicking = false;
      });
      scrollTicking = true;
    }
  }, { passive: true });

  const handleDesktopChange = (event) => {
    if (event.matches) closeMenu({ restoreFocus: false });
  };
  desktopNavigation.addEventListener("change", handleDesktopChange);

  updateActiveNavigation();
  updateNavbarState();
}

// ============================================================
// Home: countdown
// ============================================================
function initReveal() {
  const targets = document.querySelectorAll(
    ".section-header, .timeline-item, .speaker-card, .legacy-card, .faq-item"
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

function initHeroMotion() {
  const hero = document.querySelector(".hero");
  if (!hero || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  hero.classList.add("is-motion-ready");
  requestAnimationFrame(() => {
    requestAnimationFrame(() => hero.classList.add("is-entered"));
  });
}

function stopHomeCountdown() {
  if (homeCountdownTimer === null) return;
  window.clearInterval(homeCountdownTimer);
  homeCountdownTimer = null;
}

// ============================================================
// Agenda Interactive Smart Progress Tracker & Dynamic Nodes
// ============================================================
function initAgendaInteractivity() {
  const ledgerList = document.querySelector(".agenda-ledger-list");
  if (!ledgerList) return;

  const items = Array.from(ledgerList.querySelectorAll(".agenda-item"));
  const activeTrack = ledgerList.querySelector(".timeline-active-track");
  const tracerBeacon = ledgerList.querySelector(".timeline-tracer-beacon");

  if (!items.length) return;

  function getNodeCenterOffset(item) {
    const node = item.querySelector(".timeline-axis-node");
    if (!node) return 0;
    const listRect = ledgerList.getBoundingClientRect();
    const nodeRect = node.getBoundingClientRect();
    return nodeRect.top + nodeRect.height / 2 - listRect.top;
  }

  function getBaseTopOffset() {
    const firstNode = items[0].querySelector(".timeline-axis-node");
    if (!firstNode) return 36;
    const listRect = ledgerList.getBoundingClientRect();
    const nodeRect = firstNode.getBoundingClientRect();
    return nodeRect.top + nodeRect.height / 2 - listRect.top;
  }

  let currentActiveItem = items.find((item) => item.hasAttribute("open")) || items[0];

  function updateTracker(targetItem) {
    if (!targetItem || !ledgerList.contains(targetItem)) return;
    const targetIndex = items.indexOf(targetItem);
    if (targetIndex === -1) return;

    const baseTop = getBaseTopOffset();
    const targetOffset = getNodeCenterOffset(targetItem);
    const trackHeight = Math.max(0, targetOffset - baseTop);

    if (activeTrack) {
      activeTrack.style.top = `${baseTop}px`;
      activeTrack.style.height = `${trackHeight}px`;
    }

    if (tracerBeacon) {
      tracerBeacon.classList.add("is-visible");
      tracerBeacon.style.top = `${targetOffset}px`;
    }

    // Only nodes that have been reached/passed by the timeline get is-passed (bold ungu)
    // Nodes ahead of the current active position remain clean and hollow (belum dilewati)
    items.forEach((item, index) => {
      if (index <= targetIndex) {
        item.classList.add("is-passed");
      } else {
        item.classList.remove("is-passed");
      }

      if (index === targetIndex) {
        item.classList.add("is-active");
      } else {
        item.classList.remove("is-active");
      }
    });
  }

  // Set initial position
  requestAnimationFrame(() => updateTracker(currentActiveItem));

  // Hover reactivity
  items.forEach((item) => {
    item.addEventListener("mouseenter", () => {
      updateTracker(item);
    });

    item.addEventListener("mouseleave", () => {
      const openItem = items.find((it) => it.hasAttribute("open")) || currentActiveItem;
      updateTracker(openItem);
    });

    // Details disclosure state change
    item.addEventListener("toggle", () => {
      if (item.hasAttribute("open")) {
        currentActiveItem = item;
        requestAnimationFrame(() => updateTracker(item));
      } else {
        const stillOpen = items.find((it) => it.hasAttribute("open"));
        currentActiveItem = stillOpen || items[0];
        requestAnimationFrame(() => updateTracker(currentActiveItem));
      }
    });

    // Tooltip and accessibility on node
    const node = item.querySelector(".timeline-axis-node");
    if (node) {
      node.style.cursor = "pointer";
      node.setAttribute("title", "Klik untuk melihat rincian sesi");
    }
  });

  // Re-calculate on resize
  let resizeTimer;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      const openItem = items.find((it) => it.hasAttribute("open")) || currentActiveItem;
      updateTracker(openItem);
    }, 100);
  });
}

// ============================================================
// Legacy Section: Archive Expansion Toggle & Chapter Linking
// ============================================================
function initLegacyArchiveToggle() {
  const toggleBtn = document.getElementById("btn-toggle-legacy-archive");
  const grid = document.querySelector(".legacy-editorial-grid");
  if (!toggleBtn || !grid) return;

  const labelEl = toggleBtn.querySelector(".expand-btn-text");
  const badgeEl = toggleBtn.querySelector(".expand-btn-badge");

  function setArchiveExpanded(expanded, shouldScroll = false) {
    grid.classList.toggle("is-expanded", expanded);
    toggleBtn.setAttribute("aria-expanded", expanded ? "true" : "false");

    if (labelEl) {
      labelEl.textContent = expanded
        ? "Sembunyikan Arsip Terdahulu"
        : "Buka Arsip Lengkap (10 Edisi Terdahulu: SOGA 01 – 06.2)";
    }
    if (badgeEl) {
      badgeEl.textContent = expanded ? "Tutup ↑" : "10 Edisi ↓";
    }

    if (!expanded && shouldScroll) {
      const controls = document.getElementById("legacy-archive-controls");
      controls?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }

  toggleBtn.addEventListener("click", () => {
    const isCurrentlyExpanded = grid.classList.contains("is-expanded");
    setArchiveExpanded(!isCurrentlyExpanded, isCurrentlyExpanded);
  });

  // Chapter pill integration: if clicking chapter 01-06, auto-expand if needed
  const chapterPills = document.querySelectorAll(".legacy-chapter-nav .chapter-pill");
  chapterPills.forEach((pill) => {
    pill.addEventListener("click", () => {
      const href = pill.getAttribute("href");
      if (!href || !href.startsWith("#soga-")) return;

      const targetCard = document.querySelector(href);
      if (targetCard && targetCard.classList.contains("legacy-card--archived")) {
        setArchiveExpanded(true, false);
      }
    });
  });
}

function initHome() {
  stopHomeCountdown();
  initReveal();
  initHeroMotion();
  initAgendaInteractivity();
  initLegacyArchiveToggle();
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
    const daysEl = document.getElementById("cd-days");
    const hoursEl = document.getElementById("cd-hours");
    const minsEl = document.getElementById("cd-mins");
    const secsEl = document.getElementById("cd-secs");
    if (!daysEl || !hoursEl || !minsEl || !secsEl) {
      stopHomeCountdown();
      return false;
    }

    const now = Date.now();
    let diff = target - now;
    const status = document.getElementById("countdown-text");

    if (diff <= 0) {
      if (status) status.textContent = "Acara sedang berlangsung!";
      daysEl.textContent = "00";
      hoursEl.textContent = "00";
      minsEl.textContent = "00";
      secsEl.textContent = "00";
      stopHomeCountdown();
      return false;
    }
    const d = Math.floor(diff / 86400000);
    const h = Math.floor((diff % 86400000) / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    const s = Math.floor((diff % 60000) / 1000);
    daysEl.textContent = String(d).padStart(2, "0");
    hoursEl.textContent = String(h).padStart(2, "0");
    minsEl.textContent = String(m).padStart(2, "0");
    secsEl.textContent = String(s).padStart(2, "0");
    return true;
  }
  if (tick()) homeCountdownTimer = window.setInterval(tick, 1000);
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

function renderTicketQr(container, ticketId) {
  if (!container || !ticketId) {
    throw new Error("QR container and ticket ID are required.");
  }

  const qrSize = window.matchMedia("(max-width: 479px)").matches ? 192 : 216;
  container.replaceChildren();
  container.dataset.qrPayload = ticketId;
  container.setAttribute(
    "aria-label",
    `QR tiket ${ticketId}. Ticket ID yang sama tersedia sebagai teks di bawah QR.`
  );

  new QRCode(container, {
    text: ticketId,
    width: qrSize,
    height: qrSize,
    colorDark: "#21152f",
    colorLight: "#ffffff",
  });

  return container.querySelector("canvas") || container.querySelector("img");
}

function renderParticipantCredential(target, participant) {
  const template = document.getElementById("participant-credential-template");
  const fullName = participant?.fullName?.trim();
  const ticketId = participant?.ticketId?.trim();
  if (!target || !template || !ticketId) {
    throw new Error("Credential target, template, and ticket ID are required.");
  }

  const fragment = template.content.cloneNode(true);
  const credential = fragment.querySelector("[data-credential-root]");
  const name = fragment.querySelector("[data-credential-name]");
  const ticket = fragment.querySelector("[data-credential-ticket]");
  const date = fragment.querySelector("[data-credential-date]");
  const location = fragment.querySelector("[data-credential-location]");
  const status = fragment.querySelector("[data-credential-status]");
  const qr = fragment.querySelector("[data-credential-qr]");

  name.textContent = fullName || "Nama peserta tidak tersedia";
  ticket.textContent = ticketId;
  date.textContent = participant.date || "25 OCT 2026";
  location.textContent = participant.location || "Yogyakarta";
  status.textContent = participant.status || "Registration Recorded";
  credential.setAttribute(
    "aria-label",
    `Participant Credential SOGA 11 untuk ${name.textContent}, Ticket ID ${ticketId}`
  );

  target.classList.remove("is-ready");
  target.replaceChildren(fragment);
  target.dataset.credentialRenderer = "participant-v1";
  renderTicketQr(qr, ticketId);

  requestAnimationFrame(() => target.classList.add("is-ready"));
  return credential;
}

function getCredentialQrSource(target) {
  return target?.querySelector("[data-credential-qr] canvas")
    || target?.querySelector("[data-credential-qr] img");
}

async function downloadTicketQr(target, ticketId) {
  const source = getCredentialQrSource(target);
  if (!source || !ticketId) return false;

  if (source instanceof HTMLImageElement && !source.complete) {
    await source.decode();
  }

  const sourceWidth = source.width || source.naturalWidth;
  const sourceHeight = source.height || source.naturalHeight;
  const quietZone = 24;
  const exportCanvas = document.createElement("canvas");
  exportCanvas.width = sourceWidth + quietZone * 2;
  exportCanvas.height = sourceHeight + quietZone * 2;

  const context = exportCanvas.getContext("2d");
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, exportCanvas.width, exportCanvas.height);
  context.drawImage(source, quietZone, quietZone, sourceWidth, sourceHeight);

  const link = document.createElement("a");
  link.href = exportCanvas.toDataURL("image/png");
  link.download = `${ticketId}.png`;
  link.click();
  return true;
}

/**
 * Normalisasi nomor WhatsApp Indonesia ke format kanonikal E.164 (+628...).
 * @param {string} raw
 * @returns {string}
 */
function normalizeIndonesianPhone(raw) {
  if (!raw) return "";
  let digits = String(raw).replace(/\D/g, "");
  if (digits.startsWith("62")) {
    digits = digits.slice(2);
  } else if (digits.startsWith("0")) {
    digits = digits.slice(1);
  }
  digits = digits.replace(/^0+/, "");
  return digits ? "+62" + digits : "";
}

async function initRegister() {
  const form = document.getElementById("register-form");
  if (!form) return;

  const loadingState = document.getElementById("register-loading");
  const closedState = document.getElementById("register-closed");
  const unavailableState = document.getElementById("register-status-error");
  const retryButton = document.getElementById("btn-retry-registration");
  const submitButton = document.getElementById("btn-submit");
  const submitLabel = document.getElementById("btn-submit-label");
  const submitStatus = document.getElementById("submit-status");
  const errorSummary = document.getElementById("form-error");

  const requiredFields = [
    "f-name", "f-email", "f-whatsapp", "f-gender",
    "f-institution", "f-job", "f-level", "f-focus",
    "f-source", "f-expectation",
  ];
  const consentFields = ["f-attend", "f-doc", "f-consent"];
  let isSubmitting = false;

  function showRegistrationView(view) {
    loadingState?.classList.toggle("hidden", view !== "loading");
    closedState?.classList.toggle("hidden", view !== "closed");
    unavailableState?.classList.toggle("hidden", view !== "error");
    form.classList.toggle("hidden", view !== "open");
  }

  async function checkRegistrationStatus() {
    showRegistrationView("loading");
    if (retryButton) retryButton.disabled = true;

    try {
      const open = await window.SOGA_API.isRegistrationOpen();
      showRegistrationView(open ? "open" : "closed");
    } catch (error) {
      showRegistrationView("error");
    } finally {
      if (retryButton) retryButton.disabled = false;
    }
  }

  function setFieldValidity(field, valid) {
    const group = field.closest(".form-group");
    field.classList.toggle("invalid", !valid);
    group?.classList.toggle("invalid", !valid);
    if (valid) field.removeAttribute("aria-invalid");
    else field.setAttribute("aria-invalid", "true");
  }

  function clearFieldError(field) {
    setFieldValidity(field, true);
    if (!errorSummary?.classList.contains("hidden")) {
      const hasInvalidField = [...requiredFields, ...consentFields].some((id) =>
        document.getElementById(id)?.hasAttribute("aria-invalid")
      );
      if (!hasInvalidField) errorSummary.classList.add("hidden");
    }
  }

  const whatsappInput = document.getElementById("f-whatsapp");
  if (whatsappInput) {
    whatsappInput.addEventListener("input", () => {
      let val = whatsappInput.value.replace(/[^\d+]/g, "");
      if (val.startsWith("+62")) val = val.slice(3);
      else if (val.startsWith("62")) val = val.slice(2);
      else if (val.startsWith("0")) val = val.slice(1);
      if (whatsappInput.value !== val) {
        whatsappInput.value = val;
      }
    });
  }

  retryButton?.addEventListener("click", checkRegistrationStatus);

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    errorSummary?.classList.add("hidden");
    submitStatus.classList.remove("is-error");
    submitStatus.textContent = "";

    let valid = true;
    let firstInvalidField = null;

    requiredFields.forEach((id) => {
      const el = document.getElementById(id);
      const ok = el.checkValidity();
      setFieldValidity(el, ok);
      if (!ok) {
        valid = false;
        firstInvalidField ||= el;
      }
    });

    consentFields.forEach((id) => {
      const el = document.getElementById(id);
      const ok = el.checkValidity();
      setFieldValidity(el, ok);
      if (!ok) {
        valid = false;
        firstInvalidField ||= el;
      }
    });

    if (!valid) {
      errorSummary?.classList.remove("hidden");
      firstInvalidField?.focus();
      return;
    }

    isSubmitting = true;
    submitButton.disabled = true;
    submitButton.setAttribute("aria-busy", "true");
    form.setAttribute("aria-busy", "true");
    submitLabel.textContent = "Memproses Pendaftaran…";
    submitStatus.textContent = "Menyimpan data pendaftaran…";

    const qrToken = generateToken();
    const data = {
      qr_token: qrToken,
      full_name: document.getElementById("f-name").value.trim(),
      email: document.getElementById("f-email").value.trim(),
      whatsapp: normalizeIndonesianPhone(document.getElementById("f-whatsapp").value),
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

    let registrationSaved = false;
    try {
      await window.SOGA_API.registerParticipant(data);
      registrationSaved = true;
    } catch (err) {
      submitStatus.classList.add("is-error");
      submitStatus.textContent = "Pendaftaran belum tersimpan karena gangguan sementara. Data yang kamu isi tetap tersedia; silakan coba lagi.";
    } finally {
      isSubmitting = false;
      submitButton.disabled = false;
      submitButton.removeAttribute("aria-busy");
      form.removeAttribute("aria-busy");
      submitLabel.textContent = "Daftar Sekarang";
    }

    if (registrationSaved) {
      showSuccess({ fullName: data.full_name, ticketId: qrToken });
    }
  });

  requiredFields.forEach((id) => {
    const el = document.getElementById(id);
    const eventName = el.tagName === "SELECT" ? "change" : "input";
    el.addEventListener(eventName, () => clearFieldError(el));
  });

  consentFields.forEach((id) => {
    const el = document.getElementById(id);
    el.addEventListener("change", () => clearFieldError(el));
  });

  // Stepper navigation and scroll spy
  const sectionIds = [
    "registration-section-01",
    "registration-section-02",
    "registration-section-03",
    "registration-section-04",
    "registration-section-05",
  ];
  const stepperItems = document.querySelectorAll(".stepper-item");
  const progressBar = document.getElementById("reg-progress-bar");
  const progressStatus = document.getElementById("reg-progress-status");

  function updateActiveStep(stepIndex) {
    stepperItems.forEach((item, idx) => {
      item.classList.toggle("is-active", idx === stepIndex);
    });
    const stepNum = stepIndex + 1;
    if (progressBar) progressBar.style.width = `${stepNum * 20}%`;
    if (progressStatus) progressStatus.textContent = `0${stepNum} / 05 COMPLETE`;
  }

  stepperItems.forEach((item, idx) => {
    const link = item.querySelector(".stepper-link");
    link?.addEventListener("click", (e) => {
      e.preventDefault();
      const targetSec = document.getElementById(sectionIds[idx]);
      if (targetSec) {
        targetSec.scrollIntoView({ behavior: "smooth", block: "start" });
        updateActiveStep(idx);
      }
    });
  });

  if ("IntersectionObserver" in window) {
    const sections = sectionIds.map((id) => document.getElementById(id)).filter(Boolean);
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const idx = sectionIds.indexOf(entry.target.id);
          if (idx !== -1) updateActiveStep(idx);
        }
      });
    }, { rootMargin: "-15% 0px -65% 0px" });

    sections.forEach((sec) => observer.observe(sec));
  }

  await checkRegistrationStatus();
}

function showSuccess(participant) {
  const form = document.getElementById("register-form");
  const success = document.getElementById("register-success");
  const credentialMount = document.getElementById("registration-credential");
  const downloadButton = document.getElementById("btn-download");
  if (!form || !success || !credentialMount || !downloadButton) return;

  renderParticipantCredential(credentialMount, participant);
  form.classList.add("hidden");
  success.classList.remove("hidden");
  document.getElementById("register-success-title")?.focus();

  downloadButton.onclick = () => {
    downloadTicketQr(credentialMount, participant.ticketId);
  };
}

// ============================================================
// Find Ticket: recover QR by email / WhatsApp
// ============================================================
function initFindTicket() {
  const form = document.getElementById("find-ticket-form");
  const input = document.getElementById("find-input");
  const btn = document.getElementById("btn-find");
  const submitLabel = document.getElementById("find-submit-label");
  const inputError = document.getElementById("find-input-error");
  const liveStatus = document.getElementById("find-status");
  const initial = document.getElementById("find-initial");
  const loading = document.getElementById("find-loading");
  const notFound = document.getElementById("find-not-found");
  const networkError = document.getElementById("find-network-error");
  const result = document.getElementById("find-result");
  const credentialMount = document.getElementById("find-credential");
  const editButton = document.getElementById("btn-find-edit");
  const retryButton = document.getElementById("btn-find-network-retry");
  const downloadButton = document.getElementById("btn-find-download");
  if (!form || !input || !btn || !credentialMount) return;

  const states = { initial, loading, notFound, networkError, result };
  let isSearching = false;
  let foundTicketId = "";

  function showFindState(activeState) {
    Object.values(states).forEach((state) => {
      state?.classList.toggle("hidden", state !== activeState);
    });
  }

  function clearInputError() {
    input.removeAttribute("aria-invalid");
    inputError?.classList.add("hidden");
  }

  function showInputError() {
    input.setAttribute("aria-invalid", "true");
    inputError?.classList.remove("hidden");
    liveStatus.textContent = "Data pencarian belum diisi.";
    input.focus();
  }

  async function doFind() {
    if (isSearching) return;
    const lookup = input.value.trim();
    if (!lookup) {
      showInputError();
      return;
    }

    clearInputError();
    foundTicketId = "";
    credentialMount.classList.remove("is-ready");
    credentialMount.replaceChildren();
    isSearching = true;
    btn.disabled = true;
    btn.setAttribute("aria-busy", "true");
    form.setAttribute("aria-busy", "true");
    input.readOnly = true;
    submitLabel.textContent = "Mencari Tiket…";
    liveStatus.textContent = "Mencari tiket…";
    showFindState(loading);

    try {
      const data = await window.SOGA_API.findTicket(lookup);
      if (!data) {
        foundTicketId = "";
        liveStatus.textContent = "Tiket tidak ditemukan.";
        showFindState(notFound);
        document.getElementById("find-not-found-title")?.focus();
        return;
      }

      foundTicketId = data.qr_token;
      renderParticipantCredential(credentialMount, {
        fullName: data.full_name,
        ticketId: data.qr_token,
      });
      liveStatus.textContent = "Credential ditemukan.";
      showFindState(result);
      document.getElementById("find-result-title")?.focus();
    } catch (e) {
      foundTicketId = "";
      liveStatus.textContent = "Tiket belum dapat dicari karena kendala sistem.";
      showFindState(networkError);
      document.getElementById("find-network-error-title")?.focus();
    } finally {
      isSearching = false;
      btn.disabled = false;
      btn.removeAttribute("aria-busy");
      form.removeAttribute("aria-busy");
      input.readOnly = false;
      submitLabel.textContent = "Cari Tiket";
    }
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    doFind();
  });

  input.addEventListener("input", () => {
    clearInputError();
    liveStatus.textContent = "";
    const hasResolvedState = [notFound, networkError, result].some(
      (state) => state && !state.classList.contains("hidden")
    );
    if (!isSearching && hasResolvedState) {
      foundTicketId = "";
      credentialMount.classList.remove("is-ready");
      credentialMount.replaceChildren();
      showFindState(initial);
    }
  });

  editButton?.addEventListener("click", () => {
    showFindState(initial);
    liveStatus.textContent = "Periksa kembali data pencarian.";
    input.focus();
    input.select();
  });

  retryButton?.addEventListener("click", doFind);

  downloadButton?.addEventListener("click", () => {
    downloadTicketQr(credentialMount, foundTicketId);
  });
}

// ============================================================
// Boot
// ============================================================
initNavbar();
route();
