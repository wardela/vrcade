import { useState, useEffect } from "react";
import aboutImage1 from "../../assets/about_section/about_pic_vertical.png";
import aboutImage2 from "../../assets/about_section/about_small_pic.png";
import { useTranslation } from "react-i18next";
export default function AboutSection() {
  const [isVisible, setIsVisible] = useState(false);
  const [count, setCount] = useState(0);
  const {t} = useTranslation();
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
          }
        });
      },
      { threshold: 0.1 }
    );

    const section = document.getElementById("about");
    if (section) {
      observer.observe(section);
    }

    return () => {
      if (section) {
        observer.unobserve(section);
      }
    };
  }, []);

  // Animated counter for 24/7
  useEffect(() => {
    if (isVisible && count < 24) {
      const timer = setTimeout(() => setCount(count + 1), 50);
      return () => clearTimeout(timer);
    }
  }, [isVisible, count]);

  const statsIcons = [
    (
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <rect width="18" height="18" x="3" y="3" rx="2" />
        <path d="M7 7h4v4H7z" />
        <path d="M13 7h4v4h-4z" />
        <path d="M7 13h4v4H7z" />
        <path d="M13 13h4v4h-4z" />
      </svg>
    ),
    (
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 11a4 4 0 1 0-8 0" />
        <path d="M3 21a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4" />
        <path d="M12 7a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" />
      </svg>
    ),
    (
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 3l7 4v5c0 4.418-2.99 7.5-7 9-4.01-1.5-7-4.582-7-9V7l7-4z" />
        <path d="m9 12 2 2 4-4" />
      </svg>
    ),
  ];

  const stats = t("about.kpis", { returnObjects: true }).map((stat, index) => ({
    ...stat,
    icon: statsIcons[index],
  }));

  return (
    <section
      id="about"
      className="relative bg-gradient-to-b from-gray-50 to-white dark:from-dark-2 dark:to-dark pb-16 pt-12 lg:pb-[100px] lg:pt-[100px] overflow-hidden p-8"
    >
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-40 -left-20 w-96 h-96 bg-[#0884a9]/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 -right-20 w-96 h-96 bg-[#0884a9]/5 rounded-full blur-3xl"></div>
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="flex flex-wrap items-center">
          {/* Left Content */}
          <div className="w-full lg:w-1/2">
            <div
              className={`mb-12 max-w-[580px] lg:mb-0 transition-all duration-1000 ${
                isVisible ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-10"
              }`}
            >
              {/* Badge */}
              <div className="inline-flex items-center gap-2 mb-6 px-4 py-2 bg-[#0884a9]/10 backdrop-blur-sm rounded-full border border-[#0884a9]/20">
                <div className="w-2 h-2 bg-[#0884a9] rounded-full animate-pulse"></div>
                <span className="text-sm font-semibold text-[#0884a9]">
                  {t("about.badge")}
                </span>
              </div>

              {/* Main Heading */}
              <h2 className="mb-6 text-3xl font-bold leading-tight text-dark dark:text-white sm:text-4xl lg:text-5xl sm:leading-tight lg:leading-tight">
                {t("about.heading.before_highlight")}{" "}
                <span className="relative inline-block">
                  <span className="relative z-10 bg-gradient-to-r from-[#0884a9] to-[#066f8f] bg-clip-text text-transparent">
                    {t("about.heading.highlight")}
                  </span>
                  <svg
                    className="absolute -bottom-2 left-0 w-full hidden sm:block"
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
                </span>{" "}
                {t("about.heading.after_highlight")}
              </h2>

              {/* Description */}
              <div className="space-y-4 mb-8">
                <p className="text-base leading-relaxed text-body-color dark:text-dark-6">
                  {t("about.description.p1")}
                </p>
                <p className="text-base leading-relaxed text-body-color dark:text-dark-6">
                  {t("about.description.p2")}
                </p>
              </div>

              {/* Key Features List */}
              <div className="mb-8 space-y-3">
                {t("about.key_features", { returnObjects: true }).map((feature, index) => (
                  <div
                    key={index}
                    className={`flex items-center gap-3 transition-all duration-700 delay-${index * 100} ${
                      isVisible ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-5"
                    }`}
                  >
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-[#0884a9]/20 flex items-center justify-center">
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
                    <span className="text-base font-medium text-dark dark:text-white">
                      {feature}
                    </span>
                  </div>
                ))}
              </div>

              
            </div>
          </div>

          {/* Right Images Grid */}
         <div className="w-full lg:w-1/2">
            <div
              className={`-mx-2 flex flex-wrap sm:-mx-4 lg:-mx-2 xl:-mx-4 transition-all duration-1000 delay-300 ${
                isVisible ? "opacity-100 translate-x-0" : "opacity-0 translate-x-10"
              }`}
            >
              {/* Left Column - Tall Image */}
              <div className="w-full px-2 sm:w-1/2 sm:px-4 lg:px-2 xl:px-4">
                <div className="group mb-4 sm:mb-8 sm:h-[400px] md:h-[540px] lg:h-[400px] xl:h-[500px] relative overflow-hidden rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-500">
                  {/* Image */}
                  <img
                    src={aboutImage1}
                    alt="Fawtartak platform"
                    className="h-full w-full object-cover object-center transform group-hover:scale-110 transition-transform duration-700"
                  />
                  {/* Overlay gradient */}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0884a9]/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  
                  {/* Floating badge */}
                  <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-sm rounded-full px-4 py-2 shadow-lg transform -translate-y-20 group-hover:translate-y-0 transition-transform duration-500">
                    <span className="text-sm font-bold text-[#0884a9]">✓  {t("about.floating_badges.verified")}</span>
                  </div>
                </div>
              </div>

              {/* Right Column */}
              <div className="w-full px-2 sm:w-1/2 sm:px-4 lg:px-2 xl:px-4">
                {/* Top Image */}
                <div className="group mb-4 sm:mb-8 sm:h-[220px] md:h-[346px] lg:mb-4 lg:h-[225px] xl:mb-8 xl:h-[310px] relative overflow-hidden rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-500">
                  <img
                    src={aboutImage2}
                    alt="Fawtartak analytics"
                    className="h-full w-full object-cover object-center transform group-hover:scale-110 transition-transform duration-700"
                  />
                  {/* Overlay gradient */}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0884a9]/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  
                  {/* Floating badge */}
                  <div className="absolute bottom-4 right-4 bg-white/95 backdrop-blur-sm rounded-full px-4 py-2 shadow-lg transform translate-y-20 group-hover:translate-y-0 transition-transform duration-500">
                    <span className="text-sm font-bold text-[#0884a9]">{t("about.floating_badges.support")}</span>
                  </div>
                </div>

                {/* Stats Card - Enhanced */}
                <div className="relative z-10 overflow-hidden bg-gradient-to-br from-[#0884a9] via-[#2aa9c8] to-[#066f8f] rounded-2xl shadow-2xl hover:shadow-[#0884a9]/50 transition-all duration-500 hover:scale-105 group/stats sm:h-[160px] lg:mb-4 xl:mb-8">
                  {/* Main Content */}
                  <div className="relative z-10 p-8 text-center">
                    <div className="mb-3">
                      <span className="block text-5xl font-extrabold text-white animate-pulse">
                        {count < 24 ? count : "24"}/7
                      </span>
                    </div>
                    <span className="block text-lg font-bold text-white mb-1">
                      {t("about.uptime_card.title")}
                    </span>
                    <span className="block text-sm font-medium text-white/80">
                     {t("about.uptime_card.subtitle")}
                    </span>

                    {/* Mini stats */}
                    <div className="mt-4 flex justify-center gap-4 opacity-0 group-hover/stats:opacity-100 transition-opacity duration-500">
                      <div className="text-white/90">
                        <div className="text-xs font-semibold">99.9%</div>
                        <div className="text-xs opacity-75"> {t("about.uptime_card.mini.uptime")}</div>
                      </div>
                      <div className="w-px bg-white/30"></div>
                      <div className="text-white/90">
                        <div className="text-xs font-semibold">&lt;100ms</div>
                        <div className="text-xs opacity-75"> {t("about.uptime_card.mini.response")}</div>
                      </div>
                    </div>
                  </div>

                  {/* Animated background circles */}
                  <div className="absolute inset-0 overflow-hidden">
                    <div className="absolute -top-10 -left-10 w-40 h-40 bg-white/10 rounded-full blur-2xl animate-pulse"></div>
                    <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl animate-pulse" style={{ animationDelay: "1s" }}></div>
                  </div>

                  {/* Decorative shapes */}
                  <span className="absolute left-0 top-0 -z-0">
                    <svg
                      width="106"
                      height="144"
                      viewBox="0 0 106 144"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <rect
                        opacity="0.1"
                        x="-67"
                        y="47.127"
                        width="113.378"
                        height="131.304"
                        transform="rotate(-42.8643 -67 47.127)"
                        fill="url(#aboutGrad1)"
                      />
                      <defs>
                        <linearGradient
                          id="aboutGrad1"
                          x1="-10.3111"
                          y1="47.127"
                          x2="-10.3111"
                          y2="178.431"
                          gradientUnits="userSpaceOnUse"
                        >
                          <stop stopColor="white" />
                          <stop offset="1" stopColor="white" stopOpacity="0" />
                        </linearGradient>
                      </defs>
                    </svg>
                  </span>

                  <span className="absolute right-0 top-0 -z-0">
                    <svg
                      width="130"
                      height="97"
                      viewBox="0 0 130 97"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <rect
                        opacity="0.1"
                        x="0.86792"
                        y="-6.67725"
                        width="155.563"
                        height="140.614"
                        transform="rotate(-42.8643 0.86792 -6.67725)"
                        fill="url(#aboutGrad2)"
                      />
                      <defs>
                        <linearGradient
                          id="aboutGrad2"
                          x1="78.6495"
                          y1="-6.67725"
                          x2="78.6495"
                          y2="133.937"
                          gradientUnits="userSpaceOnUse"
                        >
                          <stop stopColor="white" />
                          <stop offset="1" stopColor="white" stopOpacity="0" />
                        </linearGradient>
                      </defs>
                    </svg>
                  </span>

                  <span className="absolute bottom-0 right-0 -z-0">
                    <svg
                      width="175"
                      height="104"
                      viewBox="0 0 175 104"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <rect
                        opacity="0.1"
                        x="175.011"
                        y="108.611"
                        width="101.246"
                        height="148.179"
                        transform="rotate(137.136 175.011 108.611)"
                        fill="url(#aboutGrad3)"
                      />
                      <defs>
                        <linearGradient
                          id="aboutGrad3"
                          x1="225.634"
                          y1="108.611"
                          x2="225.634"
                          y2="256.79"
                          gradientUnits="userSpaceOnUse"
                        >
                          <stop stopColor="white" />
                          <stop offset="1" stopColor="white" stopOpacity="0" />
                        </linearGradient>
                      </defs>
                    </svg>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Stats Section */}
        <div
          className={`mt-16 lg:mt-24 transition-all duration-1000 delay-700 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
          }`}
        >

        {/* Bottom Stats Section */}
        <div
          className={`mt-16 lg:mt-24 transition-all duration-1000 delay-700 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
          }`}
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {stats.map((stat, index) => (
              <div
                key={index}
                className="group relative bg-white dark:bg-dark-2 rounded-2xl p-8 shadow-lg hover:shadow-2xl border border-gray-100 dark:border-dark-3 hover:border-[#0884a9]/20 transition-all duration-500 hover:-translate-y-2"
              >
                {/* Background gradient on hover */}
                <div className="absolute inset-0 bg-gradient-to-br from-[#0884a9]/0 to-[#0884a9]/0 group-hover:from-[#0884a9]/5 group-hover:to-transparent rounded-2xl transition-all duration-500"></div>
                
                <div className="relative text-center">
                  {/* Icon with background circle */}
                  <div className="flex justify-center mb-4">
                    <div className="relative">
                      <div className="w-20 h-20 rounded-full bg-[#0884a9]/10 flex items-center justify-center group-hover:bg-[#0884a9]/20 transition-all duration-500 group-hover:scale-110">
                        {stat.icon}
                      </div>
                      {/* Rotating accent ring */}
                      <div className="absolute inset-0 rounded-full border-2 border-[#0884a9]/0 group-hover:border-[#0884a9]/30 transition-all duration-500 group-hover:rotate-180"></div>
                    </div>
                  </div>
                  
                  {/* Number */}
                  <div className="text-4xl font-bold text-dark dark:text-white mb-2 group-hover:text-[#0884a9] transition-colors duration-300">
                    {stat.number}
                  </div>
                  
                  {/* Label */}
                  <div className="text-base font-medium text-body-color dark:text-dark-6">
                    {stat.label}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        </div>
      </div>
    </section>
  );
}
