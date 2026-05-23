import { useNavigate, useLocation } from "react-router-dom";

export default function useScrollToSection() {
  const navigate = useNavigate();
  const location = useLocation();

  const scrollToSection = (id) => {
    // Already on landing page
    if (location.pathname === "/") {
      const el = document.getElementById(id);
      if (!el) return;

      const yOffset = -90; // navbar height
      const y =
        el.getBoundingClientRect().top + window.pageYOffset + yOffset;

      window.scrollTo({ top: y, behavior: "smooth" });
      return;
    }

    // Coming from another page
    sessionStorage.setItem("scrollTarget", id);
    navigate("/");
  };

  return scrollToSection;
}
