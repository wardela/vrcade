import { useEffect } from "react";
import { I18nextProvider } from "react-i18next";
import portalI18n, { applyLanguageToDocument } from "../i18n";
import landingI18n, { applyLandingLanguageToDocument } from "./i18n";
import SuccessPage from "./mainscreen/mainscreen";
import "./app.css";

function LandingApp() {
  useEffect(() => {
    applyLandingLanguageToDocument(landingI18n.resolvedLanguage || landingI18n.language);

    return () => {
      applyLanguageToDocument(portalI18n.resolvedLanguage || portalI18n.language);
    };
  }, []);

  return (
    <I18nextProvider i18n={landingI18n}>
      <SuccessPage />
    </I18nextProvider>
  );
}

export default LandingApp;
