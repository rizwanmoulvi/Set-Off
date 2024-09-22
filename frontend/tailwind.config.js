/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        textGray: '#9ca3af',
        lightGray: '#1c1c24',
        darkGray: '#13131a',
        peach: '#FEFAE0',
        beige: '#DDA15E',
        emerald: '#4acd8d',
        textGreen: '#0f172a',
        olive: '#606C38',
        greenOne: '#283618',
      },
      fontSize: {
        '10xl': '10rem', // Example custom font size
        '11xl': '11rem', // Another example custom font size
        '12xl': '12rem', // Additional custom font size
        '15xl' : '15rem',
      },
    },
  },
  plugins: [],
};
