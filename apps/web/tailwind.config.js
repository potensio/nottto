/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      fontFamily: {
        inter: ["Inter", "sans-serif"],
        manrope: ["Manrope", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
        "instrument-serif": ["Instrument Serif", "serif"],
      },
      colors: {
        accent: "#ff5500",
      },
      animation: {
        blob: "moveGradient 10s infinite alternate cubic-bezier(0.4, 0, 0.2, 1)",
        "orbit-spin": "orbitSpin 20s linear infinite",
        "orbit-spin-reverse": "orbitSpinReverse 30s linear infinite",
        "beam-move": "beamMove 2s linear infinite",
        reveal: "reveal 1s cubic-bezier(0.77, 0, 0.175, 1) forwards",
      },
      keyframes: {
        moveGradient: {
          "0%": { transform: "translate(0, 0) scale(1)" },
          "33%": { transform: "translate(30px, -50px) scale(1.1)" },
          "66%": { transform: "translate(-20px, 20px) scale(0.9)" },
          "100%": { transform: "translate(0, 0) scale(1)" },
        },
        orbitSpin: {
          from: { transform: "rotate(0deg)" },
          to: { transform: "rotate(360deg)" },
        },
        orbitSpinReverse: {
          from: { transform: "rotate(360deg)" },
          to: { transform: "rotate(0deg)" },
        },
        beamMove: {
          to: { strokeDashoffset: "-210" },
        },
        reveal: {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(101%)" },
        },
      },
    },
  },
  plugins: [],
};
