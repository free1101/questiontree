/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#4F46E5",
          light: "#6366F1",
          soft: "#EEF2FF",
        },
        surface: {
          DEFAULT: "#F8FAFC",
          dark: "#0F172A",
        },
        ink: {
          DEFAULT: "#0F172A",
          secondary: "#64748B",
        },
        accent: {
          DEFAULT: "#F59E0B",
        },
        success: "#10B981",
        danger: "#EF4444",
        info: "#2563EB",
      },
      fontFamily: {
        sans: ["PingFang SC", "Inter", "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 3px rgba(15, 23, 42, 0.06), 0 1px 2px rgba(15, 23, 42, 0.04)",
        lift: "0 8px 24px rgba(15, 23, 42, 0.10)",
      },
      keyframes: {
        "fade-in": {
          "0%": { opacity: "0", transform: "translateY(4px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "blink-caret": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.25s ease-out",
        "blink-caret": "blink-caret 1s step-end infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
