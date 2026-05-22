/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Almarai"', "system-ui", "sans-serif"],
      },
      colors: {
        app: {
          bg: "rgb(var(--app-bg-rgb) / <alpha-value>)",
          surface: "rgb(var(--app-surface-rgb) / <alpha-value>)",
          "surface-alt": "rgb(var(--app-surface-alt-rgb) / <alpha-value>)",
          border: "rgb(var(--app-border-rgb) / <alpha-value>)",
          text: "rgb(var(--app-text-rgb) / <alpha-value>)",
          "text-soft": "rgb(var(--app-text-soft-rgb) / <alpha-value>)",
          muted: "rgb(var(--app-text-muted-rgb) / <alpha-value>)",
          faint: "rgb(var(--app-text-faint-rgb) / <alpha-value>)",
          accent: "rgb(var(--app-accent-rgb) / <alpha-value>)",
        },
      },
      boxShadow: {
        app: "var(--app-shadow)",
        "app-sm": "var(--app-shadow-sm)",
        "app-lg": "var(--app-shadow-lg)",
      },
    },
  },
  plugins: [],
};
