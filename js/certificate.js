// ============================================================
// SOGA 11 — Certificate Claim Logic
// ============================================================
async function claim() {
  const input = document.getElementById("claim-input").value.trim().toUpperCase();
  const err = document.getElementById("claim-error");
  err.classList.add("hidden");

  if (!input) return;

  try {
    const result = await window.SOGA_API.claimCertificate(input);
    if (!result) {
      err.classList.remove("hidden");
      return;
    }
    // Tampilkan sertifikat
    document.getElementById("cert-name").textContent = result.full_name;
    document.getElementById("cert-verify").textContent = "ID: " + result.qr_token;
    document.querySelector(".cert-claim").classList.add("hidden");
    document.getElementById("cert-area").classList.remove("hidden");
  } catch (e) {
    err.classList.remove("hidden");
  }
}

document.getElementById("btn-claim").addEventListener("click", claim);
document.getElementById("claim-input").addEventListener("keypress", (e) => {
  if (e.key === "Enter") claim();
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
