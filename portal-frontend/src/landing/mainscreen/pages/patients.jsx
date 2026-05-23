import { useState, useEffect } from "react";
import storageImage1 from "../../assets/storage/storage_pic_1.png";
import storageImage2 from "../../assets/storage/storage_pic_2.png";
import storageImage3 from "../../assets/storage/storage_pic_3.png";
import storageImage4 from "../../assets/storage/storage_pic_4.png";
import storageImage5 from "../../assets/storage/stoarge_pic_5.png";
import storageImage6 from "../../assets/storage/stogare_pic_6.png";
import useScrollToSection from "../../utils/useScrollToSection";
import { useTranslation } from "react-i18next";
export default function PatientsRecords() {
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

const sections = t("patients.sections", { returnObjects: true }).map(
  (section, index) => ({
    ...section,

    // attach images by index (order must match JSON)
    image: [
      storageImage1,
      storageImage2,
      storageImage3,
      storageImage4,
      storageImage5,
      storageImage6,
    ][index],

    // size tweaks per image
    imageClass: [
      "max-w-[520px]",
      "max-w-[700px]",
      "max-w-[700px]",
      "max-w-[700px]",
      "max-w-[700px]",
      "max-w-[700px]",
    ][index],

    // keep your existing color system
    badgeColor: [
      "indigo",
      "blue",
      "sky",
      "cyan",
      "blue",
      "indigo",
    ][index],
  })
);

  const badgeColors = {
    indigo: "bg-indigo-500/10 border-indigo-500/20 text-indigo-500",
    blue: "bg-blue-500/10 border-blue-500/20 text-blue-500",
    sky: "bg-sky-500/10 border-sky-500/20 text-sky-500",
    cyan: "bg-cyan-500/10 border-cyan-500/20 text-cyan-500",
  };

  const dotColors = {
    indigo: "bg-indigo-500",
    blue: "bg-blue-500",
    sky: "bg-sky-500",
    cyan: "bg-cyan-500",
  };

  const statsIcons = [
  (
    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mx-auto">
      <path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z"/>
      <path d="M8 10v4"/>
      <path d="M12 10v2"/>
      <path d="M16 10v6"/>
    </svg>
  ),
  (
    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mx-auto">
      <circle cx="12" cy="16" r="1"/>
      <rect x="3" y="10" width="18" height="12" rx="2"/>
      <path d="M7 10V7a5 5 0 0 1 10 0v3"/>
    </svg>
  ),
  (
    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mx-auto">
      <path d="m12 14 4-4"/>
      <path d="M3.34 19a10 10 0 1 1 17.32 0"/>
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
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <span className="text-sm font-semibold text-white">
                {t("patients.hero.badge")}
              </span>
            </div>

            {/* Main Heading */}
            <h1 className="mb-6 text-4xl font-bold text-white sm:text-5xl md:text-6xl lg:text-7xl animate-slideUp">
              {t("patients.hero.title.before")}{" "}
              <span className="relative inline-block">
                <span className="relative z-10">{t("patients.hero.title.highlight")}</span>
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
              {t("patients.hero.description")}
            </p>

            {/* Stats */}
<div
  className="grid grid-cols-3 gap-4 max-w-2xl mx-auto animate-slideUp"
  style={{ animationDelay: "0.4s" }}
>
  {t("patients.stats", { returnObjects: true }).map((label, index) => (
    <div
      key={index}
      className="p-4 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 hover:bg-white/20 transition-all duration-300 group"
    >
      <div className="text-white mb-3 group-hover:scale-110 transition-transform duration-300">
        {statsIcons[index]}
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

      {/* Feature Sections */}
      {sections.map((item, i) => {
        const isReverse = i % 2 !== 0;
        const sectionId = `section-${i}`;
        const isVisible = visibleSections[sectionId];

        return (
          <section
            key={i}
            data-section={sectionId}
            className={`relative pt-20 pb-16 lg:pt-28 lg:pb-20 overflow-hidden px-8 ${
              i % 2 === 0
                ? "bg-gradient-to-b from-white to-gray-50 dark:from-dark dark:to-dark-2"
                : "bg-white dark:bg-dark"
            }`}
          >
            {/* Background decorative elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <div className={`absolute ${isReverse ? 'left-20' : 'right-20'} top-20 w-96 h-96 bg-[#0884a9]/5 rounded-full blur-3xl`}></div>
            </div>

            <div className="container mx-auto px-4 relative z-10">
<div
  className={`flex flex-wrap items-center ${
    isReverse ? "lg:flex-row-reverse" : ""
  }`}
>
                {/* Image Side - Laptop with special treatment */}
                <div
                  className={`w-full lg:w-1/2 transition-all duration-1000 delay-300 ${
                    isVisible
                      ? "opacity-100 translate-x-0"
                      : `opacity-0 ${isReverse ? "translate-x-10" : "-translate-x-10"}`
                  }`}
                >
                  <div className="relative group">
                    {/* Glow effect behind laptop */}
                    <div className="absolute inset-0 bg-gradient-to-br from-[#0884a9]/10 via-transparent to-blue-500/10 rounded-3xl blur-3xl group-hover:blur-[100px] transition-all duration-700 scale-110"></div>
                    
                    {/* Laptop mockup container - no additional backgrounds since images already have laptop frames */}
                    <div className="relative">
                      <img
                        src={item.image}
                        alt={item.title}
                        className={`relative w-full ${item.imageClass || "max-w-[700px]"} mx-auto object-contain drop-shadow-2xl group-hover:scale-[1.02] transition-all duration-700`}
                      />
                      
                      {/* Floating badge on laptop */}
                      <div className="absolute -top-4 -right-4 lg:-right-8 bg-white dark:bg-dark-2 rounded-full px-4 py-2 shadow-xl border border-gray-100 dark:border-dark-3 opacity-0 group-hover:opacity-100 transform translate-y-4 group-hover:translate-y-0 transition-all duration-500">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                          <span className="text-xs font-bold text-dark dark:text-white">
                            {t("common.trial_badge")}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Text Side */}
                <div
                  className={`w-full px-4 lg:w-1/2 transition-all duration-1000 delay-300 ${
                    isVisible
                      ? "opacity-100 translate-x-0"
                      : `opacity-0 ${isReverse ? "-translate-x-10" : "translate-x-10"}`
                  }`}
                >
                  <div className={`max-w-xl ${isReverse ? 'lg:mr-auto' : 'lg:ml-auto'}`}>
                    {/* Badge */}
                    <div className={`inline-flex items-center gap-2 mb-4 px-4 py-2 backdrop-blur-sm rounded-full border ${badgeColors[item.badgeColor]}`}>
                      <div className={`w-2 h-2 rounded-full animate-pulse ${dotColors[item.badgeColor]}`}></div>
                      <span className="text-sm font-semibold">
                        {item.badge}
                      </span>
                    </div>

                    {/* Title */}
                    <h2 className="mb-5 text-3xl font-bold text-dark dark:text-white sm:text-4xl lg:text-5xl">
                      {item.title.split(' ').slice(0, -1).join(' ')}{" "}
                      <span className="relative inline-block">
                        <span className="relative z-10 bg-gradient-to-r from-[#0884a9] to-[#066f8f] bg-clip-text text-transparent">
                          {item.title.split(' ').slice(-1)}
                        </span>
                        <svg
                          className="absolute -bottom-2 left-0 w-full"
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
                      {item.text}
                    </p>

                    {/* Features List */}
                    <ul className="grid grid-cols-2 gap-3">
                      {item.features.map((feature, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <div className="flex-shrink-0 w-5 h-5 rounded-full bg-[#0884a9]/20 flex items-center justify-center mt-0.5">
                            <svg className="w-3 h-3 text-[#0884a9]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                          <span className="text-sm text-dark dark:text-white font-medium">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </section>
        );
      })}

      {/* Final CTA Section */}
      <section className="relative bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-dark-2 dark:via-dark dark:to-dark-2 py-20 lg:py-32 overflow-hidden">
        {/* Background decorative elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[#0884a9]/5 rounded-full blur-3xl"></div>
        </div>

        <div className="container mx-auto px-4 relative z-10 text-center">
          <div className="max-w-3xl mx-auto">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 mb-6 px-4 py-2 bg-[#0884a9]/10 backdrop-blur-sm rounded-full border border-[#0884a9]/20">
              <svg className="w-4 h-4 text-[#0884a9]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-sm font-semibold text-[#0884a9]">
                {t("patients.cta.badge")}
              </span>
            </div>

            {/* Heading */}
            <h2 className="mb-6 text-4xl font-bold text-dark dark:text-white lg:text-5xl">
              {t("patients.cta.title.before")}{" "}
              <span className="relative inline-block">
                <span className="relative z-10 bg-gradient-to-r from-[#0884a9] to-[#066f8f] bg-clip-text text-transparent">
                  {t("patients.cta.title.highlight")}
                </span>
                <svg
                  className="absolute -bottom-2 left-0 w-full"
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
              {t("patients.cta.description")}
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={() => (scrollToSection("contact"))}
                className="inline-flex items-center justify-center gap-2 rounded-full border-2 border-[#0884a9]/30 bg-white dark:bg-dark-2 px-8 py-4 text-base font-semibold text-dark dark:text-white hover:bg-[#0884a9]/10 hover:border-[#0884a9]/50 transition-all duration-300 hover:scale-105"
              >
                <span>{t("patients.cta.button")}</span>
              </button>
            </div>

            {/* Trust indicators */}
<div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-sm text-body-color dark:text-dark-6">
  {t("patients.cta.trust", { returnObjects: true }).map((text, index) => (
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
      <span>{text}</span>
    </div>
  ))}
</div>

          </div>
        </div>
      </section>
    </>
  );
}
