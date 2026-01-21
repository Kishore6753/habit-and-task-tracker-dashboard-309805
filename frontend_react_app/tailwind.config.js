/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./public/index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        appbg: "#f9fafb",
        surface: "#ffffff",
        text: "#111827",
        primary: "#3b82f6",
        secondary: "#64748b",
        success: "#06b6d4",
        error: "#EF4444"
      }
    }
  },
  plugins: []
};
