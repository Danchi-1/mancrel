/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#2D3748', // Slate gray - professional, calm
          light: '#4A5568',
          dark: '#1A202C'
        },
        accent: {
          DEFAULT: '#4F46E5', // Indigo - AI-first, confident
          light: '#6366F1',
          dark: '#4338CA'
        },
        neutral: {
          50: '#F9FAFB',
          100: '#F3F4F6',
          200: '#E5E7EB',
          300: '#D1D5DB',
          500: '#6B7280',
          700: '#374151',
          900: '#111827'
        },
        success: {
          DEFAULT: '#10B981', // Emerald
          light: '#34D399',
          dark: '#059669'
        },
        bg: {
          DEFAULT: '#FFFFFF',
          secondary: '#F9FAFB',
          tertiary: '#F3F4F6'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Sora', 'Inter', 'sans-serif']
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem'
      }
    },
  },
  plugins: [],
}