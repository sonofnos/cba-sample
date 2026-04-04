import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        surface: {
          50: "#f6f8f7",
          100: "#edf2ef",
          200: "#d9e3dd",
          300: "#c5d4ca",
          400: "#94af9a",
          500: "#4e6958",
          600: "#1d3c34",
          700: "#11261f",
          800: "#0b1a15",
        },
        market: {
          nigeria: "#008753",
          ghana: "#b61f3a",
          kenya: "#7b2335",
          southafrica: "#0b6272",
          senegal: "#f2c94c",
          rwanda: "#1f6feb",
          zambia: "#19a974",
        },
        success: "#0f9f6e",
        warning: "#d97706",
        danger: "#c2410c",
      },
      fontFamily: {
        sans: ["'DM Sans'", "ui-sans-serif", "system-ui", "sans-serif"],
        display: ["'Clash Display'", "'DM Sans'", "ui-sans-serif", "sans-serif"],
      },
      boxShadow: {
        panel: "0 18px 45px rgba(10, 25, 20, 0.12)",
      },
      backgroundImage: {
        grid: "linear-gradient(rgba(17, 38, 31, 0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(17, 38, 31, 0.05) 1px, transparent 1px)",
      },
    },
  },
  plugins: [],
} satisfies Config;
