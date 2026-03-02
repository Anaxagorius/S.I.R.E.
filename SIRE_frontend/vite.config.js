// /SIRE_frontend/vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],

  // used by `npm run dev` locally (optional but handy)
  server: {
    host: true,                         // 0.0.0.0
    port: 5173,
  },

  // used by `npm run preview` in Railway
  preview: {
    host: true,                         // 0.0.0.0
    port: Number(process.env.PORT) || 8080,
    allowedHosts: [
      // 👇 add your exact Railway public host here (no protocol)
      'friendly-mindfulness-production-8efc.up.railway.app',
    ],
  },
})
