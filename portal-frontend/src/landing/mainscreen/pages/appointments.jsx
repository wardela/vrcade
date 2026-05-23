import { useState, useEffect } from "react";
import salesImage1 from "../../assets/sales/sales_pic_1.png";
import salesImage2 from "../../assets/sales/sales_pic_2.png";
import { useTranslation } from "react-i18next";
export default function AppointmentsPage() {
  const {t} = useTranslation();
  const [isVisible, setIsVisible] = useState({
    section1: false,
    section2: false,
  });

  useEffect(() => {
  window.scrollTo({
    top: 0,
    left: 0,
    behavior: "instant", // or "smooth" if you want animation
  });
}, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const sectionId = entry.target.getAttribute("data-section");
            setIsVisible((prev) => ({ ...prev, [sectionId]: true }));
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
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span className="text-sm font-semibold text-white">
                {t("appointments.hero.badge")}
              </span>
            </div>

            {/* Main Heading */}
            <h1 className="mb-6 text-4xl font-bold text-white sm:text-5xl md:text-6xl lg:text-7xl animate-slideUp">
              {t("appointments.hero.title.line1")}{" "}
              <span className="relative inline-block">
                <span className="relative z-10">{t("appointments.hero.title.highlight")}</span>
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
              {t("appointments.hero.description")}
            </p>

            {/* Features Pills */}
            <div className="flex flex-wrap items-center justify-center gap-3 animate-slideUp" style={{ animationDelay: '0.4s' }}>
              {[
                { icon: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-zap-icon lucide-zap"><path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z"/></svg>},
                { icon: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-bot-icon lucide-bot"><path d="M12 8V4H8"/><rect width="16" height="12" x="4" y="8" rx="2"/><path d="M2 14h2"/><path d="M20 14h2"/><path d="M15 13v2"/><path d="M9 13v2"/></svg> },
                { icon: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-bell-plus-icon lucide-bell-plus"><path d="M10.268 21a2 2 0 0 0 3.464 0"/><path d="M15 8h6"/><path d="M18 5v6"/><path d="M20.002 14.464a9 9 0 0 0 .738.863A1 1 0 0 1 20 17H4a1 1 0 0 1-.74-1.673C4.59 13.956 6 12.499 6 8a6 6 0 0 1 8.75-5.332"/></svg>},
              ].map((feature, index) => (
  <div
    key={index}
    className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full border border-white/20"
  >
    <span className="text-lg">{feature.icon}</span>
    <span className="text-sm font-medium text-white">
      {t(`appointments.hero.pills.${index}`)}
    </span>
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
              className="dark:fill-dark-2"
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

      {/* Smart Appointments Section */}
      <section
        data-section="section1"
        className="relative bg-gradient-to-b from-white to-gray-50 dark:from-dark dark:to-dark-2 pt-20 pb-16 lg:pt-28 lg:pb-20 overflow-hidden px-8"
      >
        {/* Background decorative elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 -end-20 w-96 h-96 bg-[#0884a9]/5 rounded-full blur-3xl"></div>
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="flex flex-wrap items-center">
            {/* Text Content */}
            <div
              className={`w-full px-4 lg:w-1/2 mb-12 lg:mb-0 transition-all duration-1000 ${
                isVisible.section1 ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-10"
              }`}
            >
              <div className="max-w-xl">
                {/* Badge */}
                <div className="inline-flex items-center gap-2 mb-4 px-4 py-2 bg-[#0884a9]/10 backdrop-blur-sm rounded-full border border-[#0884a9]/20">
                  <div className="w-2 h-2 bg-[#0884a9] rounded-full animate-pulse"></div>
                  <span className="text-sm font-semibold text-[#0884a9]">
                    {t("appointments.section1.badge")}
                  </span>
                </div>

                {/* Title */}
                <h2 className="mb-5 text-3xl font-bold text-dark dark:text-white sm:text-4xl lg:text-5xl">
                   {t("appointments.section1.title.line1")}{" "}
                  <span className="relative inline-block">
                    <span className="relative z-10 bg-gradient-to-r from-[#0884a9] to-[#066f8f] bg-clip-text text-transparent">
                      {t("appointments.section1.title.highlight")}
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
                   {t("appointments.section1.description")}
                </p>

                {/* Features List */}
                <ul className="space-y-4 mb-8">
                  {t("appointments.section1.features", { returnObjects: true }).map(
  (feature, index) => (
    <li key={index} className="flex items-start gap-3">
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
              className={`w-full px-4 lg:w-1/2 transition-all duration-1000 delay-300 ${
                isVisible.section1 ? "opacity-100 translate-x-0" : "opacity-0 translate-x-10"
              }`}
            >
              <div className="relative group">
                {/* Glow effect */}
                <div className="absolute inset-0 bg-gradient-to-br from-[#0884a9]/20 to-transparent rounded-2xl blur-2xl group-hover:blur-3xl transition-all duration-500"></div>
                
                <img
                  src={salesImage1}
                  alt="Sales and invoicing"
                  className="relative max-w-full w-full object-contain  group-hover:scale-105 transition-transform duration-500"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* AI Slots Section */}
      <section
        data-section="section2"
        className="relative bg-white dark:bg-dark pt-20 pb-16 lg:pt-28 lg:pb-20 overflow-hidden px-8"
      >
        {/* Background decorative elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute bottom-20 -start-20 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl"></div>
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="flex flex-wrap items-center">
            {/* Image - First on mobile, second on desktop */}
            <div
              className={`w-full px-4 lg:w-1/2 order-2 lg:order-1 transition-all duration-1000 ${
                isVisible.section2 ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-10"
              }`}
            >
              <div className="relative group">
                {/* Glow effect */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-transparent rounded-2xl blur-2xl group-hover:blur-3xl transition-all duration-500"></div>
                
                <img
                  src={salesImage2}
                  alt="Refunds"
                  className="relative max-w-full w-full object-contain bg-transparent group-hover:scale-105 transition-transform duration-500"
                />
              </div>
            </div>

            {/* Text Content */}
            <div
              className={`w-full px-4 lg:w-1/2 mb-12 lg:mb-0 order-1 lg:order-2 transition-all duration-1000 delay-300 ${
                isVisible.section2 ? "opacity-100 translate-x-0" : "opacity-0 translate-x-10"
              }`}
            >
              <div className="max-w-xl lg:ms-auto">
                {/* Badge */}
                <div className="inline-flex items-center gap-2 mb-4 px-4 py-2 bg-blue-500/10 backdrop-blur-sm rounded-full border border-blue-500/20">
                  <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  <span className="text-sm font-semibold text-blue-500">
                    {t("appointments.section2.badge")}
                  </span>
                </div>

                {/* Title */}
                <h2 className="mb-5 text-3xl font-bold text-dark dark:text-white sm:text-4xl lg:text-5xl">
                  {t("appointments.section2.title.line1")}{" "}
                  <span className="relative inline-block">
                    <span className="relative z-10 bg-gradient-to-r from-blue-500 to-blue-600 bg-clip-text text-transparent">
                      {t("appointments.section2.title.highlight")}
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
                  {t("appointments.section2.description")}
                </p>

                {/* Features List */}
<ul className="space-y-4">
  {t("appointments.section2.features", { returnObjects: true }).map(
    (feature, index) => (
      <li key={index} className="flex items-start gap-3">
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

    </>
  );
}
