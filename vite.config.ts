import { defineConfig } from 'vite'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'

function figmaAssetResolver() {
  return {
    name: 'figma-asset-resolver',
    resolveId(id) {
      if (id.startsWith('figma:asset/')) {
        const filename = id.replace('figma:asset/', '')
        return path.resolve(__dirname, 'src/assets', filename)
      }
    },
  }
}

function vendorChunkName(id: string) {
  if (!id.includes('node_modules')) return undefined

  if (
    id.includes('/react/')
    || id.includes('/react-dom/')
    || id.includes('/scheduler/')
    || id.includes('/react-router/')
  ) return 'vendor-react'

  if (id.includes('/@supabase/')) return 'vendor-supabase'

  if (
    id.includes('/@mui/')
    || id.includes('/@emotion/')
    || id.includes('/@popperjs/')
  ) return 'vendor-mui'

  if (id.includes('/@radix-ui/')) return 'vendor-radix'

  if (
    id.includes('/recharts/')
    || id.includes('/d3-')
    || id.includes('/victory-vendor/')
  ) return 'vendor-charts'

  if (
    id.includes('/motion/')
    || id.includes('/framer-motion/')
    || id.includes('/embla-carousel')
    || id.includes('/react-slick/')
  ) return 'vendor-motion'

  if (
    id.includes('/lucide-react/')
    || id.includes('/date-fns/')
    || id.includes('/canvas-confetti/')
  ) return 'vendor-utilities'

  return 'vendor'
}

export default defineConfig({
  plugins: [
    figmaAssetResolver(),
    // The React and Tailwind plugins are both required for Make, even if
    // Tailwind is not being actively used – do not remove them
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      // Alias @ to the src directory
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: vendorChunkName,
      },
    },
  },

  // File types to support raw imports. Never add .css, .tsx, or .ts files to this.
  assetsInclude: ['**/*.svg', '**/*.csv'],
})
