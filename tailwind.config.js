/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        void:     "#05030A",
        surface:  "#0E0B17",
        surface2: "#161226",
        surface3: "#1E1833",
        aura: {
          purple:  "#A65BFF",
          blue:    "#3DDCFF",
          crimson: "#FF2E55",
          gold:    "#FFD166",
          green:   "#06FFA5",
        },
        line:  "#2A2440",
        line2: "#3D3560",
      },
      fontFamily: {
        display: ["var(--font-display)", "sans-serif"],
        body:    ["var(--font-body)", "sans-serif"],
        mono:    ["var(--font-mono)", "monospace"],
      },
      backgroundImage: {
        "aura-gradient":    "linear-gradient(135deg, #A65BFF 0%, #3DDCFF 100%)",
        "crimson-gradient": "linear-gradient(135deg, #FF2E55 0%, #A65BFF 100%)",
        "gold-gradient":    "linear-gradient(135deg, #FFD166 0%, #FF2E55 100%)",
        "hero-glow": "radial-gradient(ellipse 80% 50% at 50% -10%, rgba(166,91,255,0.25), transparent)",
        "grid-glow": "radial-gradient(circle at 50% 0%, rgba(166,91,255,0.18), transparent 60%)",
        "grid-pattern": "linear-gradient(rgba(166,91,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(166,91,255,0.04) 1px, transparent 1px)",
      },
      backgroundSize: {
        "grid-sm": "40px 40px",
      },
      boxShadow: {
        "glow":         "0 0 40px rgba(166, 91, 255, 0.35)",
        "glow-sm":      "0 0 20px rgba(166, 91, 255, 0.25)",
        "glow-blue":    "0 0 40px rgba(61, 220, 255, 0.3)",
        "glow-crimson": "0 0 40px rgba(255, 46, 85, 0.35)",
        "glow-gold":    "0 0 30px rgba(255, 209, 102, 0.3)",
        "card":         "0 4px 24px rgba(0,0,0,0.4)",
        "card-hover":   "0 8px 40px rgba(166,91,255,0.2)",
        "inner-glow":   "inset 0 1px 0 rgba(255,255,255,0.05)",
      },
      keyframes: {
        pulseGlow: {
          "0%, 100%": { opacity: "0.5", transform: "scale(1)" },
          "50%":      { opacity: "1",   transform: "scale(1.2)" },
        },
        rise: {
          "0%":   { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        fadeIn: {
          "0%":   { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideInRight: {
          "0%":   { opacity: "0", transform: "translateX(20px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        shimmer: {
          "0%":   { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%":      { transform: "translateY(-6px)" },
        },
        scanline: {
          "0%":   { transform: "translateY(-100%)" },
          "100%": { transform: "translateY(100vh)" },
        },
        countUp: {
          "0%":   { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        pulseGlow:    "pulseGlow 2.5s ease-in-out infinite",
        rise:         "rise 0.6s ease-out forwards",
        "rise-slow":  "rise 0.9s ease-out forwards",
        fadeIn:       "fadeIn 0.4s ease-out forwards",
        slideInRight: "slideInRight 0.5s ease-out forwards",
        shimmer:      "shimmer 2s linear infinite",
        float:        "float 3s ease-in-out infinite",
        scanline:     "scanline 4s linear infinite",
        countUp:      "countUp 0.5s ease-out forwards",
      },
      borderRadius: {
        "2xl": "1rem",
        "3xl": "1.5rem",
      },
      transitionTimingFunction: {
        "spring": "cubic-bezier(0.34, 1.56, 0.64, 1)",
      },
    },
  },
  plugins: [],
};
