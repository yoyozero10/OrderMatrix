import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./hooks/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
    "./providers/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        canvas: "rgb(var(--color-canvas) / <alpha-value>)",
        ink: "rgb(var(--color-ink) / <alpha-value>)",
        moss: "rgb(var(--color-moss) / <alpha-value>)",
        ember: "rgb(var(--color-ember) / <alpha-value>)",
        cloud: "rgb(var(--color-cloud) / <alpha-value>)",
        slate: "rgb(var(--color-slate) / <alpha-value>)",
        mist: "rgb(var(--color-mist) / <alpha-value>)",
        apple: {
          bg: "#f5f5f7",
          text: "#1d1d1f",
          blue: "#0071e3",
          hairline: "rgba(0, 0, 0, 0.08)",
          live: "#30d158"
        }
      },
      boxShadow: {
        card: "0 16px 45px -24px rgba(31, 42, 55, 0.45)",
        soft: "0 10px 30px -18px rgba(68, 87, 109, 0.35)"
      },
      borderRadius: {
        xl2: "1.25rem"
      },
      keyframes: {
        drift: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-6px)" }
        },
        rise: {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" }
        },
        reveal: {
          "0%": { opacity: "0", transform: "translateY(18px) scale(0.98)" },
          "100%": { opacity: "1", transform: "translateY(0) scale(1)" }
        },
        glow: {
          "0%, 100%": { boxShadow: "0 0 0 rgba(31, 122, 100, 0)" },
          "50%": { boxShadow: "0 0 18px rgba(31, 122, 100, 0.35)" }
        }
      },
      animation: {
        drift: "drift 6s ease-in-out infinite",
        rise: "rise 420ms ease-out both",
        reveal: "reveal 560ms cubic-bezier(0.2, 0.8, 0.2, 1) both",
        glow: "glow 2800ms ease-in-out infinite"
      }
    }
  },
  plugins: []
};

export default config;
