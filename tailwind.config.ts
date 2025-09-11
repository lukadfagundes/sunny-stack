import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Sunny Stack brand colors
        sunny: {
          red: '#DC2626',      // Vibrant red
          darkRed: '#991B1B',  // Deep red accent
          gold: '#FCD34D',     // Golden yellow
          orange: '#FB923C',   // Warm orange
          brown: '#92400E',    // Rich brown
          cream: '#FEF3C7',    // Soft cream
          sky: '#7DD3FC',      // Sky blue
          ocean: '#0284C7',    // Deep blue
        },
        // System colors
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
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      backgroundImage: {
        'sunny-gradient': 'linear-gradient(135deg, #FCD34D 0%, #FB923C 50%, #DC2626 100%)',
        'ocean-gradient': 'linear-gradient(180deg, #7DD3FC 0%, #0284C7 100%)',
      },
    },
  },
  plugins: [],
}

export default config