import { useTranslation } from "react-i18next";

export default function LanguageSwitcher({ light = false }) {
  const { i18n } = useTranslation();

  const toggleLanguage = () => {
    const newLang = i18n.language === "en" ? "ar" : "en";
    i18n.changeLanguage(newLang);
    localStorage.setItem("language", newLang);
    document.documentElement.dir = newLang === "ar" ? "rtl" : "ltr";
  };

  return (
    <button
      onClick={toggleLanguage}
      className={`
        ml-4 px-3 py-1 rounded-md text-sm font-medium transition
        border
        ${
          light
            ? "border-white text-white hover:bg-white/20"
            : "border-gray-300 text-dark hover:bg-gray-100"
        }
      `}
    >
      {i18n.language === "en" ? "AR" : "EN"}
    </button>
  );
}
