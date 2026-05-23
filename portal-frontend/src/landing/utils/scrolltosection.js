export const scrollToSection = (id, options = {}) => {
  const { offset = -90, behavior = "smooth" } = options;

  const el = document.getElementById(id);
  if (!el) return;

  const y =
    el.getBoundingClientRect().top + window.pageYOffset + offset;

  window.scrollTo({ top: y, behavior });
};
