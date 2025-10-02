import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 3000,
    strictPort: false,
  },
  optimizeDeps: {
    exclude: ["lovable-tagger"],
  },
  plugins: [
    react(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunks for large libraries
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'ui-vendor': [
            '@radix-ui/react-dialog',
            '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-popover',
            '@radix-ui/react-tabs',
            '@radix-ui/react-toast',
            '@radix-ui/react-select',
            '@radix-ui/react-accordion',
            '@radix-ui/react-avatar',
            '@radix-ui/react-checkbox',
            '@radix-ui/react-label',
            '@radix-ui/react-progress',
            '@radix-ui/react-slider',
            '@radix-ui/react-switch',
            '@radix-ui/react-tooltip'
          ],
          'form-vendor': [
            'react-hook-form',
            '@hookform/resolvers',
            'zod'
          ],
          'utils-vendor': [
            'date-fns',
            'clsx',
            'tailwind-merge',
            'class-variance-authority'
          ],
          'three-vendor': ['three', '@react-three/drei'],
          'chart-vendor': ['recharts'],
          // Application chunks
          'stores': [
            './src/stores/useMockAuthStore',
            './src/stores/usePersonasStore',
            './src/stores/useProjectsStore',
            './src/stores/useTasksStore',
            './src/stores/useGoalsStore',
            './src/stores/useMockIntegrationsStore',
            './src/stores/useKnowledgeItemsStore'
          ]
        }
      }
    },
    // Increase chunk size warning limit to 1000kB since this is a feature-rich app
    chunkSizeWarningLimit: 1000,
  },
}));
