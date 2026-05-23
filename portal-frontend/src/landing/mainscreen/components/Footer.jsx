import { useState, useEffect } from "react";
import logo from "../../assets/fawtartak_navbar.png";
import useScrollToSection from "../../utils/useScrollToSection";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
export default function Footer() {
  const [isVisible, setIsVisible] = useState(false);
  const scrollToSection = useScrollToSection(); 
  const {t} = useTranslation();
const navigate = useNavigate();

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

    const footer = document.getElementById("footer");
    if (footer) {
      observer.observe(footer);
    }

    return () => {
      if (footer) {
        observer.unobserve(footer);
      }
    };
  }, []);

  const currentYear = new Date().getFullYear();

const navigationLinks = [
  { name: t("footer.navigation.items.0"), id: "home" },
  { name: t("footer.navigation.items.1"), id: "features" },
  { name: t("footer.navigation.items.2"), id: "about" },
  { name: t("footer.navigation.items.3"), id: "pricing" },
  { name: t("footer.navigation.items.4"), id: "problems" },
  { name: t("footer.navigation.items.5"), id: "faq" },
  { name: t("footer.navigation.items.6"), id: "contact" },
];

const modules = [
  { name: t("footer.modules.items.0"), route: "/appointments" },
  { name: t("footer.modules.items.1"), route: "/patients" },
  { name: t("footer.modules.items.2"), route: "/financial" },
  { name: t("footer.modules.items.3"), route: "/insights" },
  { name: t("footer.modules.items.4"), route: "/operation" },
  { name: t("footer.modules.items.5"), route: "/tools" },
];



  const socialLinks = [
    {
      name: "Facebook",
      href: "https://fawtartak.com",
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
        </svg>
      ),
    },
    {
      name: "LinkedIn",
      href: "https://fawtartak.com",
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
        </svg>
      ),
    },
    {
      name: "Instagram",
      href: "https://fawtartak.com",
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" />
        </svg>
      ),
    },
  ];

  return (
    <footer
      id="footer"
      className="relative bg-gradient-to-b from-gray-50 to-white dark:from-dark-2 dark:to-dark pt-20 pb-10 lg:pt-[120px] lg:pb-20 overflow-hidden px-10"
    >
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 -left-20 w-96 h-96 bg-[#0884a9]/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 -right-20 w-96 h-96 bg-[#0884a9]/5 rounded-full blur-3xl"></div>
      </div>

     <div className="container mx-auto px-4 relative z-10">
        {/* Top Section */}
        <div
          className={`transition-all duration-1000 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
          }`}
        >
          <div className="flex flex-wrap">
            {/* Logo & Description Column */}
            <div className="w-full md:w-1/2 lg:w-4/12 mb-6 lg:mb-0">
              <div className="mb-6">
                <button onClick={() => (scrollToSection("home"))} className="inline-block">
                  <img
                    src={logo}
                    alt="Fawtartak"
                    className="h-24 w-auto dark:brightness-0 dark:invert"
                  />
                </button>
              </div>
              <p className="mb-6 text-base leading-relaxed text-body-color dark:text-dark-6 max-w-sm">
               {t("footer.description")}
              </p>

              {/* Social Links */}
<div className="flex items-center gap-3">
  {socialLinks.map((social, index) => (
    <a
      key={index}
      href={social.href}
      target="_blank"
      rel="noopener noreferrer"
      className="group w-10 h-10 rounded-full bg-white dark:bg-dark-2 border-2 border-gray-200 dark:border-dark-3 hover:border-[#0884a9] flex items-center justify-center text-gray-600 dark:text-gray-400 hover:text-white hover:bg-[#0884a9] transition-all duration-300 hover:scale-110"
      aria-label={social.name}
    >
      {social.icon}
    </a>
  ))}
</div>
            </div>

            {/* Quick Links */}
            <div className="w-full sm:w-1/2 lg:w-2/12 mb-12 lg:mb-0">
              <div className="mb-6">
                <h3 className="text-lg font-bold text-dark dark:text-white">
                  {t("footer.navigation.title")}
                </h3>
                <div className="mt-2 w-12 h-1 bg-gradient-to-r from-[#0884a9] to-[#066f8f] rounded-full"></div>
              </div>
              <ul className="space-y-3">
                {navigationLinks.map((link, index) => (
                  <li key={index}>
                    <button
                      onClick={() => scrollToSection(link.id)}
                      className="group inline-flex items-center gap-2 text-base text-body-color dark:text-dark-6 hover:text-[#0884a9] transition-colors duration-300"
                    >
                      <svg
                        className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity"
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
                      <span>{link.name}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {/* Modules */}
            <div className="w-full sm:w-1/2 lg:w-3/12 mb-12 lg:mb-0">
              <div className="mb-6">
                <h3 className="text-lg font-bold text-dark dark:text-white">
                    {t("footer.modules.title")}
                </h3>
                <div className="mt-2 w-12 h-1 bg-gradient-to-r from-[#0884a9] to-[#066f8f] rounded-full"></div>
              </div>
<ul className="space-y-3">
  {modules.map((module, index) => (
    <li key={index}>
      <button
        onClick={() => navigate(module.route)}
        className="group flex items-start gap-2 text-left
                   text-base text-body-color dark:text-dark-6
                   hover:text-[#0884a9] transition-colors duration-300"
      >
        <svg
          className="w-5 h-5 text-[#0884a9] flex-shrink-0 mt-0.5
                     transition-transform duration-300 group-hover:translate-x-1"
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

        <span>{module.name}</span>
      </button>
    </li>
  ))}
</ul>

            </div>

            {/* Contact Info */}
           <div className="w-full sm:w-1/2 lg:w-3/12">
              <div className="mb-6">
                <h3 className="text-lg font-bold text-dark dark:text-white">
                  {t("footer.contact.title")}
                </h3>
                <div className="mt-2 w-12 h-1 bg-gradient-to-r from-[#0884a9] to-[#066f8f] rounded-full"></div>
              </div>

              <ul className="space-y-4">
                <li>
                  <a
                    href="tel:+962798310374"
                    className="group flex items-start gap-3 text-body-color dark:text-dark-6 hover:text-[#0884a9] transition-colors duration-300"
                  >
                    <div className="w-10 h-10 rounded-lg bg-[#0884a9]/10 flex items-center justify-center flex-shrink-0 group-hover:bg-[#0884a9]/20 transition-colors duration-300">
                      <svg
                        className="w-5 h-5 text-[#0884a9]"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                        />
                      </svg>
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-dark dark:text-white mb-1">
                        {t("footer.contact.phone_label")}
                      </div>
                      <div className="text-sm" dir="ltr">+962 79 831 0374</div>
                    </div>
                  </a>
                </li>
                <li>
                  <a
                    href="tel:+962798163375"
                    className="group flex items-start gap-3 text-body-color dark:text-dark-6 hover:text-[#0884a9] transition-colors duration-300"
                  >
                    <div className="w-10 h-10 rounded-lg bg-[#0884a9]/10 flex items-center justify-center flex-shrink-0 group-hover:bg-[#0884a9]/20 transition-colors duration-300">
                      <svg
                        className="w-5 h-5 text-[#0884a9]"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                        />
                      </svg>
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-dark dark:text-white mb-1">
                        {t("footer.contact.phone_label")}
                      </div>
                      <div className="text-sm" dir="ltr">+962 79 816 3375</div>
                    </div>
                  </a>
                </li>

                <li>
                  <a
                    href="mailto:sales@fawtartak.com"
                    className="group flex items-start gap-3 text-body-color dark:text-dark-6 hover:text-[#0884a9] transition-colors duration-300"
                  >
                    <div className="w-10 h-10 rounded-lg bg-[#0884a9]/10 flex items-center justify-center flex-shrink-0 group-hover:bg-[#0884a9]/20 transition-colors duration-300">
                      <svg
                        className="w-5 h-5 text-[#0884a9]"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                        />
                      </svg>
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-dark dark:text-white mb-1">
                        {t("footer.contact.email_label")}
                      </div>
                      <div className="text-sm">sales@fawtartak.com</div>
                    </div>
                  </a>
                </li>
              </ul>

              {/* CTA Button */}
              <div className="mt-6">
                <button
                  onClick={() => (scrollToSection("pricing"))}
                  className="group inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#0884a9] to-[#066f8f] px-6 py-3 text-sm font-bold text-white shadow-lg hover:shadow-xl hover:shadow-[#0884a9]/30 transition-all duration-300 hover:scale-105"
                >
                  <span>{t("footer.contact.cta")}</span>
                  <svg
                    className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1"
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

        {/* Bottom Section */}
        <div
          className={`mt-16 pt-8 border-t border-gray-200 dark:border-dark-3 transition-all duration-1000 delay-300 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
          }`}
        >
          <div className="flex flex-col md:flex-row items-center justify-between gap-4" >
            {/* Copyright */}
            <div className="text-center md:text-left" dir="ltr">
              <p className="text-sm text-body-color dark:text-dark-6">
                آ© {currentYear}{" "}
                <a
                  href="https://fawtartak.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-[#0884a9] hover:underline"
                >
                  Fawtartak
                </a>
                . All rights reserved.
              </p>
            </div>

            {/* Trust Badges */}
            <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-body-color dark:text-dark-6">
              <div className="flex items-center gap-1.5">
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
                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                  />
                </svg>
                <span>{t("footer.trust.ssl")}</span>
              </div>
              <div className="flex items-center gap-1.5">
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
                <span>{t("footer.trust.gdpr")}</span>
              </div>
              <div className="flex items-center gap-1.5">
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
                <span>{t("footer.trust.support")}</span>
              </div>
            </div>


          </div>
        </div>

        {/* Back to Top Button */}
        <div className="mt-8 text-center">
           <button
            className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[#0884a9]/10 hover:bg-[#0884a9] text-[#0884a9] hover:text-white transition-all duration-300 hover:scale-110 group"
            onClick={() => {
                window.scrollTo({
                top: 0,
                behavior: "smooth",
                });
            }}
            >
            <svg
                className="w-5 h-5 transition-transform duration-300 group-hover:-translate-y-1"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
            >
                <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 10l7-7m0 0l7 7m-7-7v18"
                />
            </svg>
            </button>
        </div>
      </div>
    </footer>
  );
}

