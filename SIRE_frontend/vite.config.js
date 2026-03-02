// /SIRE_frontend/vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],

  // Local dev (optional but tidy)
  server: {
    host: true,        // 0.0.0.0
    port: 5173,
    allowedHosts: ['.up.railway.app'], // allow all subdomains of up.railway.app
  },

  // Production preview on Railway
  preview: {
    host: true,                               // 0.0.0.0
    port: Number(process.env.PORT) || 8080,   // MUST use Railway's $PORT
    allowedHosts: ['.up.railway.app'],        // same allowance for preview
  },
})
