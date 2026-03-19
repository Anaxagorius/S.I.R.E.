/**
 * Resolves the backend base URL shared by the REST API client and the
 * Socket.IO client.
 *
 * In production builds (import.meta.env.PROD === true) VITE_API_BASE_URL
 * MUST be set at build time.  When the variable is absent the app logs a
 * clear error and throws so that the failure is obvious instead of silently
 * sending requests to localhost (which always fails in a deployed browser).
 *
 * In development the variable is optional and falls back to localhost:8080.
 */
export const resolveBackendUrl = () => {
  const url = import.meta.env.VITE_API_BASE_URL;
  if (!url) {
    if (import.meta.env.PROD) {
      const msg =
        '[SIRE] VITE_API_BASE_URL is not set. ' +
        'Set this environment variable on your Render static-site service ' +
        'to the backend origin (e.g. https://sire-api.onrender.com). ' +
        'The app cannot connect to the backend without it.';
      console.error(msg);
      throw new Error(msg);
    }
    return 'http://localhost:8080';
  }
  return url;
};

/**
 * Returns the API key used for both REST headers and the Socket.IO auth
 * payload.  Falls back to a well-known development value so that local
 * development works without extra configuration.
 */
export const resolveApiKey = () =>
  import.meta.env.VITE_API_KEY ?? 'local-dev-key';
