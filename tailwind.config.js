/** @type {import('tailwindcss').Config} */
const colors = require("./src/constants/Colors");

module.exports = {
  // NOTE: Update this to include the paths to all of your component files.
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: 'var(--color-primary)',
        secondary: 'var(--color-secondary)',
        background: 'var(--color-background)',
        text: 'var(--color-text)',
        card: 'var(--color-card)',
        border: 'var(--color-border)',
        ...colors,
      },
    },
  },
  plugins: [],
};
