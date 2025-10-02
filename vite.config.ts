import vue from '@vitejs/plugin-vue'
import { defineConfig, loadEnv } from 'vite'
import vueDevTools from 'vite-plugin-vue-devtools'
import {
  assetOptimizationConfig,
  baseConfig,
  devServerConfig,
  envConfig,
  previewServerConfig,
  pwaBuildConfig,
} from './vite.config.composables'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Load environment variables based on mode
  // Priority: .env.local > .env.[mode] > .env
  loadEnv(mode, process.cwd(), '')

  return {
    plugins: [vue(), vueDevTools()],
    ...baseConfig(),
    ...pwaBuildConfig(),
    ...devServerConfig(),
    ...previewServerConfig(),
    ...envConfig(),
    ...assetOptimizationConfig(),
  }
})
