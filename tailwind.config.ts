import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Brand system
        linen: "#EDE8E0",
        carbon: "#1C1A17",
        gold: "#E9B949",
        "sea-green": "#2A6B4D",
        cream: "#F7F4EE",
        stone: "#57524A",
        "border-color": "#D8D2C6",
        mint: "#DCEBE2",
        // Legacy tokens kept for backward compat
        charcoal: "#1A1714",
        terracotta: "#C4572A",
        muted: "#7A7569",
        sand: "#D4C9B5",
        "off-white": "#FDFCFA",
      },
      fontFamily: {
        sans: ["var(--font-readex)", "sans-serif"],
        display: ["var(--font-cormorant)", "serif"],
      },
    },
  },
  plugins: [],
};
export default config;
