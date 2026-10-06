import type { Config } from 'tailwindcss'
import animate from 'tailwindcss-animate'
import { theme } from './tailwind.theme'

export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{vue,ts}'],
  theme,
  plugins: [animate],
} satisfies Config
