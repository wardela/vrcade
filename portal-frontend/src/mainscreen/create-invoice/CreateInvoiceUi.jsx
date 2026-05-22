import { createPortal } from "react-dom";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";

export function ModalShell({ children, onClose, wide = false }) {
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  return createPortal(
    <div
      className="fixed inset-0 z-[120] grid place-items-end bg-[rgba(24,48,58,0.42)] p-0 md:place-items-center md:p-5"
      onClick={onClose}
    >
      <div
        onClick={(event) => event.stopPropagation()}
        className={`flex w-full max-h-[92dvh] flex-col overflow-hidden rounded-t-[28px] bg-white shadow-[0_-10px_40px_rgba(24,48,58,0.18)] md:rounded-[28px] ${
          wide ? "md:max-w-5xl" : "md:max-w-xl"
        }`}
      >
        {children}
      </div>
    </div>,
    document.body
  );
}

export function ModalHeader({ eyebrow = "Create Invoice", title, subtitle, onClose }) {
  const { t } = useTranslation();

  return (
    <div className="border-b border-[#e2ecef] px-5 py-5 sm:px-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="portal-eyebrow">{eyebrow || t("portalShell.modules.create_invoice")}</p>
          <h3 className="text-xl font-semibold text-slate-800">{title}</h3>
          {subtitle ? <p className="mt-1 text-sm text-slate-500">{subtitle}</p> : null}
        </div>

        <button
          type="button"
          onClick={onClose}
          className="inline-flex min-h-[46px] items-center justify-center rounded-[16px] border border-[#d9e8ec] bg-white px-4 text-sm font-semibold text-slate-600 transition hover:-translate-y-[1px]"
        >
          {t("portalCommon.actions.close")}
        </button>
      </div>
    </div>
  );
}

export function FieldLabel({ children, className = "" }) {
  return (
    <label className={`grid min-w-0 gap-2 text-sm font-semibold text-slate-600 ${className}`}>
      {children}
    </label>
  );
}

const BASE_FIELD_CLASS =
  "block min-h-[52px] min-w-0 w-full max-w-full rounded-[18px] border border-[#d8e6eb] bg-white px-4 py-3 text-sm text-slate-700 shadow-[0_12px_24px_rgba(39,89,104,0.07)] transition focus:border-[#2f788a] focus:outline-none focus:ring-4 focus:ring-[#2f788a]/10";

export function FieldInput({ className = "", ...props }) {
  return <input {...props} className={`${BASE_FIELD_CLASS} ${className}`} />;
}

export function FieldSelect({ className = "", ...props }) {
  return <select {...props} className={`${BASE_FIELD_CLASS} ${className}`} />;
}

export function FieldTextarea({ className = "", ...props }) {
  return <textarea {...props} className={`${BASE_FIELD_CLASS} min-h-[120px] ${className}`} />;
}

export function ActionButton({ children, tone = "ghost", className = "", ...props }) {
  const tones = {
    primary: "bg-[#2f788a] text-white shadow-[0_14px_28px_rgba(47,120,138,0.24)]",
    success: "bg-[#2e8b6d] text-white shadow-[0_14px_28px_rgba(46,139,109,0.22)]",
    dark: "bg-slate-800 text-white shadow-[0_14px_28px_rgba(15,23,42,0.18)]",
    secondary: "bg-[#eef6f9] text-[#2f788a]",
    ghost: "bg-white text-slate-600 border border-[#d9e8ec]",
    danger: "bg-[#fff1f1] text-[#c04848] border border-[#f0d0d0]",
  };

  return (
    <button
      {...props}
      className={`inline-flex min-h-[46px] items-center justify-center rounded-[16px] px-4 text-sm font-semibold transition hover:-translate-y-[1px] disabled:cursor-not-allowed disabled:opacity-60 ${tones[tone]} ${className}`}
    >
      {children}
    </button>
  );
}

export function EmptyState({ title, copy }) {
  return (
    <div className="rounded-[24px] border border-dashed border-[#dbe7ec] bg-[#fbfdfe] px-5 py-8 text-center">
      <h4 className="text-base font-semibold text-slate-800">{title}</h4>
      <p className="mt-2 text-sm leading-6 text-slate-500">{copy}</p>
    </div>
  );
}

export function Banner({ tone = "info", children }) {
  const tones = {
    info: "border-[#d9e8ec] bg-[#fbfdfe] text-slate-600",
    success: "border-[#cfe7dd] bg-[#f2fbf7] text-[#2e7c5b]",
    error: "border-[#f1d4d4] bg-[#fff7f7] text-[#8e3d3d]",
  };

  return (
    <div className={`rounded-[22px] border px-4 py-3 text-sm ${tones[tone]}`}>{children}</div>
  );
}

export function StatPill({ label, value, accent = false }) {
  return (
    <div
      className={`rounded-[18px] border px-4 py-3 shadow-[0_12px_24px_rgba(39,89,104,0.06)] ${
        accent
          ? "border-[#d7ebe9] bg-gradient-to-br from-[#f2fbf7] to-white"
          : "border-[#dbe7ec] bg-white"
      }`}
    >
      <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">{label}</p>
      <div className="mt-2 text-base font-semibold text-slate-800">{value}</div>
    </div>
  );
}
