/* Pedia Bloom — static Tailwind build (replaces the Play CDN).
 * Colors resolve through CSS variables (rgb(var(--x) / <alpha-value>)) defined in
 * src/styles.src.css :root / html.dark, so one class flip drives dark mode. */
const tokenColor = (name) => `rgb(var(--${name}) / <alpha-value>)`;
const TOKENS = [
  "background", "on-background", "surface", "surface-dim", "surface-bright",
  "surface-container-lowest", "surface-container-low", "surface-container",
  "surface-container-high", "surface-container-highest", "on-surface", "on-surface-variant",
  "surface-variant", "inverse-surface", "inverse-on-surface", "outline", "outline-variant",
  "surface-tint", "primary", "on-primary", "primary-container", "on-primary-container",
  "inverse-primary", "secondary", "on-secondary", "secondary-container", "on-secondary-container",
  "tertiary", "on-tertiary", "tertiary-container", "on-tertiary-container",
  "error", "on-error", "error-container", "on-error-container",
  "primary-fixed", "primary-fixed-dim", "on-primary-fixed", "on-primary-fixed-variant",
  "secondary-fixed", "secondary-fixed-dim", "on-secondary-fixed", "on-secondary-fixed-variant",
  "tertiary-fixed", "tertiary-fixed-dim", "on-tertiary-fixed", "on-tertiary-fixed-variant",
  "fresh-teal",
];
const colors = Object.fromEntries(TOKENS.map((t) => [t, tokenColor(t)]));

/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  // Scan everything that can reference a class, including the 1.2 MB screen bundle.
  content: ["./index.html", "./app/**/*.js"],
  // app.js builds some classes by string concatenation ("bg-"+color+"-container"),
  // which the scanner cannot see — safelist those token-driven families explicitly.
  safelist: [
    { pattern: /^(bg|text|border|from|to|ring)-(primary|secondary|tertiary)$/ },
    { pattern: /^(bg|text|border|from|to)-(primary|secondary|tertiary)-(container|fixed|fixed-dim)$/ },
    { pattern: /^text-on-(primary|secondary|tertiary)-(container|fixed|fixed-variant)$/ },
    "bg-surface-variant", "text-fresh-teal", "border-tertiary-container", "text-outline",
  ],
  theme: {
    extend: {
      colors,
      borderRadius: { sm: "0.25rem", DEFAULT: "0.5rem", md: "0.75rem", lg: "1rem", xl: "1.5rem", "2xl": "1.75rem", full: "9999px" },
      spacing: { "container-max": "1200px", "margin-mobile": "24px", unit: "8px", gutter: "24px", "margin-desktop": "64px", "touch-target": "48px" },
      screens: { xs: "420px" },
      boxShadow: {
        "storybook-sm": "0 4px 12px -4px rgba(23,29,22,0.10)",
        storybook: "0 8px 20px -6px rgba(23,29,22,0.12)",
        "storybook-lg": "0 16px 32px -10px rgba(23,29,22,0.16)",
      },
      fontFamily: {
        "display-id": ["Quicksand"], "display-en": ["Quicksand"], "headline-xl": ["Quicksand"],
        "headline-lg-mobile": ["Quicksand"], "headline-lg": ["Quicksand"],
        "body-md": ["Quicksand"], "body-lg": ["Quicksand"], "label-md": ["Quicksand"], "label-sm": ["Quicksand"],
      },
      fontSize: {
        "display-id": ["40px", { lineHeight: "48px", letterSpacing: "-0.02em", fontWeight: "700" }],
        "display-en": ["24px", { lineHeight: "32px", fontWeight: "500" }],
        "headline-xl": ["40px", { lineHeight: "48px", letterSpacing: "-0.02em", fontWeight: "700" }],
        "headline-lg-mobile": ["28px", { lineHeight: "36px", fontWeight: "700" }],
        "headline-lg": ["32px", { lineHeight: "40px", fontWeight: "700" }],
        "body-lg": ["20px", { lineHeight: "30px", fontWeight: "500" }],
        "body-md": ["18px", { lineHeight: "28px", fontWeight: "400" }],
        "label-md": ["16px", { lineHeight: "20px", fontWeight: "600" }],
        "label-sm": ["14px", { lineHeight: "20px", fontWeight: "600" }],
      },
    },
  },
  plugins: [require("@tailwindcss/forms")],
};
