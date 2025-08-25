/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      colors: {
        'theme-primary': 'var(--primary-color)',
        'theme-secondary': 'var(--secondary-color)',
        'theme-accent': 'var(--accent-color)',
        'theme-text': 'var(--text-color)',
        'theme-bg': 'var(--bg-color)',
      },
      fontFamily: {
        sans: 'var(--font-sans)',
        serif: 'var(--font-serif)',
      },
    },
  },
  plugins: [],
}