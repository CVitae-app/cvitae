/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Poppins", "ui-sans-serif", "system-ui"],
      },
      fontSize: {
        xs: "0.75rem",
        sm: "0.875rem",
        base: "1rem",
        md: "1.125rem",
        lg: "1.25rem",
        xl: "1.5rem",
        "2xl": "1.75rem",
      },
      spacing: {
        128: "32rem",
        144: "36rem",
      },
      maxWidth: {
        a4: "794px",
      },
      maxHeight: {
        a4: "1123px",
      },
      breakAfter: {
        page: "page",
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
    function ({ addUtilities }) {
      addUtilities({
        '.avoid-break-inside': {
          breakInside: 'avoid',
          pageBreakInside: 'avoid',
        },
      })
    },
  ],
};
