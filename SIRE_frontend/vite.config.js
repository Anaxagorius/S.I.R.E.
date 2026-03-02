import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],

  // local dev (not strictly necessary for Railway, but nice to keep consistent)
  server: {
    host: true, // 0.0.0.0
    port: 5173,
    // Allow the whole Railway app domain family (and localhost/IPs are already allowed by default)
    allowedHosts: ['.up.railway.app'], // allows any subdomain like *.up.railway.app
  },

  // production preview on Railway
  preview: {
    host: true,                               // 0.0.0.0
    port: Number(process.env.PORT) || 8080,   // MUST bind to $PORT on Railway
    allowedHosts: ['.up.railway.app'],        // same wildcard allowance for preview
  },
})
