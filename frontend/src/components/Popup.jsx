import React, { useEffect } from "react";

export default function Popup({ message, onClose }) {
  useEffect(() => {
  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      onClose();
    }
  };

  window.addEventListener("keydown", handleKeyDown);

  return () => {
    window.removeEventListener("keydown", handleKeyDown);
  };
}, [onClose]);

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[999]"
      onClick={onClose}
      style={{ animation: "fadeIn 0.07s ease-out" }}
    >
      <div
        className="bg-white rounded-md shadow-xl border border-gray-200 w-[380px]"
        style={{ animation: "scaleIn 0.07s ease-out" }}
        onClick={(e) => e.stopPropagation()} // STOP CLICK FROM CLOSING POPUP
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-200 bg-gray-50 rounded-t-xl">
          <span className="text-[15px] font-semibold text-gray-800">
            System Message
          </span>
        </div>

        {/* Body */}
        <div className="px-5 py-5 text-start">
          <p className="text-gray-700 text-[15px] leading-relaxed">
            {message}
          </p>
        </div>

        {/* Footer (new elegant button) */}
        <div className="px-5 pb-4 flex justify-end">
          <button
            onClick={onClose}
            className="
              px-4 
              py-1.5
              text-[14px]
              bg-[#2f788a]
              text-white
              rounded-[4px]
              hover:bg-[#276472]
              transition
              border border-[#26606f]/40
            "
          >
            OK
          </button>
        </div>
      </div>

      {/* Animations */}
      <style>
        {`
          @keyframes scaleIn {
            0% { transform: scale(0.9); opacity: 0; }
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
