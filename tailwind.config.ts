import type { Config } from 'tailwindcss';

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#2d3748',
        foreground: '#e2e8f0',
        border: '#4a5568',
        input: '#1a202c',
        ring: '#4fd1c5',
        
        card: {
          DEFAULT: '#374151',
          foreground: '#e2e8f0',
          border: '#4a5568',
        },
        popover: {
          DEFAULT: '#374151',
          foreground: '#e2e8f0',
          border: '#4a5568',
        },
        
        primary: {
          DEFAULT: '#4fd1c5',
          foreground: '#1a202c',
          border: '#45b8ac',
        },
        secondary: {
          DEFAULT: '#48606e',
          foreground: '#e2e8f0',
          border: '#3d4d59',
        },
        
        muted: {
          DEFAULT: '#4a5568',
          foreground: '#a0aec0',
          border: '#2d3748',
        },
        
        accent: {
          DEFAULT: '#4fd1c5',
          foreground: '#1a202c',
          border: '#45b8ac',
        },
        
        destructive: {
          DEFAULT: '#f56565',
          foreground: '#1a202c',
          border: '#e53e3e',
        },
        
        sidebar: {
          DEFAULT: '#2d3748',
          foreground: '#e2e8f0',
          border: '#4a5568',
          primary: '#4fd1c5',
          'primary-foreground': '#1a202c',
          'primary-border': '#45b8ac',
          accent: '#48606e',
          'accent-foreground': '#e2e8f0',
          'accent-border': '#3d4d59',
          ring: '#4fd1c5',
        },
        
        chart: {
          1: '#4fd1c5',
          2: '#48606e',
          3: '#60a5fa',
          4: '#a78bfa',
          5: '#fbbf24',
        },
      },
      fontFamily: {
        sans: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        serif: 'Georgia, serif',
        mono: 'Menlo, monospace',
      },
      borderRadius: {
        sm: '0.375rem',
        md: '0.5rem',
        lg: '0.75rem',
        xl: '1rem',
      },
      boxShadow: {
        '2xs': '0px 2px 4px 0px rgba(0,0,0,0.4)',
        xs: '0px 2px 4px 0px rgba(0,0,0,0.4)',
        sm: '0px 2px 4px 0px rgba(0,0,0,0.4), 0px 1px 2px -1px rgba(0,0,0,0.3)',
        DEFAULT: '0px 4px 8px 0px rgba(0,0,0,0.5), 0px 1px 2px -1px rgba(0,0,0,0.3)',
        md: '0px 4px 12px 0px rgba(0,0,0,0.5), 0px 2px 4px -1px rgba(0,0,0,0.4)',
        lg: '0px 8px 20px 0px rgba(0,0,0,0.6), 0px 4px 6px -1px rgba(0,0,0,0.4)',
        xl: '0px 12px 28px 0px rgba(0,0,0,0.7), 0px 8px 10px -1px rgba(0,0,0,0.5)',
        '2xl': '0px 20px 40px 0px rgba(0,0,0,0.8)',
      },
    },
  },
  plugins: [],
} satisfies Config;
