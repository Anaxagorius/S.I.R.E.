import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
  },
  preview: {
    host: true,                               // bind to 0.0.0.0
    port: Number(process.env.PORT) || 8080,   // bind to Railway's $PORT
    allowedHosts: [
      'friendly-mindfulness-production-292c.up.railway.app' // <- add your exact host
    ],
  },
})
