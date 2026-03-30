import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        display: ["var(--font-playfair)", "Georgia", "serif"],
      },
      colors: {
        brand: {
          50: "#faf5f0",
          100: "#f0e4d6",
          200: "#e0c7ab",
          300: "#cda577",
          400: "#bf8a53",
          500: "#b17340",
          600: "#9a5c35",
          700: "#7d462d",
          800: "#683a2b",
          900: "#583226",
          950: "#321813",
        },
      },
    },
  },
  plugins: [],
};

export default config;
