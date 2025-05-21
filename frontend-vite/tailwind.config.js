/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        "oxford-blue": "#14213d",
        "orange-web": "#fca311"
      },
    },
  },
  plugins: [],
}

