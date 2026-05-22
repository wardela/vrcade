import { useMemo } from "react";
import { useReactToPrint as useBaseReactToPrint } from "react-to-print";

const readActiveStyles = () => {
  if (typeof document === "undefined") {
    return "";
  }

  let cssText = "";

  for (const styleSheet of Array.from(document.styleSheets)) {
    try {
      const rules = Array.from(styleSheet.cssRules || []);
      if (!rules.length) {
        continue;
      }

      cssText += `${rules.map((rule) => rule.cssText).join("\n")}\n`;
    } catch {
      // Ignore cross-origin or transient stylesheet access errors.
    }
  }

  return cssText;
};

export function useReactToPrint(options = {}) {
  const mergedPageStyle = useMemo(() => {
    const copiedStyles = readActiveStyles();
    const customPageStyle = options.pageStyle || "";

    return `${copiedStyles}\n${customPageStyle}`;
  }, [options.pageStyle]);

  return useBaseReactToPrint({
    ...options,
    copyStyles: true,
    pageStyle: mergedPageStyle,
  });
}
