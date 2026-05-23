import { useState, useEffect } from "react";
import useScrollToSection from "../../utils/useScrollToSection";
import { useTranslation } from "react-i18next";

export default function FAQSection() {
  const [isVisible, setIsVisible] = useState(false);
  const [openIndex, setOpenIndex] = useState(null);
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

    const section = document.getElementById("faq");
    if (section) {
      observer.observe(section);
    }

    return () => {
      if (section) {
        observer.unobserve(section);
      }
    };
  }, []);

  const faqItems = t("faq.items", { returnObjects: true });
  const faqs = Array.isArray(faqItems) ? faqItems : [];


  const toggleFAQ = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section
      id="faq"
      className="relative z-20 overflow-hidden bg-gradient-to-b from-white to-gray-50 dark:from-dark dark:to-dark-2 pb-16 pt-12 lg:pb-[80px] lg:pt-[100px]"
    >
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 end-10 w-72 h-72 bg-[#0884a9]/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 start-10 w-72 h-72 bg-blue-500/5 rounded-full blur-3xl"></div>
      </div>

      <div className="container mx-auto relative z-10">
        {/* Header */}
        <div className="-mx-4 flex flex-wrap">
          <div className="w-full px-4">
            <div
              className={`mx-auto mb-16 max-w-[680px] text-center transition-all duration-1000 ${
                isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
              }`}
            >
              {/* Badge */}
              <div className="inline-flex items-center gap-2 mb-4 px-4 py-2 bg-[#0884a9]/10 backdrop-blur-sm rounded-full border border-[#0884a9]/20">
                <svg className="w-4 h-4 text-[#0884a9]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-sm font-semibold text-[#0884a9]">
                  {t("faq.badge")}
                </span>
              </div>

              {/* Main Heading */}
              <h2 className="mb-5 text-3xl font-bold text-dark dark:text-white sm:text-4xl md:text-5xl md:leading-tight">
                {t("faq.heading.line1")}{" "}
                <span className="relative inline-block">
                  <span className="relative z-10 bg-gradient-to-r from-[#0884a9] to-[#066f8f] bg-clip-text text-transparent">
                    {t("faq.heading.highlight")}
                  </span>
                  <svg
                    className="absolute -bottom-2 start-0 w-full hidden sm:block"
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

              <p className="mx-auto max-w-[580px] text-base text-body-color dark:text-dark-6">
                {t("faq.description")}
              </p>
            </div>
          </div>
        </div>

        {/* FAQ Accordion */}
        <div className="max-w-4xl mx-auto">
          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div
                key={index}
                className={`transition-all duration-700 ${
                  isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
                }`}
                style={{ transitionDelay: isVisible ? `${index * 100}ms` : "0ms" }}
              >
                <FAQItem
                  question={faq.question}
                  answer={faq.answer}
                  isOpen={openIndex === index}
                  onToggle={() => toggleFAQ(index)}
                  index={index}
                />
              </div>
            ))}
          </div>

          {/* CTA at bottom */}
          <div
            className={`mt-12 text-center transition-all duration-1000 delay-700 ${
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
            }`}
          >
            <div className="inline-flex flex-col sm:flex-row items-center gap-4 p-6 bg-gradient-to-r from-[#0884a9]/10 via-[#0884a9]/5 to-transparent rounded-2xl border border-[#0884a9]/20">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-[#0884a9]/20 flex items-center justify-center">
                  <svg className="w-6 h-6 text-[#0884a9]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <div className="text-start">
                  <h3 className="text-base font-bold text-dark dark:text-white">
                    {t("faq.cta.title")}
                  </h3>
                  <p className="text-sm text-body-color dark:text-dark-6">
                     {t("faq.cta.subtitle")}
                  </p>
                </div>
              </div>
              <button
                onClick={() => scrollToSection("contact")}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#0884a9] to-[#066f8f] px-6 py-3 text-base font-semibold text-white shadow-lg hover:shadow-xl hover:shadow-[#0884a9]/30 transition-all duration-300 hover:scale-105"
              >
                <span>{t("faq.cta.button")}</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Decorative Dots */}
      <div>
        <span className="absolute start-4 top-4 -z-[1] opacity-20">
          <svg width="146" height="146" viewBox="0 0 146 146" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="2" cy="2" r="2" fill="#0884a9" />
            <circle cx="26" cy="2" r="2" fill="#0884a9" />
            <circle cx="50" cy="2" r="2" fill="#0884a9" />
            <circle cx="74" cy="2" r="2" fill="#0884a9" />
            <circle cx="98" cy="2" r="2" fill="#0884a9" />
            <circle cx="122" cy="2" r="2" fill="#0884a9" />
            <circle cx="2" cy="26" r="2" fill="#0884a9" />
            <circle cx="26" cy="26" r="2" fill="#0884a9" />
            <circle cx="50" cy="26" r="2" fill="#0884a9" />
            <circle cx="74" cy="26" r="2" fill="#0884a9" />
            <circle cx="98" cy="26" r="2" fill="#0884a9" />
            <circle cx="122" cy="26" r="2" fill="#0884a9" />
            <circle cx="2" cy="50" r="2" fill="#0884a9" />
            <circle cx="26" cy="50" r="2" fill="#0884a9" />
            <circle cx="50" cy="50" r="2" fill="#0884a9" />
            <circle cx="74" cy="50" r="2" fill="#0884a9" />
            <circle cx="98" cy="50" r="2" fill="#0884a9" />
            <circle cx="122" cy="50" r="2" fill="#0884a9" />
          </svg>
        </span>

        <span className="absolute bottom-4 end-4 -z-[1] opacity-20">
          <svg width="146" height="146" viewBox="0 0 146 146" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="2" cy="2" r="2" fill="#2aa9c8" />
            <circle cx="26" cy="2" r="2" fill="#2aa9c8" />
            <circle cx="50" cy="2" r="2" fill="#2aa9c8" />
            <circle cx="74" cy="2" r="2" fill="#2aa9c8" />
            <circle cx="98" cy="2" r="2" fill="#2aa9c8" />
            <circle cx="122" cy="2" r="2" fill="#2aa9c8" />
            <circle cx="2" cy="26" r="2" fill="#2aa9c8" />
            <circle cx="26" cy="26" r="2" fill="#2aa9c8" />
            <circle cx="50" cy="26" r="2" fill="#2aa9c8" />
            <circle cx="74" cy="26" r="2" fill="#2aa9c8" />
            <circle cx="98" cy="26" r="2" fill="#2aa9c8" />
            <circle cx="122" cy="26" r="2" fill="#2aa9c8" />
            <circle cx="2" cy="50" r="2" fill="#2aa9c8" />
            <circle cx="26" cy="50" r="2" fill="#2aa9c8" />
            <circle cx="50" cy="50" r="2" fill="#2aa9c8" />
            <circle cx="74" cy="50" r="2" fill="#2aa9c8" />
            <circle cx="98" cy="50" r="2" fill="#2aa9c8" />
            <circle cx="122" cy="50" r="2" fill="#2aa9c8" />
          </svg>
        </span>
      </div>
    </section>
  );
}

/* ==============================
   FAQ Item Component
============================== */

function FAQItem({ question, answer, isOpen, onToggle, index }) {
  return (
    <div className={`group relative overflow-hidden rounded-2xl bg-white dark:bg-dark-2 border-2 transition-all duration-300 ${
      isOpen 
        ? "border-[#0884a9] shadow-lg shadow-[#0884a9]/10" 
        : "border-gray-200 dark:border-dark-3 hover:border-[#0884a9]/50"
    }`}>
      {/* Question Button */}
      <button
        onClick={onToggle}
        className="w-full flex items-start gap-4 p-6 text-start transition-all duration-300"
      >
        {/* Icon Circle */}
        <div className={`flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300 ${
          isOpen 
            ? "bg-gradient-to-br from-[#0884a9] to-[#066f8f] text-white rotate-180" 
            : "bg-[#0884a9]/10 text-[#0884a9] group-hover:bg-[#0884a9]/20"
        }`}>
          <svg
            className="w-6 h-6 transition-transform duration-300"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d={isOpen ? "M5 15l7-7 7 7" : "M19 9l-7 7-7-7"}
            />
          </svg>
        </div>

        {/* Question Text */}
        <div className="flex-1">
          <h3 className={`text-lg font-bold transition-colors duration-300 ${
            isOpen 
              ? "text-[#0884a9]" 
              : "text-dark dark:text-white group-hover:text-[#0884a9]"
          }`}>
            {question}
          </h3>
          
          {/* Number Badge */}
          <div className={`inline-flex items-center gap-2 mt-2 text-xs font-semibold transition-opacity duration-300 ${
            isOpen ? "opacity-100" : "opacity-0 group-hover:opacity-100"
          }`}>
            <span className="text-[#0884a9]">#{String(index + 1).padStart(2, '0')}</span>
          </div>
        </div>

        {/* Expand Indicator */}
        <div className={`flex-shrink-0 w-8 h-8 rounded-full bg-gray-100 dark:bg-dark-3 flex items-center justify-center transition-all duration-300 ${
          isOpen ? "rotate-180 bg-[#0884a9]/20" : "group-hover:bg-[#0884a9]/10"
        }`}>
          <svg
            className={`w-4 h-4 transition-colors duration-300 ${
              isOpen ? "text-[#0884a9]" : "text-gray-600 dark:text-gray-400"
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {/* Answer - Accordion */}
      <div
        className={`overflow-hidden transition-all duration-500 ease-in-out ${
          isOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="px-6 pb-6 pl-[88px]">
          <div className="pt-4 border-t border-gray-100 dark:border-dark-3">
            <p className="text-base leading-relaxed text-body-color dark:text-dark-6">
              {answer}
            </p>
          </div>
        </div>
      </div>

      {/* Gradient accent line on open */}
      {isOpen && (
        <div className="absolute top-0 start-0 end-0 h-1 bg-gradient-to-r from-[#0884a9] to-[#066f8f]"></div>
      )}
    </div>
  );
}
