/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}"
  ],
  theme: {
    extend: {
      colors: {
        "background": "#faf8ff",
        "on-secondary": "#ffffff",
        "on-secondary-container": "#592600",
        "primary-fixed-dim": "#b7c6ee",
        "secondary-container": "#fb7800",
        "tertiary": "#001c03",
        "on-primary-container": "#8392b7",
        "secondary-fixed": "#ffdbc8",
        "tertiary-fixed-dim": "#88d982",
        "surface-variant": "#e1e2ec",
        "surface-tint": "#4f5e81",
        "on-secondary-fixed": "#321200",
        "on-tertiary": "#ffffff",
        "secondary": "#994700",
        "on-primary-fixed-variant": "#384668",
        "tertiary-container": "#003307",
        "outline": "#75777f",
        "surface-container-lowest": "#ffffff",
        "on-tertiary-fixed": "#002204",
        "on-tertiary-fixed-variant": "#005312",
        "on-background": "#191b22",
        "tertiary-fixed": "#a3f69c",
        "on-surface-variant": "#45464e",
        "surface-bright": "#faf8ff",
        "surface-container": "#ededf7",
        "on-error": "#ffffff",
        "inverse-on-surface": "#f0f0fa",
        "primary-fixed": "#d9e2ff",
        "surface-container-high": "#e7e7f1",
        "on-primary": "#ffffff",
        "inverse-primary": "#b7c6ee",
        "secondary-fixed-dim": "#ffb68b",
        "surface-dim": "#d9d9e3",
        "primary-container": "#1b2a4a",
        "on-secondary-fixed-variant": "#753400",
        "inverse-surface": "#2e3038",
        "surface": "#faf8ff",
        "error-container": "#ffdad6",
        "on-primary-fixed": "#0a1a3a",
        "primary": "#041534",
        "surface-container-highest": "#e1e2ec",
        "on-surface": "#191b22",
        "outline-variant": "#c5c6cf",
        "on-tertiary-container": "#54a353",
        "error": "#ba1a1a",
        "on-error-container": "#93000a",
        "surface-container-low": "#f2f3fd"
      },
      fontFamily: {
        "headline": ["Manrope", "sans-serif"],
        "body": ["Inter", "sans-serif"],
        "label": ["Inter", "sans-serif"]
      },
      borderRadius: {
        "DEFAULT": "0.125rem",
        "lg": "0.25rem",
        "xl": "0.5rem",
        "full": "0.75rem"
      },
      animation: {
        fadeIn: "fadeIn 0.5s ease-in-out",
        slideUp: "slideUp 0.5s ease-out",
        slideDown: "slideDown 0.5s ease-out",
        slideIn: "slideIn 0.3s ease-out",
        pulse: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        bounce: "bounce 1s infinite",
        scaleIn: "scaleIn 0.3s ease-out"
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" }
        },
        slideUp: {
          "0%": { transform: "translateY(20px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" }
        },
        slideDown: {
          "0%": { transform: "translateY(-20px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" }
        },
        slideIn: {
          "0%": { transform: "translateX(-10px)", opacity: "0" },
          "100%": { transform: "translateX(0)", opacity: "1" }
        },
        scaleIn: {
          "0%": { transform: "scale(0.95)", opacity: "0" },
          "100%": { transform: "scale(1)", opacity: "1" }
        }
      }
    },
  },
  plugins: [],
}
