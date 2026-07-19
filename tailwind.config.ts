import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // MyUnitManager theme — values live in app/globals.css (CSS vars)
        cream: "rgb(var(--color-cream) / <alpha-value>)",
        paper: "rgb(var(--color-paper) / <alpha-value>)",
        ink: "rgb(var(--color-ink) / <alpha-value>)",
        soot: "rgb(var(--color-soot) / <alpha-value>)",
        line: "rgb(var(--color-line) / <alpha-value>)",
        clay: {
          50: "rgb(var(--color-clay-50) / <alpha-value>)",
          100: "rgb(var(--color-clay-100) / <alpha-value>)",
          200: "rgb(var(--color-clay-200) / <alpha-value>)",
          500: "rgb(var(--color-clay-500) / <alpha-value>)",
          600: "rgb(var(--color-clay-600) / <alpha-value>)",
          700: "rgb(var(--color-clay-700) / <alpha-value>)",
        },
        lime: {
          300: "rgb(var(--color-lime-300) / <alpha-value>)",
          400: "rgb(var(--color-lime-400) / <alpha-value>)",
          500: "rgb(var(--color-lime-500) / <alpha-value>)",
        },
        limeink: "rgb(var(--color-limeink) / <alpha-value>)",
        sage: {
          100: "rgb(var(--color-sage-100) / <alpha-value>)",
          600: "rgb(var(--color-sage-600) / <alpha-value>)",
          700: "rgb(var(--color-sage-700) / <alpha-value>)",
        },
        danger: {
          50: "rgb(var(--color-danger-50) / <alpha-value>)",
          200: "rgb(var(--color-danger-200) / <alpha-value>)",
          600: "rgb(var(--color-danger-600) / <alpha-value>)",
          700: "rgb(var(--color-danger-700) / <alpha-value>)",
        },
      },
      fontFamily: {
        sans: [
          "var(--font-inter)",
          "Inter",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Helvetica Neue",
          "Arial",
          "sans-serif",
        ],
        display: [
          "var(--font-inter)",
          "Inter",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "sans-serif",
        ],
      },
      boxShadow: {
        card: "0 1px 2px rgb(20 30 10 / 0.03), 0 2px 8px rgb(20 30 10 / 0.04)",
        raised:
          "0 1px 2px rgb(20 30 10 / 0.06), 0 8px 24px rgb(20 30 10 / 0.10)",
        lime: "0 2px 8px rgb(112 190 58 / 0.35)",
        nav: "0 -2px 14px rgb(20 30 10 / 0.07)",
      },
      borderRadius: {
        xl: "0.75rem",
        "2xl": "0.875rem",
        "3xl": "1.25rem",
      },
    },
  },
  plugins: [],
};
export default config;
