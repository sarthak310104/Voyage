import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        navy: {
          DEFAULT: '#14213D',
          light: '#1F2E52',
          dark: '#0C1526'
        },
        coral: {
          DEFAULT: '#FF6B4A',
          light: '#FF8B6E',
          dark: '#E1502F'
        },
        sand: {
          DEFAULT: '#F2E9DC',
          light: '#FAF6EF',
          dark: '#E3D5BE'
        },
        teal: {
          DEFAULT: '#2A9D8F',
          light: '#3FBFAE',
          dark: '#20776C'
        }
      },
      fontFamily: {
        display: ['var(--font-fraunces)', 'Georgia', 'serif'],
        body: ['var(--font-inter)', 'ui-sans-serif', 'sans-serif']
      },
      borderRadius: {
        card: '18px'
      }
    }
  },
  plugins: []
};

export default config;
