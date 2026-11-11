/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#0A0C10",
        panel: "#11151B",
        line: "#1F2530",
        amber: {
          DEFAULT: "#E8A33D",
          soft: "#F2C572",
          dim: "#8A6321",
        },
        fog: "#8B95A1",
        bone: "#E6E8EB",
        danger: "#D9644F",
        live: "#5FB88A",
      },
      fontFamily: {
        mono: ["JetBrains Mono", "ui-monospace", "SFMono-Regular", "monospace"],
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
