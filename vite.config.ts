import { fileURLToPath, URL } from 'node:url'
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// CoreService launchSettings: https://localhost:7001 | http://localhost:5293
const defaultProxyTarget = 'https://localhost:7001'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const proxyTarget = (env.VITE_DEV_PROXY_TARGET ?? defaultProxyTarget).replace(/\/$/, '')

  return {
    plugins: [react()],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    server: {
      proxy: {
        '/api': {
          target: proxyTarget,
          changeOrigin: true,
          secure: false,
        },
      },
    },
  }
})
