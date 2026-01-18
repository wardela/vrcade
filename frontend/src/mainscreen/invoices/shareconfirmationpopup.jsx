import React from "react";
import { useTranslation } from "react-i18next";
export default function ShareConfirmationPopup({
  invoiceNumber,
  onConfirm,
  onCancel,
}) {
  const {t} = useTranslation();
  return (
    <div
      className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[999]"
      onClick={onCancel}
      style={{ animation: "fadeIn 0.08s ease-out" }}
    >
      <div
        className="bg-white rounded-md shadow-xl border border-gray-200 w-[420px]"
        style={{ animation: "scaleIn 0.08s ease-out" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-3 border-b border-gray-200 bg-gray-50">
          <h2 className="text-[15px] font-semibold text-gray-800">
           {t("ShareConfirm.title")} <span className="font-bold">{invoiceNumber}</span>
          </h2>
        </div>

        {/* Body */}
        <div className="px-5 py-5 space-y-3">
            <p className="text-md font-semibold">{t("ShareConfirm.confirm_title")}</p>
          <p className="text-sm text-gray-600 leading-relaxed">
            {t("ShareConfirm.confirm_message")}
          </p>
        </div>

        {/* Footer */}
        <div className="px-5 pb-4 flex justify-end gap-2">
          <button
            onClick={onCancel}
            className="
              px-4 py-1.5
              text-[14px]
              border border-gray-300
              text-gray-700
              rounded
              hover:bg-gray-100
              transition
            "
          >
            {t("ShareConfirm.actions.no")}
          </button>

          <button
            onClick={onConfirm}
            className="
              px-4 py-1.5
              text-[14px]
              bg-[#2f788a]
              text-white
              rounded
              hover:bg-[#276472]
              transition
            "
          >
            {t("ShareConfirm.actions.yes")}
          </button>
        </div>
      </div>

      {/* Animations */}
      <style>
        {`
          @keyframes scaleIn {
            0% { transform: scale(0.97); opacity: 0; }
            100% { transform: scale(1); opacity: 1; }
          }
          @keyframes fadeIn {
            0% { opacity: 0; }
            100% { opacity: 1; }
          }
        `}
      </style>
    </div>
  );
}
