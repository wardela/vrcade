import { useEffect } from "react";
import { I18nextProvider } from "react-i18next";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import LandingApp from "./landing/LandingApp";
import PortalApp from "./PortalApp";
import portalI18n, { applyLanguageToDocument } from "./i18n";

function PortalRoute() {
  useEffect(() => {
    applyLanguageToDocument(portalI18n.resolvedLanguage || portalI18n.language);
  }, []);

  return (
    <I18nextProvider i18n={portalI18n}>
      <PortalApp />
    </I18nextProvider>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/mgmt-portal/*" element={<PortalRoute />} />
        <Route path="/*" element={<LandingApp />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
