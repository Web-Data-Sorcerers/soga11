// ============================================================
// SOGA 11 — Certificate Claim Logic
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
  // Restart the restrained state-enter animation without hiding content by default.
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

  applyCertificateName(eligibleParticipant.full_name);
  certificateVerification.textContent = eligibleParticipant.qr_token;
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
      document.fonts.load('600 71px "Cormorant Garamond"', certificateName.textContent),
      document.fonts.load('600 67px "Cormorant Garamond"', "Certificate of Participation"),
    ]);
    await document.fonts.ready;
  }

  const images = Array.from(certificateNode.querySelectorAll("img"));
  await Promise.all(images.map((image) => {
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
  }));
}

async function captureCertificateCanvas() {
  await waitForCertificateAssets();

  return window.html2canvas(certificateNode, {
    scale: 2,
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
  if (exportPending || !eligibleParticipant) return;

  setExportPending(type, true);
  setExportStatus(type === "png" ? "Menyiapkan file PNG…" : "Menyiapkan file PDF A4…");

  try {
    const canvas = await captureCertificateCanvas();
    const safeName = sanitizeFilenamePart(eligibleParticipant.full_name);

    if (type === "png") {
      downloadDataUrl(canvas.toDataURL("image/png"), `SOGA11-Certificate-${safeName}.png`);
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
      pdf.save(`SOGA11-Certificate-${safeName}.pdf`);
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
