import { useState, useEffect } from "react";
import clientsImage1 from "../../assets/clients/clients_pic_1.png";
import clientsImage2 from "../../assets/clients/clients_pic_2.png";
import clientsImage3 from "../../assets/clients/Cients_pic_3.png";
import useScrollToSection from "../../utils/useScrollToSection";
import { useTranslation } from "react-i18next";

export default function FinancialOverviewPage() {
  const [visibleSections, setVisibleSections] = useState({});
  const {t} = useTranslation();
  const scrollToSection = useScrollToSection();
useEffect(() => {
  window.scrollTo({ top: 0, left: 0, behavior: "instant" });
}, []);
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const sectionId = entry.target.getAttribute("data-section");
            setVisibleSections((prev) => ({ ...prev, [sectionId]: true }));
          }
        });
      },
      { threshold: 0.1 }
    );

    document.querySelectorAll("[data-section]").forEach((section) => {
      observer.observe(section);
    });

    return () => observer.disconnect();
  }, []);

  const financialStatsIcons = [
  (
    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mx-auto">
                      <line x1="12" y1="1" x2="12" y2="23"/>
                      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
                    </svg>
  ),
  (
<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mx-auto">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                      <polyline points="14 2 14 8 20 8"/>
                      <line x1="16" y1="13" x2="8" y2="13"/>
                      <line x1="16" y1="17" x2="8" y2="17"/>
                      <polyline points="10 9 9 9 8 9"/>
                    </svg>
  ),
  (
  <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mx-auto">
                      <line x1="12" y1="20" x2="12" y2="10"/>
                      <line x1="18" y1="20" x2="18" y2="4"/>
                      <line x1="6" y1="20" x2="6" y2="16"/>
                    </svg>
  ),
  ];
  return (
    <>
      {/* Hero Banner */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#0884a9] via-[#2aa9c8] to-[#066f8f] pt-[120px] pb-20 md:pt-[150px] md:pb-28 lg:pt-[180px] lg:pb-32">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -end-40 w-80 h-80 bg-white/5 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute top-1/2 -start-32 w-96 h-96 bg-white/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
          <div className="absolute bottom-0 end-1/4 w-64 h-64 bg-white/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center max-w-4xl mx-auto">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 mb-6 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full border border-white/20 animate-fadeIn">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-sm font-semibold text-white">
                {t("financial.hero.badge")}
              </span>
            </div>

            {/* Main Heading */}
            <h1 className="mb-6 text-4xl font-bold text-white sm:text-5xl md:text-6xl lg:text-7xl animate-slideUp">
              {t("financial.hero.title.before")}{" "}
              <span className="relative inline-block">
                <span className="relative z-10">{t("financial.hero.title.highlight")}</span>
                <svg
                  className="absolute -bottom-2 start-0 w-full hidden sm:block"
                  height="12"
                  viewBox="0 0 300 12"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M1 9C50 3 100 1 150 3C200 5 250 7 299 9"
                    stroke="white"
                    strokeOpacity="0.4"
                    strokeWidth="3"
                    strokeLinecap="round"
                  />
                </svg>
              </span>
            </h1>

            {/* Description */}
            <p className="mb-10 text-lg md:text-xl text-white/90 leading-relaxed max-w-2xl mx-auto animate-slideUp" style={{ animationDelay: '0.2s' }}>
              {t("financial.hero.description")}
            </p>

            {/* Stats */}
<div className="grid grid-cols-3 gap-4 max-w-2xl mx-auto animate-slideUp" style={{ animationDelay: "0.4s" }}>
  {t("financial.stats", { returnObjects: true }).map((label, index) => (
    <div
      key={index}
      className="p-4 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 hover:bg-white/20 transition-all duration-300 group"
    >
      <div className="text-white mb-3 group-hover:scale-110 transition-transform duration-300">
        {financialStatsIcons[index]}
      </div>
      <div className="text-sm font-medium text-white">
        {label}
      </div>
    </div>
  ))}
</div>

          </div>
        </div>

        {/* Wave decoration at bottom */}
        <div className="absolute bottom-0 start-0 end-0">
          <svg
            className="w-full h-auto"
            viewBox="0 0 1440 120"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            preserveAspectRatio="none"
          >
            <path
              d="M0 0L60 10C120 20 240 40 360 46.7C480 53 600 47 720 43.3C840 40 960 40 1080 46.7C1200 53 1320 67 1380 73.3L1440 80V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0V0Z"
              fill="white"
              className="dark:fill-dark"
            />
          </svg>
        </div>

        <style jsx>{`
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          
          @keyframes slideUp {
            from {
              opacity: 0;
              transform: translateY(20px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          
          .animate-fadeIn {
            animation: fadeIn 0.6s ease-out;
          }
          
          .animate-slideUp {
            animation: slideUp 0.8s ease-out forwards;
            opacity: 0;
          }
        `}</style>
      </section>

      {/* Payments Section */}
      <section
        data-section="payments"
        className="relative bg-gradient-to-b from-white to-gray-50 dark:from-dark dark:to-dark-2 pt-20 pb-16 lg:pt-28 lg:pb-20 overflow-hidden px-8"
      >
        {/* Background decorative elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 -start-20 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl"></div>
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="flex flex-wrap items-center">
            {/* Image */}
            <div
              className={`w-full lg:w-1/2 mb-12 lg:mb-0 transition-all duration-1000 ${
                visibleSections.payments ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-10"
              }`}
            >
              <div className="relative group">
                {/* Glow effect */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-transparent to-blue-500/10 rounded-3xl blur-3xl group-hover:blur-[100px] transition-all duration-700 scale-110"></div>
                
                <img
                  src={clientsImage1}
                  alt="Client balances"
                  className="relative w-full max-w-[700px] mx-auto r group-hover:scale-[1.02] transition-all duration-700"
                />

                {/* Floating badge */}
                <div className="absolute -top-4 -end-4 lg:-end-8 bg-white dark:bg-dark-2 rounded-full px-4 py-2 shadow-xl border border-gray-100 dark:border-dark-3 opacity-0 group-hover:opacity-100 transform translate-y-4 group-hover:translate-y-0 transition-all duration-500">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                    <span className="text-xs font-bold text-dark dark:text-white">Real-time</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Text */}
            <div
              className={`w-full lg:w-1/2 transition-all duration-1000 delay-300 ${
                visibleSections.payments ? "opacity-100 translate-x-0" : "opacity-0 translate-x-10"
              }`}
            >
              <div className="max-w-xl lg:ms-auto">
                {/* Badge */}
                <div className="inline-flex items-center gap-2 mb-4 px-4 py-2 bg-blue-500/10 backdrop-blur-sm rounded-full border border-blue-500/20">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                  <span className="text-sm font-semibold text-blue-500">
                    {t("financial.payments.badge")}
                  </span>
                </div>

                {/* Title */}
                <h2 className="mb-5 text-3xl font-bold text-dark dark:text-white sm:text-4xl lg:text-5xl">
                  {t("financial.payments.title.before")}{" "}
                  <span className="relative inline-block">
                    <span className="relative z-10 bg-gradient-to-r from-blue-500 to-blue-600 bg-clip-text text-transparent">
                       {t("financial.payments.title.highlight")}
                    </span>
                    <svg
                      className="absolute -bottom-2 start-0 w-full"
                      height="12"
                      viewBox="0 0 300 12"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M1 9C50 3 100 1 150 3C200 5 250 7 299 9"
                        stroke="#22C55E"
                        strokeOpacity="0.3"
                        strokeWidth="3"
                        strokeLinecap="round"
                      />
                    </svg>
                  </span>
                </h2>

                {/* Description */}
                <p className="mb-8 text-base lg:text-lg text-body-color dark:text-dark-6 leading-relaxed">
                  {t("financial.payments.description")}
                </p>

                {/* Features List */}
                <ul className="space-y-4">
                 {t("financial.payments.features", { returnObjects: true }).map(
  (feature, idx) => (
    <li key={idx} className="flex items-start gap-3">
      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center mt-0.5">
        <svg
          className="w-4 h-4 text-blue-500"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2.5}
            d="M5 13l4 4L19 7"
          />
        </svg>
      </div>
      <span className="text-base text-dark dark:text-white font-medium">
        {feature}
      </span>
    </li>
  )
)}

                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Invoices Section */}
      <section
        data-section="invoices"
        className="relative bg-white dark:bg-dark pt-20 pb-16 lg:pt-28 lg:pb-20 overflow-hidden px-8"
      >
        {/* Background decorative elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute bottom-20 -end-20 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl"></div>
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="flex flex-wrap items-center">
            {/* Text */}
            <div
              className={`w-full lg:w-1/2 mb-12 lg:mb-0 transition-all duration-1000 ${
                visibleSections.invoices ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-10"
              }`}
            >
              <div className="max-w-xl">
                {/* Badge */}
                <div className="inline-flex items-center gap-2 mb-4 px-4 py-2 bg-blue-500/10 backdrop-blur-sm rounded-full border border-blue-500/20">
                  <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span className="text-sm font-semibold text-blue-500">
                    {t("financial.invoices.badge")}
                  </span>
                </div>

                {/* Title */}
                <h2 className="mb-5 text-3xl font-bold text-dark dark:text-white sm:text-4xl lg:text-5xl">
                  {t("financial.invoices.title.before")}{" "}
                  <span className="relative inline-block">
                    <span className="relative z-10 bg-gradient-to-r from-blue-500 to-blue-600 bg-clip-text text-transparent">
                      {t("financial.invoices.title.highlight")}
                    </span>
                    <svg
                      className="absolute -bottom-2 start-0 w-full"
                      height="12"
                      viewBox="0 0 300 12"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M1 9C50 3 100 1 150 3C200 5 250 7 299 9"
                        stroke="#2aa9c8"
                        strokeOpacity="0.3"
                        strokeWidth="3"
                        strokeLinecap="round"
                      />
                    </svg>
                  </span>
                </h2>

                {/* Description */}
                <p className="mb-8 text-base lg:text-lg text-body-color dark:text-dark-6 leading-relaxed">
                  {t("financial.invoices.description")}
                </p>

                {/* Features List */}
<ul className="space-y-4">
  {t("financial.invoices.features", { returnObjects: true }).map((feature, idx) => (
    <li key={idx} className="flex items-start gap-3">
      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center mt-0.5">
        <svg
          className="w-4 h-4 text-blue-500"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2.5}
            d="M5 13l4 4L19 7"
          />
        </svg>
      </div>
      <span className="text-base text-dark dark:text-white font-medium">
        {feature}
      </span>
    </li>
  ))}
</ul>

              </div>
            </div>

            {/* Image - Document Preview with Special Treatment */}
            <div
              className={`w-full lg:w-1/2 transition-all duration-1000 delay-300 ${
                visibleSections.invoices ? "opacity-100 translate-x-0" : "opacity-0 translate-x-10"
              }`}
            >
              <div className="flex justify-center lg:justify-end">
                <div className="relative group max-w-[700px]">
                  {/* Glow effect */}
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-transparent rounded-3xl blur-3xl group-hover:blur-[100px] transition-all duration-700"></div>
                  
                  {/* Document card wrapper */}
                  <div className="relative">
                    <img
                      src={clientsImage2}
                      alt="Statements"
                      className="relative w-full max-w-[700px] mx-auto object-contain group-hover:scale-[1.02] transition-transform duration-500"
                    />
                  </div>

                  {/* Floating badge */}
                  <div className="absolute -top-4 -start-4 bg-white dark:bg-dark-2 rounded-full px-4 py-2 shadow-xl border border-gray-100 dark:border-dark-3 opacity-0 group-hover:opacity-100 transform -translate-y-4 group-hover:translate-y-0 transition-all duration-500">
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                      <span className="text-xs font-bold text-dark dark:text-white">Export PDF</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Expenses Section */}
      <section
        data-section="expenses"
        className="relative bg-gradient-to-b from-gray-50 to-white dark:from-dark-2 dark:to-dark pt-20 pb-16 lg:pt-28 lg:pb-20 overflow-hidden px-8"
      >
        {/* Background decorative elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 end-20 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl"></div>
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="flex flex-wrap items-center">
            {/* Image */}
            <div
              className={`w-full lg:w-1/2 mb-12 lg:mb-0 transition-all duration-1000 ${
                visibleSections.expenses ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-10"
              }`}
            >
              <div className="relative group">
                {/* Glow effect */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-transparent to-blue-500/10 rounded-3xl blur-3xl group-hover:blur-[100px] transition-all duration-700 scale-110"></div>
                
                <img
                  src={clientsImage3}
                  alt="Client reporting"
                  className="relative w-full max-w-[700px] mx-auto r group-hover:scale-[1.02] transition-all duration-700"
                />

                {/* Floating badge */}
                <div className="absolute -bottom-4 -end-4 lg:-end-8 bg-white dark:bg-dark-2 rounded-full px-4 py-2 shadow-xl border border-gray-100 dark:border-dark-3 opacity-0 group-hover:opacity-100 transform translate-y-4 group-hover:translate-y-0 transition-all duration-500">
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    <span className="text-xs font-bold text-dark dark:text-white">Export Excel</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Text */}
            <div
              className={`w-full lg:w-1/2 transition-all duration-1000 delay-300 ${
                visibleSections.expenses ? "opacity-100 translate-x-0" : "opacity-0 translate-x-10"
              }`}
            >
              <div className="max-w-xl lg:ms-auto">
                {/* Badge */}
                <div className="inline-flex items-center gap-2 mb-4 px-4 py-2 bg-blue-500/10 backdrop-blur-sm rounded-full border border-blue-500/20">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                  <span className="text-sm font-semibold text-blue-500">
                    {t("financial.expenses.badge")}
                  </span>
                </div>

                {/* Title */}
                <h2 className="mb-5 text-3xl font-bold text-dark dark:text-white sm:text-4xl lg:text-5xl">
                  {t("financial.expenses.title.before")}{" "}
                  <span className="relative inline-block">
                    <span className="relative z-10 bg-gradient-to-r from-blue-500 to-blue-500 bg-clip-text text-transparent">
                      {t("financial.expenses.title.highlight")}
                    </span>
                    <svg
                      className="absolute -bottom-2 start-0 w-full"
                      height="12"
                      viewBox="0 0 300 12"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M1 9C50 3 100 1 150 3C200 5 250 7 299 9"
                        stroke="#F97316"
                        strokeOpacity="0.3"
                        strokeWidth="3"
                        strokeLinecap="round"
                      />
                    </svg>
                  </span>
                </h2>

                {/* Description */}
                <p className="mb-8 text-base lg:text-lg text-body-color dark:text-dark-6 leading-relaxed">
                  {t("financial.expenses.description")}
                </p>

                {/* Features List */}
<ul className="space-y-4">
  {t("financial.expenses.features", { returnObjects: true }).map((feature, idx) => (
    <li key={idx} className="flex items-start gap-3">
      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center mt-0.5">
        <svg
          className="w-4 h-4 text-blue-500"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2.5}
            d="M5 13l4 4L19 7"
          />
        </svg>
      </div>
      <span className="text-base text-dark dark:text-white font-medium">
        {feature}
      </span>
    </li>
  ))}
</ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
<section className="relative bg-gradient-to-br from-white via-gray-50 to-white dark:from-dark dark:via-dark-2 dark:to-dark py-20 lg:py-32 overflow-hidden">        {/* Background decorative elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/2 start-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[#0884a9]/5 rounded-full blur-3xl"></div>
        </div>

     <div className="container mx-auto px-4 relative z-10 text-center">
          <div className="max-w-3xl mx-auto">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 mb-6 px-4 py-2 bg-[#0884a9]/10 backdrop-blur-sm rounded-full border border-[#0884a9]/20">
              <svg className="w-4 h-4 text-[#0884a9]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <span className="text-sm font-semibold text-[#0884a9]">
                 {t("financial.cta.badge")}
              </span>
            </div>

            {/* Heading */}
            <h2 className="mb-6 text-4xl font-bold text-dark dark:text-white lg:text-5xl">
              {t("financial.cta.title.before")}{" "}
              <span className="relative inline-block">
                <span className="relative z-10 bg-gradient-to-r from-[#0884a9] to-[#066f8f] bg-clip-text text-transparent">
                  {t("financial.cta.title.highlight")}
                </span>
                <svg
                  className="absolute -bottom-2 start-0 w-full"
                  height="12"
                  viewBox="0 0 300 12"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M1 9C50 3 100 1 150 3C200 5 250 7 299 9"
                    stroke="#0884a9"
                    strokeOpacity="0.3"
                    strokeWidth="3"
                    strokeLinecap="round"
                  />
                </svg>
              </span>
            </h2>

            {/* Description */}
            <p className="mb-10 text-lg text-body-color dark:text-dark-6 max-w-2xl mx-auto leading-relaxed">
             {t("financial.cta.description")}
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={() => (scrollToSection("pricing"))}
                className="group inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#0884a9] to-[#066f8f] px-8 py-4 text-base font-bold text-white shadow-lg hover:shadow-xl hover:shadow-[#0884a9]/30 transition-all duration-300 hover:scale-105"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                </svg>
                <span>{t("financial.cta.button")}</span>
                <svg className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </button>
            </div>

            {/* Trust indicators */}
<div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-sm text-body-color dark:text-dark-6">
  {t("financial.cta.trust", { returnObjects: true }).map((item, index) => (
    <div key={index} className="flex items-center gap-2">
      <svg
        className="w-4 h-4 text-blue-600"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M5 13l4 4L19 7"
        />
      </svg>
      <span>{item}</span>
    </div>
  ))}
</div>

          </div>
        </div>
      </section>
    </>
  );
}
