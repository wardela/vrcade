import { Routes, Route, useLocation } from "react-router-dom";
import { useEffect } from "react";
import LandingNAV from "./components/LandingNAV";
import HeroSection from "./sections/herosection";
import FeaturesSection from "./sections/FeaturesSection"; 
import AboutSection from "./sections/aboutsection";
import CTASection from "./sections/ctasection";
import PricingSection from "./sections/pricingsection";
import ProblemsSection from "./sections/probelmssection";
import FAQSection from "./sections/faqsection";
import ContactSection from "./sections/contactsection";
import Footer from "./components/Footer";

import AppointmentsPage from "./pages/appointments";
import PatientsRecords from "./pages/patients";
import FinancialOverviewPage from "./pages/financial";
import ReportsInsights from "./pages/insights";
import OperationsManagement from "./pages/operation";
import AdvancedSystemTools from "./pages/tools";
 
export default function SuccessPage() {

  const location = useLocation();

  useEffect(() => {
    if (location.pathname !== "/") return;

    const target = sessionStorage.getItem("scrollTarget");
    if (!target) return;

    sessionStorage.removeItem("scrollTarget");

    const el = document.getElementById(target);
    if (!el) return;

    const yOffset = -90;
    const y =
      el.getBoundingClientRect().top + window.pageYOffset + yOffset;

    window.scrollTo({ top: y, behavior: "smooth" });
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex flex-col text-gray-900">
      <LandingNAV />

      <main className="flex-grow bg-base-100">
        <Routes>
          {/* Landing Page */}
          <Route 
            path="/"
            element={
              <>
                <HeroSection />
                <FeaturesSection />
                <AboutSection />
                <CTASection />
                <PricingSection />
                <ProblemsSection />
                <FAQSection />
                <ContactSection />
              </>
            }
          />

          {/* Modules */}
          <Route path="/appointments" element={<AppointmentsPage />} />
          <Route path="/patients" element={<PatientsRecords />} />
          <Route path="/financial" element={<FinancialOverviewPage />} />
          <Route path="/insights" element={<ReportsInsights />} />
          <Route path="/operation" element={<OperationsManagement />} />
          <Route path="/tools" element={<AdvancedSystemTools />} />
        </Routes>
      </main>

      <Footer />
    </div>
  );
}
