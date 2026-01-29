/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
fontFamily: {
  sans: ['"Almarai"', 'system-ui', 'sans-serif'],
},

  },
  },
  darkMode: "class", // Enable class-based dark mode
  plugins: [require('daisyui')],
  daisyui: {
    themes: ["light", "dark"], // Ensure DaisyUI recognizes both themes
  },
extend: {
  animation: {
    gradientMove: 'gradientMove 6s ease infinite',
  },
  keyframes: {
    gradientMove: {
      '0%, 100%': { backgroundPosition: '0% 50%' },
      '50%': { backgroundPosition: '100% 50%' },
    },
  },
},
extend: {
  animation: {
    glow: 'glow 3s ease-in-out infinite',
  },
  keyframes: {
    glow: {
      '0%, 100%': { textShadow: '0 0 10px #5ce1e6, 0 0 20px #5ce1e6' },
      '50%': { textShadow: '0 0 2px #5ce1e6, 0 0 4px #5ce1e6' },
    },
  },
}

};
