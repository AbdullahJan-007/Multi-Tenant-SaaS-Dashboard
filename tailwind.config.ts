import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#12141C",
        canvas: "#F7F7F5",
        line: "#E4E4E0",
        accent: "#3E5C4A",
        accentSoft: "#E7EEE8",
        warn: "#9A3B1F"
      },
      fontFamily: {
        display: ["var(--font-display)", "serif"],
        body: ["var(--font-body)", "sans-serif"]
      },
      borderRadius: {
        sm: "4px",
        md: "6px"
      }
    }
  },
  plugins: []
};

export default config;
