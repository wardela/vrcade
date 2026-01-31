import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
export default function BarcodeModal({
  open,
  onClose,
  onSubmit,
}) {
  const [barcode, setBarcode] = useState("");
  const inputRef = useRef(null);
  const {t} = useTranslation();
  useEffect(() => {
    if (open) {
      setBarcode("");
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  const handleSubmit = () => {
    const value = barcode.trim();
    if (!value) return;
    onSubmit(value);
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          {t("BarcodeModal.title")}
        </h3>

        <input
          ref={inputRef}
          type="text"
          value={barcode}
          onChange={(e) => setBarcode(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSubmit();
            if (e.key === "Escape") onClose();
          }}
          placeholder={t("BarcodeModal.placeholder")}
          className="input input-bordered w-full mb-4"
        />

        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="btn btn-ghost"
          >
            {t("BarcodeModal.actions.cancel")}
          </button>

          <button
            onClick={handleSubmit}
            className="btn btn-primary"
          >
            {t("BarcodeModal.actions.add")}
          </button>
        </div>
      </div>
    </div>
  );
}
