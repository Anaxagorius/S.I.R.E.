
/**
 * environmentConfig.js
 * Centralized environment configuration with explicit naming.
 */
export const environmentConfig = Object.freeze({
  httpPort: Number(process.env.PORT || 8080),
  logLevel: String(process.env.LOG_LEVEL || 'info'),
  sessionMaxTrainees: Number(process.env.SESSION_MAX_TRAINEES || 10),
});

