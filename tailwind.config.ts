import type { Config } from "tailwindcss";

const withOpacity = (variable: string) =>
  `rgb(var(${variable}) / <alpha-value>)`;

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    // If you keep Tailwind class literals in lib/ files (e.g. status →
    // color maps), Tailwind's JIT scanner must see them or the CSS won't
    // be emitted. Keep this entry.
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        accent: {
          DEFAULT: withOpacity("--color-accent"),
          hover: withOpacity("--color-accent-hover"),
          muted: "var(--color-accent-muted)",
        },
        surface: {
          primary: withOpacity("--color-surface-primary"),
          secondary: withOpacity("--color-surface-secondary"),
          elevated: withOpacity("--color-surface-elevated"),
          border: withOpacity("--color-surface-border"),
        },
        text: {
          primary: withOpacity("--color-text-primary"),
          secondary: withOpacity("--color-text-secondary"),
          muted: withOpacity("--color-text-muted"),
        },
      },
      fontFamily: {
        sans: [
          "var(--font-inter, ui-sans-serif)",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "Helvetica Neue",
          "Arial",
          "sans-serif",
        ],
      },
    },
  },
  plugins: [require("@tailwindcss/typography")],
};

export default config;
