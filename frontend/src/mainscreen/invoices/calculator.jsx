import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
const keys = [
  "7","8","9","/",
  "4","5","6","*",
  "1","2","3","-",
  "0",".","=","+",
];

const allowedKeys = [
  "0","1","2","3","4","5","6","7","8","9",
  "+","-","*","/","."
];

const CalculatorPopup = ({ open, onClose }) => {
  const [display, setDisplay] = useState("0");
  const {t} = useTranslation();
  const append = (val) => {
    setDisplay(prev =>
      prev === "0" && val !== "." ? val : prev + val
    );
  };

  const clear = () => setDisplay("0");

  const calculate = () => {
    try {
      // eslint-disable-next-line no-new-func
      const result = Function(`"use strict"; return (${display})`)();
      setDisplay(
        Number.isFinite(result) ? result.toString() : "Error"
      );
    } catch {
      setDisplay("Error");
    }
  };

  const copyAndClose = async () => {
  try {
    await navigator.clipboard.writeText(display);
    onClose();
  } catch (err) {
    console.error("Failed to copy", err);
  }
};

  // Keyboard support
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e) => {
      e.stopPropagation();

      if (allowedKeys.includes(e.key)) {
        append(e.key);
        return;
      }

      if (e.key === "Enter") {
        calculate();
        return;
      }

      if (e.key === "Backspace") {
        setDisplay(prev =>
          prev.length > 1 ? prev.slice(0, -1) : "0"
        );
        return;
      }

      if (e.key === "Escape") {
        onClose();
      }

      if ((e.ctrlKey || e.metaKey) && e.key === "c") {
    copyAndClose();
    }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, display]);

  if (!open) return null;

  return (
<div
 dir="ltr" className="fixed inset-0 z-50 flex items-center justify-center
             bg-black/40 backdrop-blur-sm"
  onClick={onClose}
>
<div
  className="w-[320px] rounded-2xl overflow-hidden
             bg-white/90 backdrop-blur-xl
             shadow-[0_30px_80px_rgba(0,0,0,0.35)]
             border border-white/40"
  onClick={(e) => e.stopPropagation()}
>

        {/* Header */}
        <div className="flex justify-between items-center px-4 py-3">
          <span className="text-sm font-semibold tracking-wide text-gray-700">
            Calculator
          </span>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 transition"
          >
            ✕
          </button>
        </div>

        {/* Display */}
        <div className="px-4 py-4 text-right text-3xl font-mono
                        text-gray-900 bg-gradient-to-b
                        from-gray-50 to-white border-y">
          {display}
        </div>

{/* Copy result */}
<div className="px-4 py-2 border-b bg-white">
  <button
    onClick={copyAndClose}
    className="w-full py-2 rounded-lg text-sm font-semibold
               bg-gradient-to-r from-[#2f788a] to-[#245e6d]
               text-white hover:brightness-110 transition"
  >
    {t("Invoices.calculator_copy")}
  </button>
</div>

        {/* Buttons */}
        <div className="grid grid-cols-4 gap-px bg-gray-200">
          <button
            onClick={clear}
            className="col-span-4 py-3 text-sm font-semibold
                       bg-gradient-to-r from-red-50 to-red-100
                       text-red-700 hover:from-red-100 hover:to-red-200
                       transition"
          >
            Clear
          </button>

          {keys.map((k) => (
            <button
              key={k}
              onClick={() => (k === "=" ? calculate() : append(k))}
              className={`py-4 text-lg font-medium transition
                ${
                  k === "="
                    ? "bg-gradient-to-b from-[#2f788a] to-[#245e6d] text-white hover:brightness-110"
                    : "+-*/".includes(k)
                      ? "bg-gray-100 text-[#2f788a] hover:bg-gray-200"
                      : "bg-white hover:bg-gray-100 text-gray-900"
                }`}
            >
              {k}
            </button>
          ))}
        </div>

        {/* Footer branding */}
        <div className="px-4 py-2 text-center text-[11px]
                        tracking-wide text-gray-400 bg-white">
          Powered by <span className="font-semibold text-gray-500">
            INNOVATION ELEMENTS™
          </span>
        </div>

      </div>
    </div>
  );
};

export default CalculatorPopup;
