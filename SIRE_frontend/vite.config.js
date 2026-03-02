export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
    allowedHosts: true,   // allow any host (broad)
  },
  preview: {
    host: true,
    port: Number(process.env.PORT),
    allowedHosts: true,   // allow any host (broad)
  },
})
