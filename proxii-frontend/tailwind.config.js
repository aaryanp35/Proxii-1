/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        "proxii-emerald": "#2D8E6F",
        "proxii-rose": "#D4465E",
        "proxii-amber": "#E8B34F",
        "proxii-blue": "#3B82F6",
      },
      fontFamily: {
        sans: ["Satoshi", "system-ui", "sans-serif"],
        display: ["General Sans", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
