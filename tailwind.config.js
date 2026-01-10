/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./content.js", "./background.js"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "Segoe UI", "system-ui", "-apple-system", "sans-serif"],
      },
      colors: {
        "bf-primary": "#1a1a1a",
        "bf-secondary": "#666666",
        "bf-accent": "#ff3366",
        "bf-bg": "#fafafa",
        "bf-surface": "#ffffff",
        "bf-border": "#e5e5e5",
      },
      spacing: {
        15: "3.75rem",
        22: "5.5rem",
        25: "6.25rem",
        90: "22.5rem",
      },
      width: {
        90: "22.5rem",
      },
      minWidth: {
        15: "3.75rem",
        90: "22.5rem",
      },
      minHeight: {
        25: "6.25rem",
      },
      maxHeight: {
        canvas: "calc(100vh - 200px)",
      },
      boxShadow: {
        canvas:
          "0 4px 24px rgba(0, 0, 0, 0.08), 0 1px 2px rgba(0, 0, 0, 0.04), inset 0 0 0 1px rgba(255, 255, 255, 0.5)",
        toolbar:
          "0 4px 24px rgba(0, 0, 0, 0.12), 0 1px 4px rgba(0, 0, 0, 0.08)",
      },
      backgroundImage: {
        "overlay-gradient":
          "linear-gradient(160deg, rgba(255, 200, 180, 0.5) 0%, rgba(255, 215, 195, 0.35) 25%, rgba(250, 240, 235, 0.2) 50%, rgba(250, 250, 250, 0) 75%)",
      },
      zIndex: {
        overlay: "2147483647",
        100: "100",
        1000: "1000",
      },
      animation: {
        "slide-up": "slideUp 0.3s ease",
      },
      keyframes: {
        slideUp: {
          from: {
            opacity: "0",
            transform: "translateX(-50%) translateY(20px)",
          },
          to: {
            opacity: "1",
            transform: "translateX(-50%) translateY(0)",
          },
        },
      },
    },
  },
  plugins: [],
  // Important: Use important to override page styles
  important: true,
};
