/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx}",
    "./components/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        coral: "#FF5470",
        coraldark: "#E43C58",
        violet: "#7C5CFC",
        gold: "#F4A828",
      },
    },
  },
  plugins: [],
};
