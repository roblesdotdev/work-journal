import type { Config } from 'tailwindcss'
import colors from 'tailwindcss/colors'
import tailwindPluginForms from '@tailwindcss/forms'

export default {
  content: ['./app/**/*.{jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        gray: colors.neutral,
      },
    },
  },
  plugins: [tailwindPluginForms],
} satisfies Config
