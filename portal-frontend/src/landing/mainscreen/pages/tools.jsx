import { useState, useEffect } from "react";
import posImage1 from "../../assets/POS/pos_1.png";
import posImage2 from "../../assets/POS/pos_2.png";
import posImage3 from "../../assets/POS/pos_3.png";
import posImage4 from "../../assets/POS/pos_4.png";
import useScrollToSection from "../../utils/useScrollToSection";
import { useTranslation } from "react-i18next";
export default function AdvancedSystemTools() {
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

  const toolsIcons = [
  (
    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mx-auto">
      <circle cx="12" cy="12" r="4"/>
      <path d="M12 2v2"/>
      <path d="M12 20v2"/>
      <path d="m4.93 4.93 1.41 1.41"/>
      <path d="m17.66 17.66 1.41 1.41"/>
      <path d="M2 12h2"/>
      <path d="M20 12h2"/>
      <path d="m6.34 17.66-1.41 1.41"/>
      <path d="m19.07 4.93-1.41 1.41"/>
    </svg>
  ),
  (
    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mx-auto">
      <path d="m5 8 6 6"/>
      <path d="m4 14 6-6 2-3"/>
      <path d="M2 5h12"/>
      <path d="M7 2h1"/>
      <path d="m22 22-5-10-5 10"/>
      <path d="M14 18h6"/>
    </svg>
  ),
  (
    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mx-auto">
      <path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z"/>
    </svg>
  ),
  (
    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mx-auto">
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
      <polyline points="7.5 4.21 12 6.81 16.5 4.21"/>
      <polyline points="7.5 19.79 7.5 14.6 3 12"/>
      <polyline points="21 12 16.5 14.6 16.5 19.79"/>
      <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
      <line x1="12" y1="22.08" x2="12" y2="12"/>
    </svg>
  ),
];

  return (
    <>
      {/* Hero Banner */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#0884a9] via-[#2aa9c8] to-[#066f8f] pt-[120px] pb-20 md:pt-[150px] md:pb-28 lg:pt-[180px] lg:pb-32">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-white/5 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute top-1/2 -left-32 w-96 h-96 bg-white/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
          <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-white/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center max-w-4xl mx-auto">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 mb-6 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full border border-white/20 animate-fadeIn">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
              </svg>
              <span className="text-sm font-semibold text-white">
                {t("tools.hero.badge")}
              </span>
            </div>

            {/* Main Heading */}
            <h1 className="mb-6 text-4xl font-bold text-white sm:text-5xl md:text-6xl lg:text-7xl animate-slideUp">
               {t("tools.hero.title.before")}{" "}
              <span className="relative inline-block">
                <span className="relative z-10">{t("tools.hero.title.highlight")}</span>
                <svg
                  className="absolute -bottom-2 left-0 w-full hidden sm:block"
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
              {t("tools.hero.description")}
            </p>

            {/* Stats */}
<div
  className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto animate-slideUp"
  style={{ animationDelay: "0.4s" }}
>
  {t("tools.stats", { returnObjects: true }).map((label, index) => (
    <div
      key={index}
      className="p-4 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 hover:bg-white/20 transition-all duration-300 group"
    >
      <div className="text-white mb-3 group-hover:scale-110 transition-transform duration-300">
        {toolsIcons[index]}
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
        <div className="absolute bottom-0 left-0 right-0">
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

      {/* Light & Dark Mode Section */}
      <section
        data-section="section1"
        className="relative bg-gradient-to-b from-white to-gray-50 dark:from-dark dark:to-dark-2 pt-20 pb-16 lg:pt-28 lg:pb-20 overflow-hidden"
      >
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 -right-20 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl"></div>
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="flex flex-wrap items-center">
            <div
              className={`w-full lg:w-1/2 mb-12 lg:mb-0 transition-all duration-1000 ${
                visibleSections.section1 ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-10"
              }`}
            >
              <div className="max-w-xl">
                <div className="inline-flex items-center gap-2 mb-4 px-4 py-2 bg-blue-500/10 backdrop-blur-sm rounded-full border border-blue-500/20">
                  <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                  </svg>
                  <span className="text-sm font-semibold text-blue-500">
                    {t("tools.sections.theme.badge")}
                  </span>
                </div>

                <h2 className="mb-5 text-3xl font-bold text-dark dark:text-white sm:text-4xl lg:text-5xl">
                  {t("tools.sections.theme.title.before")}{" "}
                  <span className="relative inline-block">
                    <span className="relative z-10 bg-gradient-to-r from-blue-500 to-blue-600 bg-clip-text text-transparent">
                      {t("tools.sections.theme.title.highlight")}
                    </span>
                    <svg className="absolute -bottom-2 left-0 w-full" height="12" viewBox="0 0 300 12" fill="none">
                      <path d="M1 9C50 3 100 1 150 3C200 5 250 7 299 9" stroke="#2aa9c8" strokeOpacity="0.3" strokeWidth="3" strokeLinecap="round"/>
                    </svg>
                  </span>
                </h2>

                <p className="mb-8 text-base lg:text-lg text-body-color dark:text-dark-6 leading-relaxed">
                  {t("tools.sections.theme.description")}
                </p>

<ul className="space-y-4">
  {t("tools.sections.theme.features", { returnObjects: true }).map(
    (feature, idx) => (
      <li key={idx} className="flex items-start gap-3">
        <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center mt-0.5">
          <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
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

            <div
              className={`w-full lg:w-1/2 transition-all duration-1000 delay-300 ${
                visibleSections.section1 ? "opacity-100 translate-x-0" : "opacity-0 translate-x-10"
              }`}
            >
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-transparent to-blue-500/10 rounded-3xl blur-3xl group-hover:blur-[100px] transition-all duration-700 scale-110"></div>
                <img src={posImage1} alt="POS interface" className="relative w-full max-w-[700px] mx-auto rounded-2xl shadow-2xl group-hover:scale-[1.02] transition-all duration-700 border border-gray-100 dark:border-dark-3" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Multilingual Section */}
      <section
        data-section="section2"
        className="relative bg-white dark:bg-dark pt-20 pb-16 lg:pt-28 lg:pb-20 overflow-hidden"
      >
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute bottom-20 -left-20 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl"></div>
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="flex flex-wrap items-center lg:flex-row-reverse">
            <div
              className={`w-full lg:w-1/2 mb-12 lg:mb-0 transition-all duration-1000 ${
                visibleSections.section2 ? "opacity-100 translate-x-0" : "opacity-0 translate-x-10"
              }`}
            >
              <div className="max-w-xl lg:ml-auto">
                <div className="inline-flex items-center gap-2 mb-4 px-4 py-2 bg-blue-500/10 backdrop-blur-sm rounded-full border border-blue-500/20">
                  <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                  </svg>
                  <span className="text-sm font-semibold text-blue-500">
                    {t("tools.sections.language.badge")}
                  </span>
                </div>

                <h2 className="mb-5 text-3xl font-bold text-dark dark:text-white sm:text-4xl lg:text-5xl">
                  {t("tools.sections.language.title.before")}{" "}
                  <span className="relative inline-block">
                    <span className="relative z-10 bg-gradient-to-r from-blue-500 to-cyan-600 bg-clip-text text-transparent">
                      {t("tools.sections.language.title.highlight")}
                    </span>
                    <svg className="absolute -bottom-2 left-0 w-full" height="12" viewBox="0 0 300 12" fill="none">
                      <path d="M1 9C50 3 100 1 150 3C200 5 250 7 299 9" stroke="#2aa9c8" strokeOpacity="0.3" strokeWidth="3" strokeLinecap="round"/>
                    </svg>
                  </span>
                </h2>

                <p className="mb-8 text-base lg:text-lg text-body-color dark:text-dark-6 leading-relaxed">
                  {t("tools.sections.language.description")}
                </p>

<ul className="space-y-4">
  {t("tools.sections.language.features", { returnObjects: true }).map(
    (feature, idx) => (
      <li key={idx} className="flex items-start gap-3">
        <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center mt-0.5">
          <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
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

            <div
              className={`w-full lg:w-1/2 transition-all duration-1000 delay-300 ${
                visibleSections.section2 ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-10"
              }`}
            >
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-transparent to-cyan-500/10 rounded-3xl blur-3xl group-hover:blur-[100px] transition-all duration-700 scale-110"></div>
                <img src={posImage2} alt="POS receipts" className="relative w-full max-w-[520px] mx-auto rounded-2xl shadow-2xl group-hover:scale-[1.02] transition-all duration-700 border border-gray-100 dark:border-dark-3" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Cloud Security Section */}
      <section
        data-section="section3"
        className="relative bg-gradient-to-b from-gray-50 to-white dark:from-dark-2 dark:to-dark pt-20 pb-16 lg:pt-28 lg:pb-20 overflow-hidden px-8"
      >
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 right-10 w-96 h-96 bg-[#0884a9]/5 rounded-full blur-3xl"></div>
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="flex flex-wrap items-center">
            <div
              className={`w-full lg:w-1/2 mb-12 lg:mb-0 transition-all duration-1000 ${
                visibleSections.section3 ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-10"
              }`}
            >
              <div className="max-w-xl">
                <div className="inline-flex items-center gap-2 mb-4 px-4 py-2 bg-[#0884a9]/10 backdrop-blur-sm rounded-full border border-[#0884a9]/20">
                  <svg className="w-4 h-4 text-[#0884a9]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  <span className="text-sm font-semibold text-[#0884a9]">
                    {t("tools.sections.cloud.badge")}
                  </span>
                </div>

                <h2 className="mb-5 text-3xl font-bold text-dark dark:text-white sm:text-4xl lg:text-5xl">
                  {t("tools.sections.cloud.title.before")}{" "}
                  <span className="relative inline-block">
                    <span className="relative z-10 bg-gradient-to-r from-[#0884a9] to-[#066f8f] bg-clip-text text-transparent">
                      {t("tools.sections.cloud.title.highlight")}
                    </span>
                    <svg className="absolute -bottom-2 left-0 w-full" height="12" viewBox="0 0 300 12" fill="none">
                      <path d="M1 9C50 3 100 1 150 3C200 5 250 7 299 9" stroke="#0884a9" strokeOpacity="0.3" strokeWidth="3" strokeLinecap="round"/>
                    </svg>
                  </span>
                </h2>

                <p className="mb-8 text-base lg:text-lg text-body-color dark:text-dark-6 leading-relaxed">
                  {t("tools.sections.cloud.description")}
                </p>

<ul className="space-y-4">
  {t("tools.sections.cloud.features", { returnObjects: true }).map(
    (feature, idx) => (
      <li key={idx} className="flex items-start gap-3">
        <div className="flex-shrink-0 w-6 h-6 rounded-full bg-[#0884a9]/20 flex items-center justify-center mt-0.5">
          <svg className="w-4 h-4 text-[#0884a9]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
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

            <div
              className={`w-full lg:w-1/2 transition-all duration-1000 delay-300 ${
                visibleSections.section3 ? "opacity-100 translate-x-0" : "opacity-0 translate-x-10"
              }`}
            >
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-br from-[#0884a9]/10 via-transparent to-blue-500/10 rounded-3xl blur-3xl group-hover:blur-[100px] transition-all duration-700 scale-110"></div>
                <img src={posImage3} alt="POS search" className="relative w-full max-w-[600px] mx-auto rounded-2xl shadow-2xl group-hover:scale-[1.02] transition-all duration-700 border border-gray-100 dark:border-dark-3" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Scalability Section */}
      <section
        data-section="section4"
        className="relative bg-white dark:bg-dark pt-20 pb-16 lg:pt-28 lg:pb-20 overflow-hidden"
      >
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute bottom-20 -right-20 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl"></div>
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="flex flex-wrap items-center lg:flex-row-reverse">
            <div
              className={`w-full lg:w-1/2 mb-12 lg:mb-0 transition-all duration-1000 ${
                visibleSections.section4 ? "opacity-100 translate-x-0" : "opacity-0 translate-x-10"
              }`}
            >
              <div className="max-w-xl lg:ml-auto">
                <div className="inline-flex items-center gap-2 mb-4 px-4 py-2 bg-blue-500/10 backdrop-blur-sm rounded-full border border-blue-500/20">
                  <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  <span className="text-sm font-semibold text-blue-500">
                   {t("tools.sections.scalability.badge")}
                  </span>
                </div>

                <h2 className="mb-5 text-3xl font-bold text-dark dark:text-white sm:text-4xl lg:text-5xl">
                  {t("tools.sections.scalability.title.before")}{" "}
                  <span className="relative inline-block">
                    <span className="relative z-10 bg-gradient-to-r from-blue-500 to-blue-500 bg-clip-text text-transparent">
                      {t("tools.sections.scalability.title.highlight")}
                    </span>
                    <svg className="absolute -bottom-2 left-0 w-full" height="12" viewBox="0 0 300 12" fill="none">
                      <path d="M1 9C50 3 100 1 150 3C200 5 250 7 299 9" stroke="#F97316" strokeOpacity="0.3" strokeWidth="3" strokeLinecap="round"/>
                    </svg>
                  </span>
                </h2>

                <p className="mb-8 text-base lg:text-lg text-body-color dark:text-dark-6 leading-relaxed">
                  {t("tools.sections.scalability.description")}
                </p>

<ul className="space-y-4">
  {t("tools.sections.scalability.features", { returnObjects: true }).map(
    (feature, idx) => (
      <li key={idx} className="flex items-start gap-3">
        <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center mt-0.5">
          <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
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

            <div
              className={`w-full lg:w-1/2 transition-all duration-1000 delay-300 ${
                visibleSections.section4 ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-10"
              }`}
            >
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-transparent to-blue-500/10 rounded-3xl blur-3xl group-hover:blur-[100px] transition-all duration-700 scale-110"></div>
                <img src={posImage4} alt="POS totals" className="relative w-full max-w-[550px] mx-auto rounded-2xl shadow-2xl group-hover:scale-[1.02] transition-all duration-700 border border-gray-100 dark:border-dark-3" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="relative bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-dark-2 dark:via-dark dark:to-dark-2 py-20 lg:py-32 overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[#0884a9]/5 rounded-full blur-3xl"></div>
        </div>

       <div className="container mx-auto px-4 relative z-10 text-center">
          <div className="max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 mb-6 px-4 py-2 bg-[#0884a9]/10 backdrop-blur-sm rounded-full border border-[#0884a9]/20">
              <svg className="w-4 h-4 text-[#0884a9]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
              </svg>
              <span className="text-sm font-semibold text-[#0884a9]">
                {t("tools.cta.badge")}
              </span>
            </div>

            <h2 className="mb-6 text-4xl font-bold text-dark dark:text-white lg:text-5xl">
              {t("tools.cta.title.before")}{" "}
              <span className="relative inline-block">
                <span className="relative z-10 bg-gradient-to-r from-[#0884a9] to-[#066f8f] bg-clip-text text-transparent">
                  {t("tools.cta.title.highlight")}
                </span>
                <svg className="absolute -bottom-2 left-0 w-full" height="12" viewBox="0 0 300 12" fill="none">
                  <path d="M1 9C50 3 100 1 150 3C200 5 250 7 299 9" stroke="#0884a9" strokeOpacity="0.3" strokeWidth="3" strokeLinecap="round"/>
                </svg>
              </span>
            </h2>

            <p className="mb-10 text-lg text-body-color dark:text-dark-6 max-w-2xl mx-auto leading-relaxed">
              {t("tools.cta.description")}
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={() => (scrollToSection("contact"))}
                className="inline-flex items-center justify-center gap-2 rounded-full border-2 border-[#0884a9]/30 bg-white dark:bg-dark-2 px-8 py-4 text-base font-semibold text-dark dark:text-white hover:bg-[#0884a9]/10 hover:border-[#0884a9]/50 transition-all duration-300 hover:scale-105"
              >
                <span>{t("tools.cta.button")}</span>
              </button>
            </div>

<div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-sm text-body-color dark:text-dark-6">
  {t("tools.cta.trust", { returnObjects: true }).map((item, idx) => (
    <div key={idx} className="flex items-center gap-2">
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
