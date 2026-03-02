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

 preview: {
  host: true,
  port: Number(process.env.PORT),
  allowedHosts: true,
},
server: {
  host: true,
  port: 5173,
  allowedHosts: true,
},
})
