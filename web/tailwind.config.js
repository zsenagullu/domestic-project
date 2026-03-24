/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'domates-red': '#E63946',
        'domates-beige': '#FDFBF7',
        'domates-dark': '#1D3557',
        'domates-gray': '#F4F4F5',
        'domates-text': '#2D3748',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      boxShadow: {
        'soft': '0 10px 40px -10px rgba(0,0,0,0.08)',
        'red-glow': '0 4px 20px -5px rgba(230,57,70,0.4)',
      }
    },
  },
  plugins: [],
}
