/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  darkMode: "class",
  theme: {
    container: {
      center: true,
      padding: "1.5rem",
      screens: { "2xl": "1152px" },
    },
    extend: {
      fontFamily: {
        sans: ['"Noto Sans"', "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ['"Noto Sans Mono"', "ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
      },
      colors: {
        border: "hsl(var(--border))",
        "border-strong": "hsl(var(--border-strong))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        st: {
          live: "hsl(var(--st-live))",
          "live-bg": "hsl(var(--st-live-bg))",
          "live-bd": "hsl(var(--st-live-bd))",
          unstable: "hsl(var(--st-unstable))",
          "unstable-bg": "hsl(var(--st-unstable-bg))",
          "unstable-bd": "hsl(var(--st-unstable-bd))",
          down: "hsl(var(--st-down))",
          "down-bg": "hsl(var(--st-down-bg))",
          "down-bd": "hsl(var(--st-down-bd))",
          maint: "hsl(var(--st-maint))",
          "maint-bg": "hsl(var(--st-maint-bg))",
          "maint-bd": "hsl(var(--st-maint-bd))",
          nodata: "hsl(var(--st-nodata))",
          "nodata-bg": "hsl(var(--st-nodata-bg))",
          "nodata-bd": "hsl(var(--st-nodata-bd))",
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
