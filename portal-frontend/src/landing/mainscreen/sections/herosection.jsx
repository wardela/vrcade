import { useState, useEffect } from "react";
import heroImage from "../../assets/hero/hero_dashboard.png";
import { useLocation, useNavigate } from "react-router-dom";
import { scrollToSection } from "../../utils/scrolltosection";
import { useTranslation } from "react-i18next";
export default function HeroSection() {
  const [isVisible, setIsVisible] = useState(false);
  const {t} = useTranslation();
  useEffect(() => {
    setIsVisible(true);
  }, []);
  const navigate = useNavigate();
  const location = useLocation();

  const handleTryNow = () => {
    if (location.pathname === "/") {
      scrollToSection("pricing");
    } else {
      sessionStorage.setItem("scrollTarget", "pricing");
      navigate("/");
    }
  };

  const handlePortalClick = () => {
    navigate("/mgmt-portal");
  };

  return (
    <div
      id="home"
      className="relative overflow-hidden bg-gradient-to-br from-[#0884a9] via-[#2aa9c8] to-[#066f8f] pt-[120px] md:pt-[130px] lg:pt-[160px]"
    >
      {/* Animated background circles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -end-40 w-80 h-80 bg-white/5 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-1/2 -start-32 w-96 h-96 bg-white/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute bottom-0 end-1/4 w-64 h-64 bg-white/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="flex flex-wrap items-center justify-center">
          
          {/* Text Content */}
          <div className="w-full">
            <div className={`mx-auto max-w-[900px] text-center transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>

              {/* Main Headline */}
              <h1 className="mb-6 text-4xl font-bold leading-tight text-white sm:text-5xl sm:leading-tight lg:text-6xl lg:leading-tight xl:text-7xl xl:leading-tight">
                {t("hero.headline.before_highlight")}{" "}
                <span className="relative inline-block">
                  <span className="relative z-10 bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent">
                    {t("hero.headline.highlight")}
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
                      stroke="rgba(255,255,255,0.4)"
                      strokeWidth="3"
                      strokeLinecap="round"
                    />
                  </svg>
                </span>
              </h1>

              {/* Subheadline */}
              <p className="mx-auto mb-10 max-w-[700px] text-lg font-medium text-white/90 sm:text-xl sm:leading-relaxed leading-relaxed">
                {t("hero.subheadline")}
              </p>

              {/* CTA Buttons */}
              <div className="mb-12 flex flex-col items-center gap-3">
                <button
                  onClick={handleTryNow}
                  className="inline-flex items-center justify-center gap-2 rounded-full border-2 border-white/30 bg-white/10 backdrop-blur-sm px-8 py-4 text-base font-semibold text-white transition-all duration-300 hover:bg-white/20 hover:border-white/50 hover:scale-105"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-clipboard-plus-icon lucide-clipboard-plus"><rect width="8" height="4" x="8" y="2" rx="1" ry="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="M9 14h6"/><path d="M12 17v-6"/></svg>
                  <span>{t("hero.cta.try_now")}</span>
                </button>

                <button
                  onClick={handlePortalClick}
                  className="inline-flex items-center justify-center gap-2 rounded-full border-2 border-white/22 bg-white/10 px-6 py-2.5 text-sm font-semibold text-white/95 backdrop-blur-sm transition-all duration-300 hover:border-white/38 hover:bg-white/18 hover:scale-[1.02]"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.9"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <rect width="18" height="14" x="3" y="5" rx="2" />
                    <path d="M8 3v4M16 3v4" />
                    <path d="M3 11h18" />
                  </svg>
                  {t("hero.cta.portal")}
                </button>
              </div>

              {/* Tech Stack */}
              <div className="border-t border-white/10 pt-10">
                <p className="mb-6 text-sm font-semibold uppercase tracking-wider text-white/70">
                 {t("hero.tech.title")}
                </p>

                <div className="flex items-center justify-center gap-8 text-center flex-wrap">
                  {/* Tailwind */}
                  <div className="group flex flex-col items-center gap-2 transition-transform duration-300 hover:scale-110">
                    <div className="text-white/60 transition-colors duration-300 group-hover:text-white">
                      <svg
                        className="fill-current"
                        width="48"
                        height="30"
                        viewBox="0 0 41 26"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <mask
                          id="mask0_2005_10783"
                          style={{ maskType: "luminance" }}
                          maskUnits="userSpaceOnUse"
                          x="0"
                          y="0"
                          width="41"
                          height="26"
                        >
                          <path d="M0.521393 0.949463H40.5214V25.0135H0.521393V0.949463Z" />
                        </mask>
                        <g mask="url(#mask0_2005_10783)">
                          <path d="M20.5214 0.980713C15.1882 0.980713 11.8546 3.64743 10.5214 8.98071C12.5214 6.31399 14.8546 5.31399 17.5214 5.98071C19.043 6.36103 20.1302 7.46495 21.3342 8.68667C23.295 10.6771 25.5642 12.9807 30.5214 12.9807C35.8546 12.9807 39.1882 10.314 40.5214 4.98071C38.5214 7.64743 36.1882 8.64743 33.5214 7.98071C31.9998 7.60039 30.9126 6.49651 29.7086 5.27479C27.7478 3.28431 25.4786 0.980713 20.5214 0.980713ZM10.5214 12.9807C5.18819 12.9807 1.85459 15.6474 0.521393 20.9807C2.52139 18.314 4.85459 17.314 7.52139 17.9807C9.04299 18.361 10.1302 19.465 11.3342 20.6867C13.295 22.6771 15.5642 24.9807 20.5214 24.9807C25.8546 24.9807 29.1882 22.314 30.5214 16.9807C28.5214 19.6474 26.1882 20.6474 23.5214 19.9807C21.9998 19.6004 20.9126 18.4965 19.7086 17.2748C17.7478 15.2843 15.4786 12.9807 10.5214 12.9807Z" />
                        </g>
                      </svg>
                    </div>
                  </div>

                  {/* React */}
                  <div className="group flex flex-col items-center gap-2 transition-transform duration-300 hover:scale-110">
                    <div className="text-white/60 transition-colors duration-300 group-hover:text-white">
                      <svg
                        className="fill-current"
                        width="48"
                        height="42"
                        viewBox="0 0 41 36"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path d="M40.5214 17.9856C40.5214 15.3358 37.203 12.8245 32.1154 11.2673C33.2894 6.08177 32.7678 1.95622 30.4686 0.63539C29.9386 0.325566 29.3186 0.178806 28.6422 0.178806V1.99699C29.017 1.99699 29.3186 2.07037 29.5714 2.20897C30.6802 2.84493 31.1614 5.26645 30.7862 8.38101C30.6966 9.14741 30.5498 9.95457 30.3706 10.7781C28.7726 10.3867 27.0278 10.0851 25.1934 9.88937C24.0926 8.38101 22.951 7.01125 21.8014 5.81273C24.4594 3.34229 26.9542 1.98883 28.6502 1.98883V0.170654C26.4082 0.170654 23.473 1.7687 20.505 4.54081C17.5374 1.78501 14.6022 0.203266 12.3598 0.203266V2.02145C14.0478 2.02145 16.5506 3.36673 19.2086 5.82089C18.0674 7.01941 16.9258 8.38101 15.8414 9.88937C13.9986 10.0851 12.2538 10.3867 10.6558 10.7862C10.4686 9.97089 10.3298 9.18001 10.2318 8.42177C9.84859 5.30721 10.3218 2.88569 11.4222 2.24157C11.667 2.09483 11.985 2.0296 12.3598 2.0296V0.211422C11.675 0.211422 11.0554 0.358178 10.5174 0.668006C8.22619 1.98883 7.71259 6.10626 8.89499 11.2754C3.82339 12.8409 0.521393 15.3439 0.521393 17.9856C0.521393 20.6354 3.8398 23.1466 8.9274 24.7039C7.7534 29.8894 8.27499 34.0149 10.5742 35.3358C11.1042 35.6456 11.7242 35.7923 12.409 35.7923C14.651 35.7923 17.5862 34.1943 20.5542 31.4222C23.5218 34.178 26.457 35.7597 28.699 35.7597C29.3842 35.7597 30.0038 35.613 30.5418 35.3031C32.833 33.9823 33.3466 29.8649 32.1642 24.6957C37.2194 23.1385 40.5214 20.6273 40.5214 17.9856ZM29.9058 12.5473C29.6042 13.5991 29.229 14.6835 28.805 15.7679C28.471 15.1156 28.1202 14.4634 27.737 13.8111C27.3622 13.1588 26.9626 12.5229 26.563 11.9032C27.7206 12.0745 28.8378 12.2864 29.9058 12.5473ZM26.1718 21.2306C25.5358 22.3313 24.8834 23.3749 24.2066 24.3451C22.9918 24.4511 21.7606 24.5082 20.5214 24.5082C19.2902 24.5082 18.059 24.4511 16.8526 24.3533C16.1758 23.3831 15.5154 22.3476 14.8794 21.2551C14.2598 20.187 13.697 19.1026 13.1834 18.01C13.689 16.9175 14.2598 15.8249 14.871 14.7569C15.507 13.6562 16.1594 12.6126 16.8362 11.6423C18.051 11.5363 19.2822 11.4793 20.5214 11.4793C21.7526 11.4793 22.9838 11.5363 24.1902 11.6342C24.867 12.6044 25.5274 13.6399 26.1634 14.7324C26.783 15.8005 27.3458 16.8849 27.8594 17.9774C27.3458 19.07 26.783 20.1625 26.1718 21.2306ZM28.805 20.1707C29.2454 21.2632 29.6206 22.3557 29.9302 23.4157C28.8622 23.6766 27.737 23.8967 26.571 24.0679C26.9706 23.4401 27.3702 22.796 27.7454 22.1356C28.1202 21.4833 28.471 20.8229 28.805 20.1707ZM20.5378 28.8702C19.7794 28.0875 19.021 27.2151 18.271 26.2611C19.005 26.2938 19.755 26.3182 20.5134 26.3182C21.2798 26.3182 22.0378 26.3019 22.7798 26.2611C22.0462 27.2151 21.2878 28.0875 20.5378 28.8702ZM14.4718 24.0679C13.3138 23.8967 12.197 23.6847 11.129 23.4238C11.4306 22.3721 11.8054 21.2877 12.2294 20.2033C12.5638 20.8555 12.9142 21.5078 13.2974 22.1601C13.6806 22.8123 14.0722 23.4483 14.4718 24.0679ZM20.497 7.10093C21.255 7.88365 22.0134 8.75605 22.7634 9.70998C22.0298 9.67737 21.2798 9.65293 20.5214 9.65293C19.755 9.65293 18.9966 9.66922 18.2546 9.70998C18.9886 8.75605 19.747 7.88365 20.497 7.10093ZM14.4634 11.9032C14.0642 12.531 13.6646 13.1751 13.2894 13.8356C12.9142 14.4878 12.5638 15.1401 12.2294 15.7923C11.7894 14.6998 11.4142 13.6073 11.1042 12.5473C12.1726 12.2946 13.2974 12.0745 14.4634 11.9032ZM7.08459 22.1111C4.19859 20.88 2.33139 19.2657 2.33139 17.9856C2.33139 16.7055 4.19859 15.083 7.08459 13.86C7.78579 13.5583 8.55219 13.2893 9.34339 13.0365C9.80779 14.6346 10.4194 16.2979 11.1778 18.0019C10.4278 19.6978 9.82419 21.3529 9.36779 22.9428C8.56059 22.69 7.79419 22.4128 7.08459 22.1111ZM11.4714 33.7622C10.3626 33.1262 9.8814 30.7047 10.2566 27.5901C10.3462 26.8237 10.493 26.0166 10.6722 25.1931C12.2702 25.5844 14.015 25.8861 15.8494 26.0818C16.9502 27.5901 18.0918 28.9599 19.2414 30.1584C16.5834 32.6289 14.0886 33.9823 12.3926 33.9823C12.0258 33.9742 11.7158 33.9008 11.4714 33.7622ZM30.811 27.5494C31.1942 30.6639 30.721 33.0855 29.6206 33.7296C29.3758 33.8763 29.0578 33.9415 28.683 33.9415C26.995 33.9415 24.4922 32.5963 21.8342 30.1421C22.9754 28.9436 24.117 27.582 25.2014 26.0736C27.0442 25.8779 28.789 25.5763 30.387 25.1768C30.5742 26.0003 30.721 26.7911 30.811 27.5494ZM33.9498 22.1111C33.2486 22.4128 32.4822 22.6819 31.6914 22.9346C31.2266 21.3366 30.615 19.6733 29.857 17.9693C30.607 16.2734 31.2102 14.6183 31.667 13.0284C32.4742 13.2811 33.2406 13.5583 33.9582 13.86C36.8442 15.0912 38.7114 16.7055 38.7114 17.9856C38.7034 19.2657 36.8362 20.8881 33.9498 22.1111Z" />
                        <path d="M20.5134 21.7133C22.5714 21.7133 24.2394 20.0451 24.2394 17.9873C24.2394 15.9294 22.5714 14.2612 20.5134 14.2612C18.4558 14.2612 16.7874 15.9294 16.7874 17.9873C16.7874 20.0451 18.4558 21.7133 20.5134 21.7133Z" />
                      </svg>
                    </div>
                  </div>

                  {/* Node.js */}
                  <div className="group flex flex-col items-center gap-2 transition-transform duration-300 hover:scale-110">
                    <div className="text-white/60 transition-colors duration-300 group-hover:text-white">
                      <svg
                        className="fill-current"
                        width="48"
                        height="48"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path d="M11.998,24c-0.321,0-0.641-0.084-0.922-0.247l-2.936-1.737c-0.438-0.245-0.224-0.332-0.08-0.383 c0.585-0.203,0.703-0.25,1.328-0.604c0.065-0.037,0.151-0.023,0.218,0.017l2.256,1.339c0.082,0.045,0.197,0.045,0.272,0l8.795-5.076 c0.082-0.047,0.134-0.141,0.134-0.238V6.921c0-0.099-0.053-0.192-0.137-0.242l-8.791-5.072c-0.081-0.047-0.189-0.047-0.271,0 L3.075,6.68C2.99,6.729,2.936,6.825,2.936,6.921v10.15c0,0.097,0.054,0.189,0.139,0.235l2.409,1.392 c1.307,0.654,2.108-0.116,2.108-0.89V7.787c0-0.142,0.114-0.253,0.256-0.253h1.115c0.139,0,0.255,0.112,0.255,0.253v10.021 c0,1.745-0.95,2.745-2.604,2.745c-0.508,0-0.909,0-2.026-0.551L2.28,18.675c-0.57-0.329-0.922-0.945-0.922-1.604V6.921 c0-0.659,0.353-1.275,0.922-1.603l8.795-5.082c0.557-0.315,1.296-0.315,1.848,0l8.794,5.082c0.57,0.329,0.924,0.944,0.924,1.603 v10.15c0,0.659-0.354,1.273-0.924,1.604l-8.794,5.078C12.643,23.916,12.324,24,11.998,24z M19.099,13.993 c0-1.9-1.284-2.406-3.987-2.763c-2.731-0.361-3.009-0.548-3.009-1.187c0-0.528,0.235-1.233,2.258-1.233 c1.807,0,2.473,0.389,2.747,1.607c0.024,0.115,0.129,0.199,0.247,0.199h1.141c0.071,0,0.138-0.031,0.186-0.081 c0.048-0.054,0.074-0.123,0.067-0.196c-0.177-2.098-1.571-3.076-4.388-3.076c-2.508,0-4.004,1.058-4.004,2.833 c0,1.925,1.488,2.457,3.895,2.695c2.88,0.282,3.103,0.703,3.103,1.269c0,0.983-0.789,1.402-2.642,1.402 c-2.327,0-2.839-0.584-3.011-1.742c-0.02-0.124-0.126-0.215-0.253-0.215h-1.137c-0.141,0-0.254,0.112-0.254,0.253 c0,1.482,0.806,3.248,4.655,3.248C17.501,17.007,19.099,15.91,19.099,13.993z" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Hero Image */}
          <div className="w-full px-4 mt-16">
            <div className={`relative z-10 mx-auto max-w-[900px] transition-all duration-1000 delay-300 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
              <div className="relative">
                {/* Glow effect behind image */}
                <div className="absolute inset-0 bg-gradient-to-t from-white/20 to-transparent blur-2xl transform scale-105"></div>
                
                {/* Main image with floating animation */}
                <div className="relative animate-float">
                  <img
                    src={heroImage}
                    alt="Fawtartak dashboard"
                    className="mx-auto rounded-t-2xl shadow-2xl w-[85%] sm:w-[75%] md:w-full border-4 border-white/20"
                  />
                </div>

                {/* Floating card elements */}
                <div className="absolute -start-4 top-1/4 hidden lg:block animate-float" style={{ animationDelay: '0.5s' }}>
                  <div className="bg-white rounded-lg shadow-xl p-4 backdrop-blur-sm bg-white/95">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                        <svg className="w-6 h-6 text-[#0884a9]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 font-medium">{t("hero.stats.appointments")}</p>
                        <p className="text-lg font-bold text-gray-900">{t("hero.stats.appointments_value")}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="absolute -end-4 top-1/3 hidden lg:block animate-float" style={{ animationDelay: '1s' }}>
                  <div className="bg-white rounded-lg shadow-xl p-4 backdrop-blur-sm bg-white/95">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                        <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 font-medium">{t("hero.stats.active_patients")}</p>
                        <p className="text-lg font-bold text-gray-900">{t("hero.stats.active_patients_value")}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Decorative dots - start */}
                <div className="absolute -start-9 bottom-0 z-[-1]">
                  <svg
                    width="134"
                    height="106"
                    viewBox="0 0 134 106"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <circle cx="1.66667" cy="104" r="1.66667" transform="rotate(-90 1.66667 104)" fill="white" fillOpacity="0.2" />
                    <circle cx="16.3333" cy="104" r="1.66667" transform="rotate(-90 16.3333 104)" fill="white" fillOpacity="0.2" />
                    <circle cx="31" cy="104" r="1.66667" transform="rotate(-90 31 104)" fill="white" fillOpacity="0.2" />
                    <circle cx="45.6667" cy="104" r="1.66667" transform="rotate(-90 45.6667 104)" fill="white" fillOpacity="0.2" />
                    <circle cx="60.3333" cy="104" r="1.66667" transform="rotate(-90 60.3333 104)" fill="white" fillOpacity="0.2" />
                    <circle cx="88.6667" cy="104" r="1.66667" transform="rotate(-90 88.6667 104)" fill="white" fillOpacity="0.2" />
                    <circle cx="117.667" cy="104" r="1.66667" transform="rotate(-90 117.667 104)" fill="white" fillOpacity="0.2" />
                    <circle cx="74.6667" cy="104" r="1.66667" transform="rotate(-90 74.6667 104)" fill="white" fillOpacity="0.2" />
                    <circle cx="103" cy="104" r="1.66667" transform="rotate(-90 103 104)" fill="white" fillOpacity="0.2" />
                    <circle cx="132" cy="104" r="1.66667" transform="rotate(-90 132 104)" fill="white" fillOpacity="0.2" />
                    <circle cx="1.66667" cy="89.3333" r="1.66667" transform="rotate(-90 1.66667 89.3333)" fill="white" fillOpacity="0.2" />
                    <circle cx="16.3333" cy="89.3333" r="1.66667" transform="rotate(-90 16.3333 89.3333)" fill="white" fillOpacity="0.2" />
                    <circle cx="31" cy="89.3333" r="1.66667" transform="rotate(-90 31 89.3333)" fill="white" fillOpacity="0.2" />
                    <circle cx="45.6667" cy="89.3333" r="1.66667" transform="rotate(-90 45.6667 89.3333)" fill="white" fillOpacity="0.2" />
                    <circle cx="60.3333" cy="89.3338" r="1.66667" transform="rotate(-90 60.3333 89.3338)" fill="white" fillOpacity="0.2" />
                    <circle cx="88.6667" cy="89.3338" r="1.66667" transform="rotate(-90 88.6667 89.3338)" fill="white" fillOpacity="0.2" />
                    <circle cx="117.667" cy="89.3338" r="1.66667" transform="rotate(-90 117.667 89.3338)" fill="white" fillOpacity="0.2" />
                    <circle cx="74.6667" cy="89.3338" r="1.66667" transform="rotate(-90 74.6667 89.3338)" fill="white" fillOpacity="0.2" />
                    <circle cx="103" cy="89.3338" r="1.66667" transform="rotate(-90 103 89.3338)" fill="white" fillOpacity="0.2" />
                    <circle cx="132" cy="89.3338" r="1.66667" transform="rotate(-90 132 89.3338)" fill="white" fillOpacity="0.2" />
                    <circle cx="1.66667" cy="74.6673" r="1.66667" transform="rotate(-90 1.66667 74.6673)" fill="white" fillOpacity="0.2" />
                    <circle cx="1.66667" cy="31.0003" r="1.66667" transform="rotate(-90 1.66667 31.0003)" fill="white" fillOpacity="0.2" />
                    <circle cx="16.3333" cy="74.6668" r="1.66667" transform="rotate(-90 16.3333 74.6668)" fill="white" fillOpacity="0.2" />
                    <circle cx="16.3333" cy="31.0003" r="1.66667" transform="rotate(-90 16.3333 31.0003)" fill="white" fillOpacity="0.2" />
                    <circle cx="31" cy="74.6668" r="1.66667" transform="rotate(-90 31 74.6668)" fill="white" fillOpacity="0.2" />
                    <circle cx="31" cy="31.0003" r="1.66667" transform="rotate(-90 31 31.0003)" fill="white" fillOpacity="0.2" />
                    <circle cx="45.6667" cy="74.6668" r="1.66667" transform="rotate(-90 45.6667 74.6668)" fill="white" fillOpacity="0.2" />
                    <circle cx="45.6667" cy="31.0003" r="1.66667" transform="rotate(-90 45.6667 31.0003)" fill="white" fillOpacity="0.2" />
                    <circle cx="60.3333" cy="74.6668" r="1.66667" transform="rotate(-90 60.3333 74.6668)" fill="white" fillOpacity="0.2" />
                    <circle cx="60.3333" cy="31.0001" r="1.66667" transform="rotate(-90 60.3333 31.0001)" fill="white" fillOpacity="0.2" />
                    <circle cx="88.6667" cy="74.6668" r="1.66667" transform="rotate(-90 88.6667 74.6668)" fill="white" fillOpacity="0.2" />
                    <circle cx="88.6667" cy="31.0001" r="1.66667" transform="rotate(-90 88.6667 31.0001)" fill="white" fillOpacity="0.2" />
                    <circle cx="117.667" cy="74.6668" r="1.66667" transform="rotate(-90 117.667 74.6668)" fill="white" fillOpacity="0.2" />
                    <circle cx="117.667" cy="31.0001" r="1.66667" transform="rotate(-90 117.667 31.0001)" fill="white" fillOpacity="0.2" />
                    <circle cx="74.6667" cy="74.6668" r="1.66667" transform="rotate(-90 74.6667 74.6668)" fill="white" fillOpacity="0.2" />
                    <circle cx="74.6667" cy="31.0001" r="1.66667" transform="rotate(-90 74.6667 31.0001)" fill="white" fillOpacity="0.2" />
                    <circle cx="103" cy="74.6668" r="1.66667" transform="rotate(-90 103 74.6668)" fill="white" fillOpacity="0.2" />
                    <circle cx="103" cy="31.0001" r="1.66667" transform="rotate(-90 103 31.0001)" fill="white" fillOpacity="0.2" />
                    <circle cx="132" cy="74.6668" r="1.66667" transform="rotate(-90 132 74.6668)" fill="white" fillOpacity="0.2" />
                    <circle cx="132" cy="31.0001" r="1.66667" transform="rotate(-90 132 31.0001)" fill="white" fillOpacity="0.2" />
                    <circle cx="1.66667" cy="60.0003" r="1.66667" transform="rotate(-90 1.66667 60.0003)" fill="white" fillOpacity="0.2" />
                    <circle cx="1.66667" cy="16.3336" r="1.66667" transform="rotate(-90 1.66667 16.3336)" fill="white" fillOpacity="0.2" />
                    <circle cx="16.3333" cy="60.0003" r="1.66667" transform="rotate(-90 16.3333 60.0003)" fill="white" fillOpacity="0.2" />
                    <circle cx="16.3333" cy="16.3336" r="1.66667" transform="rotate(-90 16.3333 16.3336)" fill="white" fillOpacity="0.2" />
                    <circle cx="31" cy="60.0003" r="1.66667" transform="rotate(-90 31 60.0003)" fill="white" fillOpacity="0.2" />
                    <circle cx="31" cy="16.3336" r="1.66667" transform="rotate(-90 31 16.3336)" fill="white" fillOpacity="0.2" />
                    <circle cx="45.6667" cy="60.0003" r="1.66667" transform="rotate(-90 45.6667 60.0003)" fill="white" fillOpacity="0.2" />
                    <circle cx="45.6667" cy="16.3336" r="1.66667" transform="rotate(-90 45.6667 16.3336)" fill="white" fillOpacity="0.2" />
                    <circle cx="60.3333" cy="60.0003" r="1.66667" transform="rotate(-90 60.3333 60.0003)" fill="white" fillOpacity="0.2" />
                    <circle cx="60.3333" cy="16.3336" r="1.66667" transform="rotate(-90 60.3333 16.3336)" fill="white" fillOpacity="0.2" />
                    <circle cx="88.6667" cy="60.0003" r="1.66667" transform="rotate(-90 88.6667 60.0003)" fill="white" fillOpacity="0.2" />
                    <circle cx="88.6667" cy="16.3336" r="1.66667" transform="rotate(-90 88.6667 16.3336)" fill="white" fillOpacity="0.2" />
                    <circle cx="117.667" cy="60.0003" r="1.66667" transform="rotate(-90 117.667 60.0003)" fill="white" fillOpacity="0.2" />
                    <circle cx="117.667" cy="16.3336" r="1.66667" transform="rotate(-90 117.667 16.3336)" fill="white" fillOpacity="0.2" />
                    <circle cx="74.6667" cy="60.0003" r="1.66667" transform="rotate(-90 74.6667 60.0003)" fill="white" fillOpacity="0.2" />
                    <circle cx="74.6667" cy="16.3336" r="1.66667" transform="rotate(-90 74.6667 16.3336)" fill="white" fillOpacity="0.2" />
                    <circle cx="103" cy="60.0003" r="1.66667" transform="rotate(-90 103 60.0003)" fill="white" fillOpacity="0.2" />
                    <circle cx="103" cy="16.3336" r="1.66667" transform="rotate(-90 103 16.3336)" fill="white" fillOpacity="0.2" />
                    <circle cx="132" cy="60.0003" r="1.66667" transform="rotate(-90 132 60.0003)" fill="white" fillOpacity="0.2" />
                    <circle cx="132" cy="16.3336" r="1.66667" transform="rotate(-90 132 16.3336)" fill="white" fillOpacity="0.2" />
                    <circle cx="1.66667" cy="45.3336" r="1.66667" transform="rotate(-90 1.66667 45.3336)" fill="white" fillOpacity="0.2" />
                    <circle cx="1.66667" cy="1.66683" r="1.66667" transform="rotate(-90 1.66667 1.66683)" fill="white" fillOpacity="0.2" />
                    <circle cx="16.3333" cy="45.3336" r="1.66667" transform="rotate(-90 16.3333 45.3336)" fill="white" fillOpacity="0.2" />
                    <circle cx="16.3333" cy="1.66683" r="1.66667" transform="rotate(-90 16.3333 1.66683)" fill="white" fillOpacity="0.2" />
                    <circle cx="31" cy="45.3336" r="1.66667" transform="rotate(-90 31 45.3336)" fill="white" fillOpacity="0.2" />
                    <circle cx="31" cy="1.66683" r="1.66667" transform="rotate(-90 31 1.66683)" fill="white" fillOpacity="0.2" />
                    <circle cx="45.6667" cy="45.3336" r="1.66667" transform="rotate(-90 45.6667 45.3336)" fill="white" fillOpacity="0.2" />
                    <circle cx="45.6667" cy="1.66683" r="1.66667" transform="rotate(-90 45.6667 1.66683)" fill="white" fillOpacity="0.2" />
                    <circle cx="60.3333" cy="45.3338" r="1.66667" transform="rotate(-90 60.3333 45.3338)" fill="white" fillOpacity="0.2" />
                    <circle cx="60.3333" cy="1.66707" r="1.66667" transform="rotate(-90 60.3333 1.66707)" fill="white" fillOpacity="0.2" />
                    <circle cx="88.6667" cy="45.3338" r="1.66667" transform="rotate(-90 88.6667 45.3338)" fill="white" fillOpacity="0.2" />
                    <circle cx="88.6667" cy="1.66707" r="1.66667" transform="rotate(-90 88.6667 1.66707)" fill="white" fillOpacity="0.2" />
                    <circle cx="117.667" cy="45.3338" r="1.66667" transform="rotate(-90 117.667 45.3338)" fill="white" fillOpacity="0.2" />
                    <circle cx="117.667" cy="1.66707" r="1.66667" transform="rotate(-90 117.667 1.66707)" fill="white" fillOpacity="0.2" />
                    <circle cx="74.6667" cy="45.3338" r="1.66667" transform="rotate(-90 74.6667 45.3338)" fill="white" fillOpacity="0.2" />
                    <circle cx="74.6667" cy="1.66707" r="1.66667" transform="rotate(-90 74.6667 1.66707)" fill="white" fillOpacity="0.2" />
                    <circle cx="103" cy="45.3338" r="1.66667" transform="rotate(-90 103 45.3338)" fill="white" fillOpacity="0.2" />
                    <circle cx="103" cy="1.66707" r="1.66667" transform="rotate(-90 103 1.66707)" fill="white" fillOpacity="0.2" />
                    <circle cx="132" cy="45.3338" r="1.66667" transform="rotate(-90 132 45.3338)" fill="white" fillOpacity="0.2" />
                    <circle cx="132" cy="1.66707" r="1.66667" transform="rotate(-90 132 1.66707)" fill="white" fillOpacity="0.2" />
                  </svg>
                </div>

                {/* Decorative dots - end */}
                <div className="absolute -end-9 top-0 z-[-1]">
                  <svg
                    width="134"
                    height="106"
                    viewBox="0 0 134 106"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <circle cx="1.66667" cy="104" r="1.66667" transform="rotate(-90 1.66667 104)" fill="white" fillOpacity="0.2" />
                    <circle cx="16.3333" cy="104" r="1.66667" transform="rotate(-90 16.3333 104)" fill="white" fillOpacity="0.2" />
                    <circle cx="31" cy="104" r="1.66667" transform="rotate(-90 31 104)" fill="white" fillOpacity="0.2" />
                    <circle cx="45.6667" cy="104" r="1.66667" transform="rotate(-90 45.6667 104)" fill="white" fillOpacity="0.2" />
                    <circle cx="60.3333" cy="104" r="1.66667" transform="rotate(-90 60.3333 104)" fill="white" fillOpacity="0.2" />
                    <circle cx="88.6667" cy="104" r="1.66667" transform="rotate(-90 88.6667 104)" fill="white" fillOpacity="0.2" />
                    <circle cx="117.667" cy="104" r="1.66667" transform="rotate(-90 117.667 104)" fill="white" fillOpacity="0.2" />
                    <circle cx="74.6667" cy="104" r="1.66667" transform="rotate(-90 74.6667 104)" fill="white" fillOpacity="0.2" />
                    <circle cx="103" cy="104" r="1.66667" transform="rotate(-90 103 104)" fill="white" fillOpacity="0.2" />
                    <circle cx="132" cy="104" r="1.66667" transform="rotate(-90 132 104)" fill="white" fillOpacity="0.2" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Bottom wave decoration */}
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
            fillOpacity="0.1"
          />
        </svg>
      </div>

      <style jsx>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-20px);
          }
        }
        
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
