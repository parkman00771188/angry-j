/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          "Inter",
          "Pretendard",
          "ui-sans-serif",
          "system-ui",
          "Apple SD Gothic Neo",
          "Malgun Gothic",
          "sans-serif",
        ],
      },
      boxShadow: {
        calm: "0 18px 45px rgba(15, 23, 42, 0.07)",
      },
    },
  },
  plugins: [],
};
