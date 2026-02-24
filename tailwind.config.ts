import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: "#0033FF",
          accent: "#10CF84",
          alert: "#FA4A29",
        },
      },
      fontFamily: {
        heading: ["Poppins", "sans-serif"],
        body: ["Source Sans Pro", "sans-serif"],
      },
      backgroundImage: {
        "gradient-light": "linear-gradient(135deg, #EFF3FF 0%, #B0C0FF 100%)",
        "gradient-dark": "linear-gradient(135deg, #1840C4 0%, #06063C 100%)",
      },
      borderRadius: {
        "2xl": "1rem",
        "3xl": "1.5rem",
      },
    },
  },
  plugins: [],
};

export default config;
