import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import useScrollToSection from "../../utils/useScrollToSection";
import { useTranslation } from "react-i18next";
export default function FeaturesSection() {
  const [isVisible, setIsVisible] = useState(false);
  const scrollToSection = useScrollToSection();
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

    const section = document.getElementById("features");
    if (section) {
      observer.observe(section);
    }

    return () => {
      if (section) {
        observer.unobserve(section);
      }
    };
  }, []);

  const features = [
    {
      icon: (
        <svg
          width="37"
          height="37"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          stroke="white"
          strokeWidth="2.2"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5"
          />
        </svg>
      ),
      title: t("features.cards.appointments.title"),
      route: "/appointments",
      items: t("features.cards.appointments.items", { returnObjects: true }),
      delay: "0ms",
    },
    {
      icon: (
        <svg
          width="37"
          height="37"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          stroke="white"
          strokeWidth="2.2"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M2.25 18.75a60.07 60.07 0 0 1 15.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 0 1 3 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 0 0-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 0 1-1.125-1.125V15"
          />
        </svg>
      ),
      title: t("features.cards.billing.title"),
      route: "/financial",
      items: t("features.cards.billing.items", { returnObjects: true }),
      delay: "150ms",
    },
    {
      icon: (
        <svg
          width="42"
          height="42"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          stroke="white"
          strokeWidth="2.2"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M17.982 18.725A7.488 7.488 0 0 0 12 15.75a7.488 7.488 0 0 0-5.982 2.975m11.963 0a9 9 0 1 0-11.963 0M15 9.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
          />
        </svg>
      ),
      title: t("features.cards.patients.title"),
      route: "/patients",
      items: t("features.cards.patients.items", { returnObjects: true }),
      delay: "300ms",
    },
    {
      icon: (
        <svg
          width="37"
          height="37"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          stroke="white"
          strokeWidth="2.2"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9 17.25v1.007a3 3 0 0 1-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0 1 15 18.257V17.25m6-12V15a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 15V5.25"
          />
        </svg>
      ),
      title: t("features.cards.cloud.title"),
      route: "/tools",
      items: t("features.cards.cloud.items", { returnObjects: true }),
      delay: "450ms",
    },
  ];

  return (
    <section
      id="features"
      className="relative pb-16 pt-20 dark:bg-dark lg:pb-[100px] lg:pt-[120px] px-4 overflow-hidden"
    >
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 right-10 w-72 h-72 bg-[#0884a9]/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 left-10 w-96 h-96 bg-[#0884a9]/5 rounded-full blur-3xl"></div>
      </div>

     <div className="container mx-auto px-4 relative z-10">
        {/* Section Header */}
        <div className="flex flex-wrap justify-center">
          <div className="w-full ">
            <div
              className={`mx-auto mb-16 max-w-[600px] text-center lg:mb-20 transition-all duration-1000 ${
                isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
              }`}
            >
              {/* Badge */}
              <div className="inline-flex items-center gap-2 mb-4 px-4 py-2 bg-[#0884a9]/10 backdrop-blur-sm rounded-full border border-[#0884a9]/20">
                <div className="w-2 h-2 bg-[#0884a9] rounded-full animate-pulse"></div>
                <span className="text-sm font-semibold text-[#0884a9]">
                  {t("features.badge")}
                </span>
              </div>

              {/* Main Heading */}
              <h2 className="mb-4 text-3xl font-bold text-dark dark:text-white sm:text-4xl md:text-5xl md:leading-tight">
                {t("features.heading.before_highlight")}{" "}
                <span className="relative inline-block">
                  <span className="relative z-10 bg-gradient-to-r from-[#0884a9] to-[#066f8f] bg-clip-text text-transparent">
                    {t("features.heading.highlight")}
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

              <p className="text-lg text-body-color dark:text-dark-6 leading-relaxed">
                {t("features.description")}
              </p>
            </div>
          </div>
        </div>

        {/* Features Grid */}
        <div className="flex flex-wrap justify-center">
          {features.map((feature, index) => (
            <div key={index} className="w-full px-4 md:w-1/2 lg:w-1/4">
              <div
                className={`group mb-12 transition-all duration-700 ${
                  isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
                }`}
                style={{ transitionDelay: isVisible ? feature.delay : "0ms" }}
              >
                {/* Feature Card */}
                <div className="relative h-full bg-white dark:bg-dark-2 rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-500 border border-transparent hover:border-[#0884a9]/20 hover:-translate-y-2">
                  {/* Gradient background on hover */}
                  <div className="absolute inset-0 bg-gradient-to-br from-[#0884a9]/0 to-[#0884a9]/0 group-hover:from-[#0884a9]/5 group-hover:to-transparent rounded-2xl transition-all duration-500"></div>

                  {/* Icon Container */}
                  <div className="relative z-10 mb-8">
                    <div className="relative inline-flex">
                      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#0884a9] to-[#066f8f] shadow-lg group-hover:shadow-xl group-hover:shadow-[#0884a9]/30 transition-all duration-500 group-hover:scale-110">
                        {feature.icon}
                      </div>
                      {/* Rotating background accent */}
                      <div className="absolute left-0 top-0 -z-10 flex h-16 w-16 rotate-0 items-center justify-center rounded-2xl bg-[#0884a9] bg-opacity-20 transition-all duration-500 group-hover:rotate-45 group-hover:scale-125"></div>
                      
                      {/* Pulsing dot indicator */}
                      <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-400 rounded-full animate-ping opacity-75"></div>
                      <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-400 rounded-full"></div>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="relative z-10">
                    <h4 className="mb-4 text-xl font-bold text-dark dark:text-white group-hover:text-[#0884a9] transition-colors duration-300">
                      {feature.title}
                    </h4>

                    <ul className="space-y-3 mb-6">
                      {feature.items.map((item, itemIndex) => (
                        <li
                          key={itemIndex}
                          className="flex items-start gap-3 text-base text-body-color dark:text-dark-6"
                        >
                          <svg
                            className="w-5 h-5 mt-0.5 text-[#0884a9] flex-shrink-0"
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
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>

                    {/* Learn More Link */}
                    <div className="pt-4 border-t border-gray-100 dark:border-dark-3">
                      <Link
                      to={feature.route}
                        className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#0884a9] to-[#066f8f] px-4 py-2 text-sm font-semibold text-white shadow-md hover:shadow-lg hover:shadow-[#0884a9]/30 transition-all duration-300 group/link"
                      >
                        <span>{t("features.actions.learn_more")}</span>
                        <svg
                          className="w-4 h-4 transition-transform duration-300 group-hover/link:translate-x-1"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 5l7 7-7 7"
                          />
                        </svg>
                      </Link>
                    </div>
                  </div>

                  {/* Corner accent */}
                  <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-[#0884a9]/0 via-[#0884a9]/5 to-transparent rounded-bl-full opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom CTA Section */}
        <div
          className={`mt-12 text-center transition-all duration-1000 delay-500 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
          }`}
        >
          <div className="inline-flex flex-col sm:flex-row items-center gap-4 p-8 bg-gradient-to-r from-[#0884a9]/10 via-[#0884a9]/5 to-transparent rounded-2xl border border-[#0884a9]/20">
            <div className="flex-1 text-left">
              <h3 className="text-xl font-bold text-dark dark:text-white mb-2">
                {t("features.actions.cta_title")}
              </h3>
              <p className="text-base text-body-color dark:text-dark-6">
                {t("features.actions.cta_subtitle")}
              </p>
            </div>
            <div className="flex gap-3">
              <button
               onClick={() => scrollToSection("contact")}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#0884a9] to-[#066f8f] px-6 py-3 text-base font-semibold text-white shadow-lg hover:shadow-xl hover:shadow-[#0884a9]/30 transition-all duration-300 hover:scale-105"
              >
                <span>{t("features.actions.contact_sales")}</span>
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 7l5 5m0 0l-5 5m5-5H6"
                  />
                </svg>
              </button>

            </div>
          </div>
        </div>
      </div>

      {/* Decorative grid pattern */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#0884a9]/20 to-transparent"></div>
    </section>
  );
}
