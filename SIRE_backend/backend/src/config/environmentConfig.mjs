
/**
 * environmentConfig.js
 * Centralized environment configuration with explicit naming.
 */
export const environmentConfig = Object.freeze({
  httpPort: Number(process.env.PORT || 8080),
  logLevel: String(process.env.LOG_LEVEL || 'info'),
  sessionMaxTrainees: Number(process.env.SESSION_MAX_TRAINEES || 10),
  allowedOrigins: process.env.ALLOWED_ORIGINS 
    ? String(process.env.ALLOWED_ORIGINS).split(',').map(origin => {
        const trimmedOrigin = origin.trim()
        if (trimmedOrigin === '*') return trimmedOrigin
        // Add https:// as a safety net for bare-hostname values (Render's fromService property: url returns a full URL)
        const withProtocol = /^https?:\/\//i.test(trimmedOrigin) ? trimmedOrigin : `https://${trimmedOrigin}`
        // Strip trailing slash — browser Origin headers never include one
        return withProtocol.replace(/\/$/, '')
      })
    : ['*'],
});

