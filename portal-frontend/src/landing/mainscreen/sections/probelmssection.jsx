import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
export default function ProblemsSection() {
  const [isVisible, setIsVisible] = useState(false);
  const [activeSlide, setActiveSlide] = useState(0);
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

    const section = document.getElementById("problems");
    if (section) {
      observer.observe(section);
    }

    return () => {
      if (section) {
        observer.unobserve(section);
      }
    };
  }, []);

const slides = [
  {
    title: t("problems.slides.0.title"),
    problem: t("problems.slides.0.problem"),
    solution: t("problems.slides.0.solution"),
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
      </svg>
    ),
  },
  {
    title: t("problems.slides.1.title"),
    problem: t("problems.slides.1.problem"),
    solution: t("problems.slides.1.solution"),
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
        <polyline points="10 9 9 9 8 9" />
      </svg>
    ),
  },
  {
    title: t("problems.slides.2.title"),
    problem: t("problems.slides.2.problem"),
    solution: t("problems.slides.2.solution"),
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
        <line x1="1" y1="10" x2="23" y2="10" />
      </svg>
    ),
  },
  {
    title: t("problems.slides.3.title"),
    problem: t("problems.slides.3.problem"),
    solution: t("problems.slides.3.solution"),
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
    ),
  },
  {
    title: t("problems.slides.4.title"),
    problem: t("problems.slides.4.problem"),
    solution: t("problems.slides.4.solution"),
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <line x1="18" y1="20" x2="18" y2="10" />
        <line x1="12" y1="20" x2="12" y2="4" />
        <line x1="6" y1="20" x2="6" y2="14" />
      </svg>
    ),
  },
];


  const nextSlide = () => {
    setActiveSlide((prev) => (prev + 1) % slides.length);
  };

  const prevSlide = () => {
    setActiveSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  return (
    <section
      id="problems"
      className="relative overflow-hidden bg-gradient-to-b from-gray-50 to-white dark:from-dark-2 dark:to-dark py-6 md:py-[120px]"
    >
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 -left-20 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 -right-20 w-96 h-96 bg-[#0884a9]/5 rounded-full blur-3xl"></div>
      </div>

      <div className="container mx-auto relative z-10">
        {/* Header */}
        <div className="-mx-4 flex flex-wrap justify-center">
          <div className="w-full px-4">
            <div
              className={`mx-auto mb-16 max-w-[680px] text-center transition-all duration-1000 ${
                isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
              }`}
            >
              {/* Badge */}
              <div className="inline-flex items-center gap-2 mb-4 px-4 py-2 bg-blue-500/10 backdrop-blur-sm rounded-full border border-blue-500/20">
                <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <span className="text-sm font-semibold text-blue-500">
                  {t("problems.badge")}
                </span>
              </div>

              {/* Main Heading */}
              <h2 className="mb-5 text-3xl font-bold text-dark dark:text-white sm:text-4xl md:text-5xl md:leading-tight">
                {t("problems.heading.line1")}{" "}
                <span className="relative inline-block">
                  <span className="relative z-10 bg-gradient-to-r from-[#0884a9] to-[#066f8f] bg-clip-text text-transparent">
                    {t("problems.heading.line2")}
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
                </span>
              </h2>

              <p className="text-base text-body-color dark:text-dark-6">
                {t("problems.description")}
              </p>
            </div>
          </div>
        </div>

        {/* Cards Grid - Desktop */}
        <div className="hidden lg:grid lg:grid-cols-3 gap-6 mb-8">
          {slides.slice(0, 3).map((item, index) => (
            <ProblemCard
              key={index}
              item={item}
              index={index}
              isVisible={isVisible}
            />
          ))}
        </div>
        <div className="hidden lg:grid lg:grid-cols-2 gap-6 max-w-3xl mx-auto">
          {slides.slice(3).map((item, index) => (
            <ProblemCard
              key={index + 3}
              item={item}
              index={index + 3}
              isVisible={isVisible}
            />
          ))}
        </div>

        {/* Carousel - Mobile & Tablet */}
        <div className="lg:hidden">
          <div className="relative max-w-md mx-auto px-4">
            {/* Card */}
            <div
              className={`transition-all duration-500 ${
                isVisible ? "opacity-100 scale-100" : "opacity-0 scale-95"
              }`}
            >
              <ProblemCard item={slides[activeSlide]} index={activeSlide} isVisible={true} />
            </div>

            {/* Navigation Arrows */}
            <button
              onClick={prevSlide}
              className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 w-10 h-10 rounded-full bg-white dark:bg-dark-2 shadow-lg flex items-center justify-center text-gray-600 dark:text-gray-400 hover:text-[#0884a9] dark:hover:text-[#0884a9] transition-all duration-300 hover:scale-110 ms-4"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            <button
              onClick={nextSlide}
              className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 w-10 h-10 rounded-full bg-white dark:bg-dark-2 shadow-lg flex items-center justify-center text-gray-600 dark:text-gray-400 hover:text-[#0884a9] dark:hover:text-[#0884a9] transition-all duration-300 hover:scale-110 me-4"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>

            {/* Dots */}
            <div className="flex items-center justify-center gap-2 mt-8">
              {slides.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setActiveSlide(index)}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    index === activeSlide
                      ? "w-8 bg-[#0884a9]"
                      : "w-2 bg-gray-300 dark:bg-gray-600 hover:bg-[#0884a9]/50"
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* Problem Card Component */
function ProblemCard({ item, index, isVisible }) {
  const {t} = useTranslation();
  return (
    <div
      className={`group relative overflow-hidden rounded-2xl bg-white dark:bg-dark-2 shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 ${
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
      }`}
      style={{ transitionDelay: isVisible ? `${index * 100}ms` : "0ms" }}
    >
      {/* Top accent */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-blue-400"></div>

      {/* Gradient overlay on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/0 via-transparent to-[#0884a9]/0 group-hover:from-blue-500/5 group-hover:to-[#0884a9]/5 transition-all duration-500 pointer-events-none"></div>

      <div className="relative p-6">
        {/* Problem Section */}
        <div className="mb-6">
          {/* Icon */}
          <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center mb-4 text-blue-500 group-hover:bg-blue-500/20 transition-colors duration-300">
            {item.icon}
          </div>

          {/* Label */}
          <div className="text-xs font-bold uppercase tracking-wider text-blue-500 mb-2">
            {t("problems.labels.problem")}
          </div>

          {/* Title */}
          <h3 className="text-xl font-bold text-dark dark:text-white mb-3 group-hover:text-blue-500 transition-colors duration-300">
            {item.title}
          </h3>

          {/* Description */}
          <p className="text-sm leading-relaxed text-body-color dark:text-dark-6">
            {item.problem}
          </p>
        </div>

        {/* Divider */}
        <div className="h-px bg-gradient-to-r from-transparent via-gray-200 dark:via-dark-3 to-transparent mb-6"></div>

        {/* Solution Section */}
        <div className="flex gap-4">
          {/* Check icon */}
          <div className="flex-shrink-0 w-7 h-7 rounded-full bg-[#0884a9]/10 flex items-center justify-center mt-0.5">
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

          <div>
            {/* Label */}
            <div className="text-xs font-bold uppercase tracking-wider text-[#0884a9] mb-2">
              {t("problems.labels.solution")}
            </div>

            {/* Solution text */}
            <p className="text-sm leading-relaxed text-dark dark:text-white font-medium">
              {item.solution}
            </p>
          </div>
        </div>
      </div>

      {/* Bottom corner accent */}
      <div className="absolute bottom-0 right-0 w-24 h-24 bg-gradient-to-br from-transparent via-[#0884a9]/5 to-[#0884a9]/10 rounded-tl-full opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
    </div>
  );
}