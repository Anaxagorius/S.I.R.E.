// /SIRE_frontend/vite.config.js
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return {
    plugins: [react()],

    // Local dev (optional, tidy, and consistent)
    server: {
      host: true,                    // binds to 0.0.0.0
      port: 5173,
      allowedHosts: ['.up.railway.app'], // allow any subdomain like *.up.railway.app
    },

    // Production preview on Railway
    preview: {
      host: true,                                // binds to 0.0.0.0
      port: Number(env.PORT) || 8080,            // MUST bind to Railway's $PORT
      allowedHosts: ['.up.railway.app'],         // future-proof: allow all Railway app subdomains
    },
  }
})
