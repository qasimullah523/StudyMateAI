import type { Config } from "tailwindcss";

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        heading: ["Fraunces", "serif"],
        body: ["Space Grotesk", "sans-serif"],
      },
      colors: {
        ink: "#1f2a44",
      },
    },
  },
  plugins: [],
} satisfies Config;
