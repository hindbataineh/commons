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
        charcoal: "#1A1714",
        terracotta: "#C4572A",
        cream: "#F7F4EF",
        muted: "#7A7569",
        sand: "#D4C9B5",
        "off-white": "#FDFCFA",
      },
      fontFamily: {
        sans: ["var(--font-dm-sans)", "sans-serif"],
        display: ["var(--font-cormorant)", "serif"],
      },
    },
  },
  plugins: [],
};
export default config;
