import { useTranslation } from "react-i18next";
export default function HeldInvoicesModal({
  open,
  invoices,
  onSelect,
  onClose,
}) {
  const {t} = useTranslation();
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-indigo-50 to-purple-50">
          <div className="flex items-center gap-2">
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              width="20" 
              height="20" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
              className="text-indigo-600"
            >
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="9" y1="15" x2="15" y2="15"/>
            </svg>
            <h2 className="font-semibold text-gray-800">{t("HeldInvoicesModal.title")}</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg p-1.5 transition-colors"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M5 5L15 15M15 5L5 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="divide-y divide-gray-100 max-h-[60vh] overflow-y-auto">
          {invoices.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                width="48" 
                height="48" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="1.5" 
                strokeLinecap="round" 
                strokeLinejoin="round"
                className="mx-auto mb-3 text-gray-300"
              >
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
              </svg>
              <p className="text-sm">{t("HeldInvoicesModal.empty")}</p>
            </div>
          ) : (
            invoices.map(inv => (
              <div
                key={inv.id}
                onClick={() => onSelect(inv)}
                className="p-4 cursor-pointer hover:bg-indigo-50 transition-colors group"
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center flex-shrink-0">
                      <svg 
                        xmlns="http://www.w3.org/2000/svg" 
                        width="16" 
                        height="16" 
                        viewBox="0 0 24 24" 
                        fill="none" 
                        stroke="currentColor" 
                        strokeWidth="2" 
                        strokeLinecap="round" 
                        strokeLinejoin="round"
                        className="text-indigo-600"
                      >
                        <path d="M16 2v2"/>
                        <path d="M7 22v-2a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v2"/>
                        <path d="M8 2v2"/>
                        <circle cx="12" cy="11" r="3"/>
                        <rect x="3" y="4" width="18" height="18" rx="2"/>
                      </svg>
                    </div>
                    <span className="font-medium text-gray-800 group-hover:text-indigo-700 transition-colors">
                      {inv.client?.name || t("HeldInvoicesModal.labels.walk_in")}
                    </span>
                  </div>
                  <span className="font-semibold text-gray-900">
                    {inv.grandTotal.toFixed(3)} {t("HeldInvoicesModal.labels.currency")}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs text-gray-500 ml-10">
                  <span className="flex items-center gap-1">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="3" width="18" height="18" rx="2"/>
                      <path d="M9 11h6M9 15h3"/>
                    </svg>
                    {inv.cartItems.length} {t("HeldInvoicesModal.labels.items")}
                  </span>
                  <span className="flex items-center gap-1">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10"/>
                      <polyline points="12 6 12 12 16 14"/>
                    </svg>
                    {new Date(inv.createdAt).toLocaleTimeString()}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}