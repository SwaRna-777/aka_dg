/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: ["./src/**/*.{js,jsx,ts,tsx}", "./public/index.html"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["'DM Sans'", "system-ui", "sans-serif"],
        display: ["'Syne'", "system-ui", "sans-serif"],
        mono: ["'JetBrains Mono'", "monospace"],
      },
      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: { DEFAULT: "hsl(var(--card))", foreground: "hsl(var(--card-foreground))" },
        primary: { DEFAULT: "hsl(var(--primary))", foreground: "hsl(var(--primary-foreground))" },
        secondary: { DEFAULT: "hsl(var(--secondary))", foreground: "hsl(var(--secondary-foreground))" },
        muted: { DEFAULT: "hsl(var(--muted))", foreground: "hsl(var(--muted-foreground))" },
        accent: { DEFAULT: "hsl(var(--accent))", foreground: "hsl(var(--accent-foreground))" },
        destructive: { DEFAULT: "hsl(var(--destructive))", foreground: "hsl(var(--destructive-foreground))" },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        ai: { DEFAULT: "#00d4aa", dark: "#00b894", light: "#55efc4", glow: "rgba(0,212,170,0.2)" },
      },
      borderRadius: { lg: "var(--radius)", md: "calc(var(--radius) - 2px)", sm: "calc(var(--radius) - 4px)" },
      keyframes: {
        "fade-up": { from: { opacity: 0, transform: "translateY(16px)" }, to: { opacity: 1, transform: "translateY(0)" } },
        "pulse-glow": { "0%,100%": { boxShadow: "0 0 20px rgba(0,212,170,0.3)" }, "50%": { boxShadow: "0 0 40px rgba(0,212,170,0.6)" } },
        "typing": { from: { width: 0 }, to: { width: "100%" } },
        "blink": { "0%,100%": { borderColor: "transparent" }, "50%": { borderColor: "hsl(var(--foreground))" } },
      },
      animation: {
        "fade-up": "fade-up 0.4s ease-out forwards",
        "pulse-glow": "pulse-glow 2s infinite",
        "typing": "typing 1s steps(20)",
        "blink": "blink 0.8s infinite",
      }
    },
  },
  plugins: [require("tailwindcss-animate")],
}
