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

let claimPending = false;
let eligibleParticipant = null;

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

viewCertificateButton.addEventListener("click", () => {
  if (!eligibleParticipant) return;

  document.getElementById("cert-name").textContent = eligibleParticipant.full_name;
  document.getElementById("cert-verify").textContent = "ID: " + eligibleParticipant.qr_token;
  claimShell.classList.add("hidden");
  certificateArea.classList.remove("hidden");
  certificateArea.setAttribute("tabindex", "-1");
  certificateArea.focus();
});

// Download PNG
document.getElementById("btn-png").addEventListener("click", async () => {
  const node = document.getElementById("certificate");
  const canvas = await html2canvas(node, { scale: 2, backgroundColor: "#fffdf8" });
  const a = document.createElement("a");
  a.href = canvas.toDataURL("image/png");
  a.download = "sertifikat-soga11.png";
  a.click();
});

// Download PDF
document.getElementById("btn-pdf").addEventListener("click", async () => {
  const node = document.getElementById("certificate");
  const canvas = await html2canvas(node, { scale: 2, backgroundColor: "#fffdf8" });
  const img = canvas.toDataURL("image/png");
  const { jsPDF } = window.jspdf;
  const pdf = new jsPDF({ orientation: "landscape", unit: "px", format: [canvas.width, canvas.height] });
  pdf.addImage(img, "PNG", 0, 0, canvas.width, canvas.height);
  pdf.save("sertifikat-soga11.pdf");
});
