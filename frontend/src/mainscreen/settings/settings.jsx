import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import AppLogo from "../../components/applogo";
import BrandLogo from "../../components/brandlogo";

const TABS = [
  { key: "language", label: "Language" },
  { key: "zoom", label: "Zoom" },
  { key: "about", label: "Contact & About" },
];

export default function Settings({ onClose }) {
  const { t, i18n } = useTranslation();
  const [activeTab, setActiveTab] = useState("language");
  const isArabic = i18n.language === "ar";
  /* ===============================
     LANGUAGE (EXACT SAME LOGIC AS BEFORE)
  =============================== */
  const changeLang = (lang) => {
    i18n.changeLanguage(lang);
    localStorage.setItem("lang", lang);
  };

  /* ===============================
     ZOOM
  =============================== */
  const [zoom, setZoom] = useState(
    Number(localStorage.getItem("appZoom")) || 100
  );

useEffect(() => {
  document.documentElement.style.zoom = `${zoom}%`;
  localStorage.setItem("appZoom", zoom);
}, [zoom]);


  return (
    <div
      className="fixed inset-0 z-[999] flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={onClose}
    >
      {/* PANEL */}
<div
  className="bg-white shadow-[0_20px_60px_-10px_rgba(0,0,0,0.25)] 
             w-1/2 h-full 
             border border-gray-200 
             overflow-hidden 
             flex flex-col"
  onClick={(e) => e.stopPropagation()}
>
        {/* HEADER */}
{/* HEADER */}
<div className="flex items-center justify-between px-8 py-5 
                bg-gradient-to-r from-white to-gray-50 
                border-b border-gray-200">
  
  <div className="flex flex-col">
    <h2 className="text-xl font-semibold text-gray-900 tracking-tight">
      {t("settings.title")}
    </h2>
    <span className="text-xs text-gray-500">
      {t("settings.subtitle")}
    </span>
  </div>

  <button
    onClick={onClose}
    className="w-9 h-9 flex items-center justify-center 
               rounded-full 
               text-gray-500 
               hover:bg-gray-100 hover:text-gray-800 
               transition"
  >
    ✕
  </button>
</div>


        {/* BODY */}
        <div className="flex h-full">
          {/* SIDEBAR */}
<div className="w-56 
                bg-gradient-to-b from-gray-50 to-white 
                border-r border-gray-200 
                px-2 py-4">
            {TABS.map((tab) => {
  const active = activeTab === tab.key;

  return (
    <button
      key={tab.key}
      onClick={() => setActiveTab(tab.key)}
      className={`
        group w-full flex items-center gap-3 
        px-4 py-3 mb-1 
        rounded-xl text-sm transition-all duration-200
        ${active
          ? "bg-white shadow-sm border border-gray-200 text-gray-900"
          : "text-gray-600 hover:bg-gray-100"}
      `}
    >
      {/* Indicator */}
      <span
        className={`
          h-2 w-2 rounded-full transition
          ${active ? "bg-[#2f788a]" : "bg-transparent group-hover:bg-gray-400"}
        `}
      />

      <span className={`${active ? "font-semibold" : ""}`}>
        {t(`settings.tabs.${tab.key}`)}
      </span>
    </button>
  );
})}
          </div>

          {/* CONTENT */}
          <div className="flex-1 p-6 overflow-y-auto">

            {/* ===============================
                LANGUAGE TAB
            =============================== */}
{activeTab === "language" && (
  <div className="space-y-8">
    {/* Title */}
    <div>
      <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-1">
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="size-6">
  <path d="M15.75 8.25a.75.75 0 0 1 .75.75c0 1.12-.492 2.126-1.27 2.812a.75.75 0 1 1-.992-1.124A2.243 2.243 0 0 0 15 9a.75.75 0 0 1 .75-.75Z" />
  <path fill-rule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25ZM4.575 15.6a8.25 8.25 0 0 0 9.348 4.425 1.966 1.966 0 0 0-1.84-1.275.983.983 0 0 1-.97-.822l-.073-.437c-.094-.565.25-1.11.8-1.267l.99-.282c.427-.123.783-.418.982-.816l.036-.073a1.453 1.453 0 0 1 2.328-.377L16.5 15h.628a2.25 2.25 0 0 1 1.983 1.186 8.25 8.25 0 0 0-6.345-12.4c.044.262.18.503.389.676l1.068.89c.442.369.535 1.01.216 1.49l-.51.766a2.25 2.25 0 0 1-1.161.886l-.143.048a1.107 1.107 0 0 0-.57 1.664c.369.555.169 1.307-.427 1.605L9 13.125l.423 1.059a.956.956 0 0 1-1.652.928l-.679-.906a1.125 1.125 0 0 0-1.906.172L4.575 15.6Z" clip-rule="evenodd" />
</svg>
<span className="text-xl">{t("settings.language.title")}</span>
      </h3>
      <p className="text-sm text-gray-500 mt-1">
       {t("settings.language.description")}
      </p>
    </div>

    {/* Language Selector */}
    <div className="grid grid-cols-2 gap-6 max-w-xl" dir="ltr">
      {/* English */}
      <button
        onClick={() => changeLang("en")}
        className={`
          relative group p-6 rounded-2xl border transition-all text-start
          ${i18n.language === "en"
            ? "border-[#2f788a] bg-white shadow-md"
            : "border-gray-200 hover:border-gray-300 hover:shadow-sm"}
        `}
         dir="ltr"
      >
        {/* Active badge */}
        {i18n.language === "en" && (
          <span className="absolute top-4 end-4 text-xs font-semibold text-[#2f788a]">
            ACTIVE
          </span>
        )}

        <div className="flex flex-col gap-2">
          <span className="text-lg font-semibold text-gray-900">
            English
          </span>
          <span className="text-sm text-gray-500">
            Default system language
          </span>
        </div>
      </button>

      {/* Arabic */}
      <button
        onClick={() => changeLang("ar")}
        className={`
          relative group p-6 rounded-2xl border transition-all text-start
          ${i18n.language === "ar"
            ? "border-[#2f788a] bg-white shadow-md"
            : "border-gray-200 hover:border-gray-300 hover:shadow-sm"}
        `}
        dir="rtl"
      >
        {/* Active badge */}
        {i18n.language === "ar" && (
          <span className="absolute top-4 end-4 text-xs font-semibold text-[#2f788a]">
            فعالة
          </span>
        )}

        <div className="flex flex-col gap-2" >
          <span className="text-lg font-semibold text-gray-900">
            العربية
          </span>
          <span className="text-sm text-gray-500">
            واجهة عربية كاملة
          </span>
        </div>
      </button>
    </div>
  </div>
)}


            {/* ===============================
                ZOOM TAB
            =============================== */}
            {activeTab === "zoom" && (
              <div className="space-y-10 max-w-xl">

                {/* Title */}
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-1">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m5.231 13.481L15 17.25m-4.5-15H5.625c-.621 0-1.125.504-1.125 1.125v16.5c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Zm3.75 11.625a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
            </svg>
            <span>{t("settings.zoom.title")}</span>
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    {t("settings.zoom.description")}
                  </p>
                </div>

                {/* Control Card */}
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-10">

                  <div className="flex items-center justify-between">

                    {/* Decrease (disabled at 100%) */}
                    <button
                      onClick={() => setZoom((z) => Math.max(100, z - 5))}
                      disabled={zoom <= 100}
                      className={`w-14 h-14 rounded-full border
                        flex items-center justify-center
                        text-2xl font-medium transition
                        ${
                          zoom <= 100
                            ? "border-gray-200 text-gray-300 cursor-not-allowed"
                            : "border-gray-300 text-gray-700 hover:bg-gray-100"
                        }`}
                    >
                      −
                    </button>

                    {/* Value */}
                    <div className="flex flex-col items-center">
                      <span className="text-5xl font-semibold text-gray-900 tracking-tight">
                        {zoom}%
                      </span>
                      <span className="text-xs text-gray-500 mt-1">
                         {t("settings.zoom.level")}
                      </span>
                    </div>

                    {/* Increase */}
                    <button
                      onClick={() => setZoom((z) => Math.min(150, z + 5))}
                      className="w-14 h-14 rounded-full border border-gray-300
                                flex items-center justify-center
                                text-2xl font-medium text-gray-700
                                hover:bg-gray-100 transition"
                    >
                      +
                    </button>

                  </div>

                  {/* Footer */}
                  <div className="mt-6 text-xs text-gray-400 text-center">
                    {t("settings.zoom.footer")}
                  </div>
                </div>
              </div>
            )}

            {/* ===============================
                CONTACT / ABOUT TAB
            =============================== */}
{activeTab === "about" && (
  <div className="space-y-10 max-w-2xl">

    {/* Header */}
    <div className="flex items-center gap-4" >
      {/* Company Logo */}
      <div className="w-14 h-14 flex items-center justify-center rounded-xl border border-gray-200 bg-white shadow-sm pl-2 pt-1">
        <AppLogo size={48} className=" items-center justify-center flex" />
      </div>

      <div className="flex flex-col">
        <h3 className="text-2xl font-semibold text-gray-900 tracking-tight">
           {t("settings.about.app_name")}
        </h3>
{isArabic ? (
  /* ===== ARABIC VERSION ===== */
  <div
    className="text-start text-[11px] text-gray-700 flex items-center justify-start gap-2"
    dir="rtl"
  >
    <span className="text-gray-500 text-start">
      {t("settings.about.powered_by")}
    </span>
  </div>
) : (
  /* ===== ENGLISH VERSION ===== */
  <>
    <div
      className="text-start text-[11px] text-gray-700 flex items-center justify-center gap-2"
      dir="ltr"
    >
      <span className="text-gray-500">Powered by</span>

      <BrandLogo size={16} />

      <span className="font-semibold tracking-wide">
        INNOVATION ELEMENTS™
      </span>
    </div>


  </>
)}

      </div>
    </div>

{/* About Card */}
<div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">

  {/* Header */}
  <div className="px-5 py-3 border-b bg-gray-50">
    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
     {t("settings.about.sections.about")}
    </p>
  </div>

  {/* Content */}
  <div className="px-5 py-4">
    <p className="text-sm text-gray-700 leading-relaxed">
      {t("settings.about.description")}
    </p>
  </div>

</div>


{/* Contact & Info Column */}
<div className="flex flex-col gap-6 max-w-2xl">

  {/* Contact Card */}
  <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">

    {/* Header */}
    <div className="px-5 py-3 border-b bg-gray-50">
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
        {t("settings.about.sections.contact")}
      </p>
    </div>

    {/* Content */}
    <div className="px-5 py-4 space-y-4">

      {/* Email */}
      <div className="flex items-start gap-4">
        <div className="text-gray-400 mt-0.5"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6">
  <path stroke-linecap="round" stroke-linejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
</svg>
</div>
        <div>
          <p className="text-xs text-gray-500">{t("settings.about.contact.email")}</p>
          <p className="text-sm font-medium text-gray-900">
            info@innovationelements.org
          </p>
        </div>
      </div>

      {/* Phones */}
      <div className="flex items-start gap-4">
        <div className="text-gray-400 mt-0.5"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 0 1-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25Z" />
</svg>
</div>
        <div>
          <p className="text-xs text-gray-500">{t("settings.about.contact.email")}</p>
          <p className="text-sm font-medium text-gray-900" dir="ltr">
            +962 79 816 3375
          </p>
          <p className="text-sm font-medium text-gray-900" dir="ltr">
            +962 79 831 0374
          </p>
        </div>
      </div>

    </div>
  </div>

  {/* Version Card */}
  <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">

    {/* Header */}
    <div className="px-5 py-3 border-b bg-gray-50">
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
        {t("settings.about.sections.version")}
      </p>
    </div>

    {/* Content */}
    <div className="px-5 py-4 space-y-2">
      <p className="text-sm font-semibold text-gray-900">
        v1.0.0 <span className="font-light"> — Alpha</span>
      </p>
    </div>
  </div>

</div>

  </div>
)}


          </div>
        </div>
      </div>
    </div>
  );
}
