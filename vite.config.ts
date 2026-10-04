import { defineConfig, splitVendorChunkPlugin, type PluginOption } from 'vite'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { sourceLineEndingNormalizationTransform } from './build/sourceLineEndingNormalizationTransform.mjs'
import { buyerOrdersSharedRouteTransform } from './build/buyerOrdersSharedRouteTransform.mjs'
import { profileClaimIdentityTransform } from './build/profileClaimIdentityTransform.mjs'
import { profileClaimProfileAiTransform } from './build/profileClaimProfileAiTransform.mjs'
import { photoUploadYearInputTransform } from './build/photoUploadYearInputTransform.mjs'
import { productionReadinessTransform } from './build/productionReadinessTransform.mjs'

function figmaAssetResolver() {
  return {
    name: 'figma-asset-resolver',
    resolveId(id: string) {
      if (id.startsWith('figma:asset/')) {
        const filename = id.replace('figma:asset/', '')
        return path.resolve(__dirname, 'src/assets', filename)
      }
    },
  }
}

export default defineConfig({
  plugins: [
    figmaAssetResolver() as PluginOption,
    sourceLineEndingNormalizationTransform() as PluginOption,
    buyerOrdersSharedRouteTransform() as PluginOption,
    profileClaimIdentityTransform() as PluginOption,
    profileClaimProfileAiTransform() as PluginOption,
    photoUploadYearInputTransform() as PluginOption,
    productionReadinessTransform() as PluginOption,
    // The React and Tailwind plugins are both required for Make, even if
    // Tailwind is not being actively used – do not remove them
    react(),
    tailwindcss(),
    splitVendorChunkPlugin(),
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
        onlyExplicitManualChunks: true,
        manualChunks(id) {
          const normalized = id.replaceAll('\\\\', '/')

          const srcMarker = '/src/'
          const srcIndex = normalized.lastIndexOf(srcMarker)
          if (srcIndex >= 0) {
            const relative = normalized.slice(srcIndex + srcMarker.length)
            if (!relative.includes('/') && relative !== 'main.tsx' && /\\.(ts|tsx)$/.test(relative)) {
              return 'enhancements'
            }
          }

          const routeMounts = [
            '/src/app/AdminCmsPanelsMount.tsx',
            '/src/app/AdminOverviewDashboardMount.tsx',
            '/src/app/AdminCommerceOrdersMount.tsx',
            '/src/app/AdminTicketLotsMount.tsx',
            '/src/app/AdminTicketProductCopyMount.tsx',
            '/src/app/ContactResearchPage.tsx',
            '/src/app/OperationsRouteGuard.tsx',
            '/src/app/PublicCmsStrictGuard.tsx',
            '/src/app/PublicTicketsCatalogMount.tsx',
          ]
          if (routeMounts.some(modulePath => normalized.endsWith(modulePath))) {
            return 'route-mounts'
          }
        },
      },
    },
  },

  // File types to support raw imports. Never add .css, .tsx, or .ts files to this.
  assetsInclude: ['**/*.svg', '**/*.csv'],
})
