const PRINT_FALLBACK_TITLE = "Document";

const escapeAttribute = (value) =>
  String(value)
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;");

const getDoctype = (doc) => {
  if (!doc?.doctype) {
    return "<!DOCTYPE html>";
  }

  return new XMLSerializer().serializeToString(doc.doctype);
};

const ensureBaseTag = (doc, baseHref) => {
  if (!doc?.head || !baseHref || doc.head.querySelector("base")) {
    return;
  }

  const base = doc.createElement("base");
  base.setAttribute("href", baseHref);
  doc.head.prepend(base);
};

const replaceCanvasWithImages = (sourceDoc, targetDoc) => {
  const sourceCanvases = Array.from(sourceDoc.querySelectorAll("canvas"));
  const targetCanvases = Array.from(targetDoc.querySelectorAll("canvas"));

  sourceCanvases.forEach((canvas, index) => {
    const targetCanvas = targetCanvases[index];
    if (!targetCanvas) return;

    try {
      const image = targetDoc.createElement("img");

      Array.from(targetCanvas.attributes).forEach((attribute) => {
        image.setAttribute(attribute.name, attribute.value);
      });

      image.setAttribute("src", canvas.toDataURL("image/png"));
      image.setAttribute("alt", targetCanvas.getAttribute("alt") || "Canvas");
      targetCanvas.replaceWith(image);
    } catch (error) {
      console.warn("Failed to preserve canvas content for Electron printing", error);
    }
  });
};

const buildPrintableHtml = (doc, jobTitle) => {
  const parser = new DOMParser();
  const parsedDoc = parser.parseFromString(doc.documentElement.outerHTML, "text/html");

  replaceCanvasWithImages(doc, parsedDoc);
  ensureBaseTag(parsedDoc, doc.baseURI || document.baseURI || window.location.href);

  const nextTitle =
    String(jobTitle || parsedDoc.title || doc.title || document.title || PRINT_FALLBACK_TITLE).trim() ||
    PRINT_FALLBACK_TITLE;

  parsedDoc.title = nextTitle;

  return {
    html: `${getDoctype(doc)}\n${parsedDoc.documentElement.outerHTML}`,
    jobTitle: nextTitle,
  };
};

export function isElectronDocumentPrintAvailable() {
  return Boolean(window.api?.documentPrint?.preview);
}

export async function printIframeWithElectronPreview(target, { jobTitle } = {}) {
  const doc = target?.contentDocument;

  if (!doc) {
    throw new Error("Printable document was not ready.");
  }

  const payload = buildPrintableHtml(doc, jobTitle);
  return window.api.documentPrint.preview(payload);
}

export function wrapReactToPrintOptions(options = {}) {
  if (typeof options.print === "function" || !isElectronDocumentPrintAvailable()) {
    return options;
  }

  return {
    ...options,
    removeAfterPrint: options.removeAfterPrint ?? true,
    print: (target) =>
      printIframeWithElectronPreview(target, {
        jobTitle: options.documentTitle,
      }),
  };
}

export function injectBaseHref(html, baseHref = document.baseURI || window.location.href) {
  if (!baseHref || /<base\s/i.test(html)) {
    return html;
  }

  if (/<head[\s>]/i.test(html)) {
    return html.replace(
      /<head([^>]*)>/i,
      `<head$1><base href="${escapeAttribute(baseHref)}">`,
    );
  }

  return `<head><base href="${escapeAttribute(baseHref)}"></head>${html}`;
}
