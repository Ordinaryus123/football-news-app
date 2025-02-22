/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx}', // Include all files in the app directory
    './pages/**/*.{js,ts,jsx,tsx}', // Include pages directory (if still present or for legacy)
    './components/**/*.{js,ts,jsx,tsx}', // Include components directory (if you add any later)
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}