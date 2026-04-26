import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-rubik)", "system-ui", "sans-serif"],
      },
      colors: {
        cream: {
          50: "#fffcf7",
          100: "#faf3e8",
          200: "#f0e6d4",
          300: "#e0d0b4",
        },
        olive: {
          200: "#c4cea8",
          300: "#9daa7d",
          500: "#6b7a52",
          600: "#576544",
          700: "#445036",
          800: "#353f2b",
          900: "#2a3223",
        },
      },
    },
  },
  plugins: [],
};

export default config;
