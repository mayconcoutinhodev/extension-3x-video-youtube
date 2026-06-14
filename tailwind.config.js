/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/popup/**/*.{html,ts}', './src/options/**/*.{html,ts}'],
  theme: {
    extend: {
      colors: {
        yt: {
          red: '#ff0000',
          bg: '#0f0f0f',
          surface: '#212121',
          border: '#3f3f3f',
          text: '#f1f1f1',
          muted: '#aaaaaa',
        },
      },
    },
  },
  plugins: [],
}
