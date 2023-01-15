/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [
    require('@tailwindcss/typography'),
    require('daisyui')
  ],
  daisyui: {
    darkTheme: "light",
    themes: [
      'light',
      {
        studio9: {
          "primary": "#d97706",
          "secondary": "#c2410c",
          "accent": "#fcd34d",
          "neutral": "#a8a29e",
          "base-100": "#fff",
          "info": "#fbbf24",
          "success": "#84cc16",
          "warning": "#1c1917",
          "error": "#7f1d1d",
        },
      },
    ]
  }
}
