const defaultTheme = require('tailwindcss/defaultTheme');

module.exports = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        background: 'hsl(var(--color-background) / <alpha-value>)',
        surface: 'hsl(var(--color-surface) / <alpha-value>)',
        overlay: 'hsl(var(--color-overlay) / <alpha-value>)',
        accent: 'hsl(var(--color-accent) / <alpha-value>)',
        'accent-strong': 'hsl(var(--color-accent-strong) / <alpha-value>)',
        border: 'hsl(var(--color-border) / <alpha-value>)',
        muted: 'hsl(var(--color-muted) / <alpha-value>)',
        'text-primary': 'hsl(var(--color-text-primary) / <alpha-value>)',
        'text-secondary': 'hsl(var(--color-text-secondary) / <alpha-value>)'
      },
      fontFamily: {
        sans: ['var(--font-sans)', ...defaultTheme.fontFamily.sans],
        serif: ['var(--font-serif)', ...defaultTheme.fontFamily.serif]
      },
      boxShadow: {
        card: '0 10px 30px rgba(0, 0, 0, 0.6)'
      }
    }
  },
  plugins: []
};
