import {
  injectBaseHref,
  isElectronDocumentPrintAvailable,
} from "./electronDocumentPrint";

export function printHtmlDocument(html, { jobTitle } = {}) {
  if (isElectronDocumentPrintAvailable()) {
    return window.api.documentPrint.preview({
      html: injectBaseHref(html),
      jobTitle: String(jobTitle || document.title || "Document").trim() || "Document",
    });
  }

  const iframe = document.createElement("iframe");
  iframe.style.position = "fixed";
  iframe.style.right = "0";
  iframe.style.bottom = "0";
  iframe.style.width = "0";
  iframe.style.height = "0";
  iframe.style.border = "0";
  iframe.style.opacity = "0";
  iframe.setAttribute("aria-hidden", "true");

  document.body.appendChild(iframe);

  const doc = iframe.contentWindow.document;
  doc.open();
  doc.write(html);
  doc.close();

  // Ensure images/qr load before printing
  const finalizePrint = () => {
    try {
      iframe.contentWindow.focus();
      iframe.contentWindow.print();
    } finally {
      // Cleanup (small delay helps some drivers)
      setTimeout(() => {
        document.body.removeChild(iframe);
      }, 500);
    }
  };

  // Wait for fonts/images
  const images = Array.from(doc.images || []);
  if (images.length === 0) {
    // fonts ready is supported in modern Chromium (Electron/Chrome)
    if (doc.fonts && doc.fonts.ready) {
      doc.fonts.ready.then(finalizePrint).catch(finalizePrint);
    } else {
      finalizePrint();
    }
    return;
  }

  let loaded = 0;
  const done = () => {
    loaded += 1;
    if (loaded >= images.length) {
      if (doc.fonts && doc.fonts.ready) {
        doc.fonts.ready.then(finalizePrint).catch(finalizePrint);
      } else {
        finalizePrint();
      }
    }
  };

  images.forEach((img) => {
    if (img.complete) return done();
    img.addEventListener("load", done);
    img.addEventListener("error", done);
  });
}
