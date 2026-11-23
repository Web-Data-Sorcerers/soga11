// ============================================================
// SOGA 11 — Certificate Claim & Output Logic
// ============================================================
const claimForm = document.getElementById("certificate-claim-form");
const claimInput = document.getElementById("claim-input");
const claimButton = document.getElementById("btn-claim");
const claimButtonLabel = claimButton.querySelector("[data-claim-button-label]");
const claimState = document.getElementById("claim-state");
const claimStateLabel = document.getElementById("claim-state-label");
const claimStateTitle = document.getElementById("claim-state-title");
const claimMessage = document.getElementById("claim-error");
const claimVerifiedDetails = document.getElementById("claim-verified-details");
const claimResultName = document.getElementById("claim-result-name");
const claimResultToken = document.getElementById("claim-result-token");
const viewCertificateButton = document.getElementById("btn-view-certificate");
const retryClaimButton = document.getElementById("btn-retry-claim");
const resetClaimButton = document.getElementById("btn-reset-claim");
const claimShell = document.getElementById("cert-claim-shell");
const certificateArea = document.getElementById("cert-area");
const certificatePreview = document.getElementById("certificate-preview");
const certificateNode = document.getElementById("certificate");
const certificateName = document.getElementById("cert-name");
const certificateVerification = document.getElementById("cert-verify");
const pngButton = document.getElementById("btn-png");
const pdfButton = document.getElementById("btn-pdf");
const pngButtonLabel = pngButton.querySelector('[data-export-label="png"]');
const pdfButtonLabel = pdfButton.querySelector('[data-export-label="pdf"]');
const exportStatus = document.getElementById("cert-export-status");

const CERTIFICATE_WIDTH = 1188;
const CERTIFICATE_HEIGHT = 840;
const A4_LANDSCAPE_WIDTH_MM = 297;
const A4_LANDSCAPE_HEIGHT_MM = 210;

let claimPending = false;
let eligibleParticipant = null;
let exportPending = false;
let currentCertMode = "participant";

const claimStates = {
  initial: {
    label: "VERIFICATION / READY",
    title: "Siapkan data pendaftaranmu.",
    message: "Hasil verifikasi akan ditampilkan di sini tanpa mengubah data peserta.",
  },
  invalid: {
    label: "INPUT / REQUIRED",
    title: "Data verifikasi belum diisi.",
    message: "Masukkan Ticket ID atau nomor WhatsApp untuk melanjutkan.",
  },
  loading: {
    label: "VERIFICATION / IN PROGRESS",
    title: "Memverifikasi kehadiran…",
    message: "Mohon tunggu sementara sistem memeriksa data yang kamu masukkan.",
  },
  eligible: {
    label: "ATTENDANCE / VERIFIED",
    title: "Peserta terverifikasi.",
    message: "Sertifikat partisipasi tersedia dan siap ditampilkan.",
  },
  unavailable: {
    label: "CERTIFICATE / UNAVAILABLE",
    title: "Sertifikat belum tersedia.",
    message: "Pastikan data yang kamu masukkan benar dan kehadiranmu telah terverifikasi.",
  },
  network: {
    label: "SYSTEM / UNAVAILABLE",
    title: "Verifikasi belum dapat dilakukan.",
    message: "Terjadi kendala saat menghubungi sistem. Silakan coba kembali.",
  },
};

function setClaimPending(isPending) {
  claimPending = isPending;
  claimButton.disabled = isPending;
  claimInput.readOnly = isPending;
  claimButton.setAttribute("aria-busy", String(isPending));
  claimForm.setAttribute("aria-busy", String(isPending));
  claimState.setAttribute("aria-busy", String(isPending));
  claimButtonLabel.textContent = isPending ? "MEMVERIFIKASI…" : "VERIFIKASI SEKARANG";
}

function renderClaimState(stateName, result = null, options = {}) {
  const state = claimStates[stateName];
  if (!state) return;

  claimState.dataset.state = stateName;
  claimStateLabel.textContent = state.label;
  claimStateTitle.textContent = state.title;
  claimMessage.textContent = state.message;

  claimVerifiedDetails.hidden = stateName !== "eligible";
  viewCertificateButton.hidden = stateName !== "eligible";
  resetClaimButton.hidden = stateName !== "eligible";
  retryClaimButton.hidden = stateName !== "network";

  if (stateName === "eligible" && result) {
    claimResultName.textContent = result.full_name || "Peserta";
    claimResultToken.textContent = result.qr_token || "";
  } else {
    claimResultName.textContent = "";
    claimResultToken.textContent = "";
  }

  claimState.classList.remove("is-state-entering");
  void claimState.offsetWidth;
  claimState.classList.add("is-state-entering");

  if (options.focusResult) {
    claimStateTitle.focus({ preventScroll: true });
    claimState.scrollIntoView({ block: "nearest" });
  }
}

async function claim() {
  if (claimPending) return;

  const input = claimInput.value.trim().toUpperCase();

  if (!input) {
    claimInput.setAttribute("aria-invalid", "true");
    renderClaimState("invalid");
    claimInput.focus();
    return;
  }

  claimInput.removeAttribute("aria-invalid");
  setClaimPending(true);
  renderClaimState("loading");

  try {
    const result = await window.SOGA_API.claimCertificate(input);
    if (!result) {
      eligibleParticipant = null;
      renderClaimState("unavailable", null, { focusResult: true });
      return;
    }

    eligibleParticipant = {
      full_name: result.full_name || "Peserta",
      qr_token: result.qr_token || "",
    };
    renderClaimState("eligible", eligibleParticipant, { focusResult: true });
  } catch (e) {
    eligibleParticipant = null;
    renderClaimState("network", null, { focusResult: true });
  } finally {
    setClaimPending(false);
  }
}

claimForm.addEventListener("submit", (event) => {
  event.preventDefault();
  claim();
});

claimInput.addEventListener("input", () => {
  if (claimInput.value.trim()) claimInput.removeAttribute("aria-invalid");
});

retryClaimButton.addEventListener("click", claim);

resetClaimButton.addEventListener("click", () => {
  eligibleParticipant = null;
  claimInput.value = "";
  claimInput.removeAttribute("aria-invalid");
  renderClaimState("initial");
  claimInput.focus();
});

// ============================================================
// Speaker Presets & Dynamic Mode Switcher
// ============================================================
const SPEAKER_PRESETS = {
  "speaker-nanda": {
    fullName: "Ananda Putra Akbarulloh",
    token: "SOGA11-SPK-NANDA",
    eyebrow: "DISTINGUISHED KEYNOTE HONORS   SOGA 11",
    title: "Certificate of Appreciation",
    award: "Dengan penuh rasa hormat & apresiasi tertinggi dianugerahkan kepada:",
    reason: "atas kontribusi, dedikasi, dan inspirasi luar biasa sebagai Pembicara Utama dalam membawakan materi:",
    theme: "“Menjadi Pahlawan Pendidikan di Era AI & Algoritma: Menjaga Karakter, Adab, dan Daya Juang”",
    sealCaption: "HONORED KEYNOTE SPEAKER",
  },
  "speaker-anin": {
    fullName: "Nina Nuraeni, S.Bns",
    token: "SOGA11-SPK-ANIN",
    eyebrow: "DISTINGUISHED KEYNOTE HONORS   SOGA 11",
    title: "Certificate of Appreciation",
    award: "Dengan penuh rasa hormat & apresiasi tertinggi dianugerahkan kepada:",
    reason: "atas kontribusi, dedikasi, dan inspirasi luar biasa sebagai Pembicara Utama dalam membawakan materi:",
    theme: "“Adab, Karakter, dan Daya Juang Generasi Digital di Tengah Kemudahan Teknologi”",
    sealCaption: "HONORED KEYNOTE SPEAKER",
  },
};

function renderCertificateQr(token) {
  const qrTarget = document.getElementById("cert-qr-target");
  if (!qrTarget) return;
  qrTarget.innerHTML = "";

  if (typeof window.QRCode === "function") {
    const verifyUrl = `https://soga.data-sorcerers.com/certificate.html?verify=${encodeURIComponent(token)}`;
    new window.QRCode(qrTarget, {
      text: verifyUrl,
      width: 28,
      height: 28,
      colorDark: "#171020",
      colorLight: "#faf7f0",
      correctLevel: window.QRCode.CorrectLevel.M,
    });
  }
}

function setCertificateMode(mode) {
  currentCertMode = mode;

  document.querySelectorAll(".cert-mode-pill").forEach((pill) => {
    pill.classList.toggle("is-active", pill.dataset.mode === mode);
  });

  const certTitle = document.getElementById("cert-title");
  const certEyebrow = document.getElementById("cert-eyebrow");
  const certAward = document.getElementById("cert-award");
  const certReason = document.getElementById("cert-reason");
  const certTheme = document.getElementById("cert-theme");
  const certSealCaption = document.getElementById("cert-seal-caption");

  if (mode === "participant") {
    certificateNode.classList.remove("cert-theme--speaker");
    certificateNode.classList.add("cert-theme--participant");

    const participant = eligibleParticipant || {
      full_name: "Nama Peserta",
      qr_token: "SGN11-XXXXXX",
    };

    applyCertificateName(participant.full_name);
    if (certificateVerification) certificateVerification.textContent = participant.qr_token;
    renderCertificateQr(participant.qr_token);

    if (certEyebrow) certEyebrow.textContent = "SORCERY GATHERING #11   OFFICIAL CREDENTIAL";
    if (certTitle) certTitle.textContent = "Certificate of Participation";
    if (certAward) certAward.textContent = "Dengan bangga dianugerahkan kepada:";
    if (certReason) certReason.textContent = "atas partisipasi aktif sebagai peserta dalam konferensi teknologi";
    if (certTheme) certTheme.textContent = "“Pahlawan Pendidikan di Era Algoritma: Menjaga Karakter, Adab, dan Daya Juang di Tengah Kemudahan Teknologi”";
    if (certSealCaption) certSealCaption.textContent = "OFFICIAL VERIFIED ATTENDEE";
  } else if (SPEAKER_PRESETS[mode]) {
    const spk = SPEAKER_PRESETS[mode];
    certificateNode.classList.remove("cert-theme--participant");
    certificateNode.classList.add("cert-theme--speaker");

    applyCertificateName(spk.fullName);
    if (certificateVerification) certificateVerification.textContent = spk.token;
    renderCertificateQr(spk.token);

    if (certEyebrow) certEyebrow.textContent = spk.eyebrow;
    if (certTitle) certTitle.textContent = spk.title;
    if (certAward) certAward.textContent = spk.award;
    if (certReason) certReason.textContent = spk.reason;
    if (certTheme) certTheme.textContent = spk.theme;
    if (certSealCaption) certSealCaption.textContent = spk.sealCaption;
  }
}

document.querySelectorAll(".cert-mode-pill").forEach((pill) => {
  pill.addEventListener("click", () => {
    setCertificateMode(pill.dataset.mode);
  });
});

function applyCertificateName(name) {
  const safeName = name || "Peserta";
  const nameLength = Array.from(safeName.trim()).length;

  certificateName.classList.remove("name-medium", "name-long", "name-extra-long");
  if (nameLength > 64) {
    certificateName.classList.add("name-extra-long");
  } else if (nameLength > 44) {
    certificateName.classList.add("name-long");
  } else if (nameLength > 27) {
    certificateName.classList.add("name-medium");
  }

  certificateName.textContent = safeName;
}

function syncCertificatePreviewScale() {
  const previewWidth = certificatePreview.clientWidth;
  if (!previewWidth) return;

  const scale = Math.min(1, previewWidth / CERTIFICATE_WIDTH);
  certificatePreview.style.setProperty("--certificate-preview-scale", String(scale));
}

if ("ResizeObserver" in window) {
  const certificateResizeObserver = new ResizeObserver(syncCertificatePreviewScale);
  certificateResizeObserver.observe(certificatePreview);
} else {
  window.addEventListener("resize", syncCertificatePreviewScale);
}

viewCertificateButton.addEventListener("click", () => {
  if (!eligibleParticipant) return;

  setCertificateMode("participant");
  claimShell.classList.add("hidden");
  certificateArea.classList.remove("hidden");
  certificateArea.setAttribute("tabindex", "-1");
  syncCertificatePreviewScale();
  certificateArea.focus();
});

function sanitizeFilenamePart(name) {
  const normalized = String(name || "Peserta")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-")
    .slice(0, 64);

  return normalized || "Peserta";
}

async function waitForCertificateAssets() {
  if (document.fonts) {
    await document.fonts.ready;
    await Promise.all([
      document.fonts.load('700 14px "Cinzel"', "DATA SORCERERS"),
      document.fonts.load('700 50px "Cormorant Garamond"', certificateName.textContent),
      document.fonts.load('700 38px "Cormorant Garamond"', "Certificate of Participation"),
      document.fonts.load('700 12px "Plus Jakarta Sans"', "Marchel Andrian Shevchenko"),
      document.fonts.load('700 12px "Plus Jakarta Sans"', "Daviq Nazril"),
    ]);
    await document.fonts.ready;
  }

  const bgPromise = new Promise((resolve, reject) => {
    const bgImg = new Image();
    bgImg.onload = () => resolve();
    bgImg.onerror = () => reject(new Error("Background template failed to load."));
    bgImg.src = "assets/certificate-template.jpg";
    if (bgImg.complete && bgImg.naturalWidth > 0) resolve();
  });

  const images = Array.from(certificateNode.querySelectorAll("img"));
  await Promise.all([
    bgPromise,
    ...images.map((image) => {
      if (image.complete) {
        return image.naturalWidth > 0
          ? Promise.resolve()
          : Promise.reject(new Error("Certificate image failed to load."));
      }

      return new Promise((resolve, reject) => {
        const timeoutId = window.setTimeout(
          () => reject(new Error("Certificate image load timed out.")),
          8000,
        );
        const resolveImage = () => {
          window.clearTimeout(timeoutId);
          resolve();
        };
        const rejectImage = () => {
          window.clearTimeout(timeoutId);
          reject(new Error("Certificate image failed to load."));
        };

        image.addEventListener("load", resolveImage, { once: true });
        image.addEventListener("error", rejectImage, { once: true });
      });
    })
  ]);
}

async function captureCertificateCanvas() {
  await waitForCertificateAssets();

  return window.html2canvas(certificateNode, {
    scale: 3,
    width: CERTIFICATE_WIDTH,
    height: CERTIFICATE_HEIGHT,
    windowWidth: CERTIFICATE_WIDTH,
    windowHeight: CERTIFICATE_HEIGHT,
    backgroundColor: "#faf8f5",
    useCORS: true,
    logging: false,
    onclone(clonedDocument) {
      const clonedCertificate = clonedDocument.getElementById("certificate");
      const clonedPreview = clonedDocument.getElementById("certificate-preview");

      clonedCertificate.style.transform = "none";
      clonedPreview.style.width = CERTIFICATE_WIDTH + "px";
      clonedPreview.style.height = CERTIFICATE_HEIGHT + "px";
      clonedPreview.style.overflow = "visible";
      clonedPreview.style.boxShadow = "none";
    },
  });
}

function setExportPending(type, isPending) {
  exportPending = isPending;
  pngButton.disabled = isPending;
  pdfButton.disabled = isPending;
  pngButton.setAttribute("aria-busy", String(isPending && type === "png"));
  pdfButton.setAttribute("aria-busy", String(isPending && type === "pdf"));
  pngButtonLabel.textContent = isPending && type === "png" ? "MENYIAPKAN PNG…" : "DOWNLOAD PNG";
  pdfButtonLabel.textContent = isPending && type === "pdf" ? "MENYIAPKAN PDF…" : "DOWNLOAD PDF";
}

function setExportStatus(message, state = "") {
  exportStatus.textContent = message;
  if (state) {
    exportStatus.dataset.state = state;
  } else {
    delete exportStatus.dataset.state;
  }
}

function downloadDataUrl(dataUrl, filename) {
  const a = document.createElement("a");
  a.href = dataUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

async function exportCertificate(type) {
  if (exportPending) return;

  const currentName = certificateName.textContent.trim() || "Peserta";
  const safeName = sanitizeFilenamePart(currentName);
  const prefix = currentCertMode.startsWith("speaker") ? "SOGA11-Speaker-" : "SOGA11-Certificate-";

  setExportPending(type, true);
  setExportStatus(type === "png" ? "Menyiapkan file PNG…" : "Menyiapkan file PDF A4…");

  try {
    const canvas = await captureCertificateCanvas();

    if (type === "png") {
      downloadDataUrl(canvas.toDataURL("image/png"), `${prefix}${safeName}.png`);
    } else {
      const image = canvas.toDataURL("image/png");
      const { jsPDF } = window.jspdf;
      const pdf = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4", compress: true });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const imageRatio = canvas.width / canvas.height;
      const pageRatio = pageWidth / pageHeight;
      let renderWidth = pageWidth;
      let renderHeight = pageHeight;

      if (imageRatio > pageRatio) {
        renderHeight = pageWidth / imageRatio;
      } else if (imageRatio < pageRatio) {
        renderWidth = pageHeight * imageRatio;
      }

      const offsetX = (pageWidth - renderWidth) / 2;
      const offsetY = (pageHeight - renderHeight) / 2;
      pdf.addImage(image, "PNG", offsetX, offsetY, renderWidth, renderHeight, undefined, "FAST");
      pdf.save(`${prefix}${safeName}.pdf`);
    }

    setExportStatus(
      type === "png" ? "PNG sertifikat berhasil disiapkan." : "PDF A4 sertifikat berhasil disiapkan.",
      "success",
    );
  } catch (error) {
    setExportStatus("Sertifikat belum dapat diunduh. Silakan coba kembali.", "error");
  } finally {
    setExportPending(type, false);
  }
}

pngButton.addEventListener("click", () => exportCertificate("png"));
pdfButton.addEventListener("click", () => exportCertificate("pdf"));

// Expose helpers for testing & external manipulation
window.setCertificateMode = setCertificateMode;
window.syncCertificatePreviewScale = syncCertificatePreviewScale;
