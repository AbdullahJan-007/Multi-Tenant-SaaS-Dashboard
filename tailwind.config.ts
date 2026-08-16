import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#15181D",
        paper: "#FAFAF8",
        canvas: "#FAFAF8",
        surface: "#FFFFFF",
        line: "#E6E4DF",
        accent: "#2F5233",
        accentSoft: "#E7EEE7",
        accentStrong: "#213B26",
        amber: "#B8842E",
        amberSoft: "#F5EBDA",
        warn: "#B03B23",
        warnSoft: "#F6E7E2"
      },
      fontFamily: {
        display: ["var(--font-display)", "serif"],
        body: ["var(--font-body)", "sans-serif"]
      },
      borderRadius: {
        sm: "6px",
        md: "10px",
        lg: "14px"
      },
      boxShadow: {
        soft: "0 1px 2px rgba(21, 24, 29, 0.04), 0 1px 1px rgba(21, 24, 29, 0.03)",
        card: "0 1px 3px rgba(21, 24, 29, 0.05), 0 8px 24px -12px rgba(21, 24, 29, 0.10)",
        panel: "0 20px 60px -20px rgba(21, 24, 29, 0.35)"
      }
    }
  },
  plugins: []
};

export default config;
