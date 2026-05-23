import { useState, useEffect } from "react";
import usersImage1 from "../../assets/users/users_1.png";
import usersImage2 from "../../assets/users/users_2.png";
import usersImage3 from "../../assets/users/users_3.png";
import useScrollToSection from "../../utils/useScrollToSection";
import { useTranslation } from "react-i18next";
export default function OperationsManagement() {
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
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span className="text-sm font-semibold text-white">
                {t("operations.hero.badge")}
              </span>
            </div>

            {/* Main Heading */}
            <h1 className="mb-6 text-4xl font-bold text-white sm:text-5xl md:text-6xl lg:text-7xl animate-slideUp">
              {t("operations.hero.title.before")}{" "}
              <span className="relative inline-block">
                <span className="relative z-10">{t("operations.hero.title.highlight")}</span>
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
              {t("operations.hero.description")}
            </p>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 max-w-2xl mx-auto animate-slideUp" style={{ animationDelay: '0.4s' }}>
              {[
                (
                  <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mx-auto">
                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
                    <circle cx="9" cy="7" r="4"/>
                    <path d="M22 21v-2a4 4 0 0 0-3-3.87"/>
                    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                  </svg>
                ),
                (
                  <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mx-auto">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                  </svg>
                ),
                (
                  <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mx-auto">
                    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
                    <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
                    <line x1="12" y1="22.08" x2="12" y2="12"/>
                  </svg>
                ),
              ].map((icon, index) => (
                <div
                  key={index}
                  className="p-4 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 hover:bg-white/20 transition-all duration-300 group"
                >
                  <div className="text-white mb-3 group-hover:scale-110 transition-transform duration-300">
                    {icon}
                  </div>
                  <div className="text-sm font-medium text-white">
                    {t(`operations.hero.cards.${index}`)}
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

      {/* Staff Management Section */}
      <section
        data-section="section1"
        className="relative bg-gradient-to-b from-white to-gray-50 dark:from-dark dark:to-dark-2 pt-20 pb-16 lg:pt-28 lg:pb-20 overflow-hidden"
      >
        {/* Background decorative elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 -end-20 w-96 h-96 bg-[#0884a9]/5 rounded-full blur-3xl"></div>
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="flex flex-wrap items-center">
            {/* Text */}
            <div
              className={`w-full lg:w-1/2 mb-12 lg:mb-0 transition-all duration-1000 ${
                visibleSections.section1 ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-10"
              }`}
            >
              <div className="max-w-xl">
                {/* Badge */}
                <div className="inline-flex items-center gap-2 mb-4 px-4 py-2 bg-[#0884a9]/10 backdrop-blur-sm rounded-full border border-[#0884a9]/20">
                  <div className="w-2 h-2 bg-[#0884a9] rounded-full animate-pulse"></div>
                  <span className="text-sm font-semibold text-[#0884a9]">
                    {t("operations.sections.staff.badge")}
                  </span>
                </div>

                {/* Title */}
                <h2 className="mb-5 text-3xl font-bold text-dark dark:text-white sm:text-4xl lg:text-5xl">
                  {t("operations.sections.staff.title.before")}{" "}
                  <span className="relative inline-block">
                    <span className="relative z-10 bg-gradient-to-r from-[#0884a9] to-[#066f8f] bg-clip-text text-transparent">
                      {t("operations.sections.staff.title.highlight")}
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
                <p className="mb-8 text-base lg:text-lg text-body-color dark:text-dark-6 leading-relaxed">
                 {t("operations.sections.staff.description")}
                </p>

                {/* Features List */}
<ul className="space-y-4">
  {t("operations.sections.staff.features", { returnObjects: true }).map(
    (feature, idx) => (
      <li key={idx} className="flex items-start gap-3">
        <div className="flex-shrink-0 w-6 h-6 rounded-full bg-[#0884a9]/20 flex items-center justify-center mt-0.5">
          <svg
            className="w-4 h-4 text-[#0884a9]"
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

            {/* Image */}
            <div
              className={`w-full lg:w-1/2 transition-all duration-1000 delay-300 ${
                visibleSections.section1 ? "opacity-100 translate-x-0" : "opacity-0 translate-x-10"
              }`}
            >
              <div className="relative group">
                {/* Glow effect */}
                <div className="absolute inset-0 bg-gradient-to-br from-[#0884a9]/10 via-transparent to-blue-500/10 rounded-3xl blur-3xl group-hover:blur-[100px] transition-all duration-700 scale-110"></div>
                
                <img
                  src={usersImage1}
                  alt="Role management"
                  className="relative w-full max-w-[700px] mx-auto object-contain  group-hover:scale-[1.02] transition-all duration-700"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Users & Permissions Section */}
      <section
        data-section="section2"
        className="relative bg-white dark:bg-dark pt-20 pb-16 lg:pt-28 lg:pb-20 overflow-hidden"
      >
        {/* Background decorative elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute bottom-20 -start-20 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl"></div>
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="flex flex-wrap items-center lg:flex-row-reverse">
            {/* Text */}
            <div
              className={`w-full lg:w-1/2 mb-12 lg:mb-0 transition-all duration-1000 ${
                visibleSections.section2 ? "opacity-100 translate-x-0" : "opacity-0 translate-x-10"
              }`}
            >
              <div className="max-w-xl lg:ms-auto">
                {/* Badge */}
                <div className="inline-flex items-center gap-2 mb-4 px-4 py-2 bg-blue-500/10 backdrop-blur-sm rounded-full border border-blue-500/20">
                  <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  <span className="text-sm font-semibold text-blue-500">
                    {t("operations.sections.users.badge")}
                  </span>
                </div>

                {/* Title */}
                <h2 className="mb-5 text-3xl font-bold text-dark dark:text-white sm:text-4xl lg:text-5xl">
                  {t("operations.sections.users.title.before")}{" "}
                  <span className="relative inline-block">
                    <span className="relative z-10 bg-gradient-to-r from-blue-500 to-blue-500 bg-clip-text text-transparent">
                      {t("operations.sections.users.title.highlight")}
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
                 {t("operations.sections.users.description")}
                </p>

                {/* Features List */}
<ul className="space-y-4">
  {t("operations.sections.users.features", { returnObjects: true }).map(
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

            {/* Image */}
            <div
              className={`w-full lg:w-1/2 transition-all duration-1000 delay-300 ${
                visibleSections.section2 ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-10"
              }`}
            >
              <div className="relative group">
                {/* Glow effect */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-transparent to-blue-500/10 rounded-3xl blur-3xl group-hover:blur-[100px] transition-all duration-700 scale-110"></div>
                
                <img
                  src={usersImage2}
                  alt="Permissions"
                  className="relative w-full max-w-[700px] mx-autoobject-contain  group-hover:scale-[1.02] transition-all duration-700"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stock & Storage Section */}
      <section
        data-section="section3"
        className="relative bg-gradient-to-b from-gray-50 to-white dark:from-dark-2 dark:to-dark pt-20 pb-16 lg:pt-28 lg:pb-20 overflow-hidden"
      >
        {/* Background decorative elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 end-10 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl"></div>
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="flex flex-wrap items-center">
            {/* Text */}
            <div
              className={`w-full lg:w-1/2 mb-12 lg:mb-0 transition-all duration-1000 ${
                visibleSections.section3 ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-10"
              }`}
            >
              <div className="max-w-xl">
                {/* Badge */}
                <div className="inline-flex items-center gap-2 mb-4 px-4 py-2 bg-blue-500/10 backdrop-blur-sm rounded-full border border-blue-500/20">
                  <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                  <span className="text-sm font-semibold text-blue-500">
                    {t("operations.sections.users.badge")}
                  </span>
                </div>

                {/* Title */}
                <h2 className="mb-5 text-3xl font-bold text-dark dark:text-white sm:text-4xl lg:text-5xl">
                  {t("operations.sections.users.title.before")}{" "}
                  <span className="relative inline-block">
                    <span className="relative z-10 bg-gradient-to-r from-blue-500 to-cyan-600 bg-clip-text text-transparent">
                      {t("operations.sections.users.title.highlight")}
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
                  {t("operations.sections.storage.description")}
                </p>

                {/* Features List */}
<ul className="space-y-4">
  {t("operations.sections.storage.features", { returnObjects: true }).map(
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

            {/* Image */}
            <div
              className={`w-full lg:w-1/2 transition-all duration-1000 delay-300 ${
                visibleSections.section3 ? "opacity-100 translate-x-0" : "opacity-0 translate-x-10"
              }`}
            >
              <div className="relative group">
                {/* Glow effect */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-transparent to-cyan-500/10 rounded-3xl blur-3xl group-hover:blur-[100px] transition-all duration-700 scale-110"></div>
                
                <img
                  src={usersImage3}
                  alt="Audit activity"
                  className="relative w-full max-w-[450px] mx-auto object-contain group-hover:scale-[1.02] transition-all duration-700"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="relative bg-white dark:bg-dark py-20 lg:py-32 overflow-hidden">
        {/* Background decorative elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/2 start-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[#0884a9]/5 rounded-full blur-3xl"></div>
        </div>

        <div className="container mx-auto px-4 relative z-10 text-center">
          <div className="max-w-3xl mx-auto">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 mb-6 px-4 py-2 bg-[#0884a9]/10 backdrop-blur-sm rounded-full border border-[#0884a9]/20">
              <svg className="w-4 h-4 text-[#0884a9]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <span className="text-sm font-semibold text-[#0884a9]">
                {t("operations.cta.badge")}
              </span>
            </div>

            {/* Heading */}
            <h2 className="mb-6 text-4xl font-bold text-dark dark:text-white lg:text-5xl">
              {t("operations.cta.title.before")}{" "}
              <span className="relative inline-block">
                <span className="relative z-10 bg-gradient-to-r from-[#0884a9] to-[#066f8f] bg-clip-text text-transparent">
                  {t("operations.cta.title.highlight")}
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
              {t("operations.cta.description")}
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={() => (scrollToSection("pricing"))}
                className="inline-flex items-center justify-center gap-2 rounded-full border-2 border-[#0884a9]/30 bg-white dark:bg-dark-2 px-8 py-4 text-base font-semibold text-dark dark:text-white hover:bg-[#0884a9]/10 hover:border-[#0884a9]/50 transition-all duration-300 hover:scale-105"
              >
                <span>{t("operations.cta.button")}</span>
              </button>
            </div>

            {/* Trust indicators */}
<div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-sm text-body-color dark:text-dark-6">
  {t("operations.cta.trust", { returnObjects: true }).map((item, index) => (
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
