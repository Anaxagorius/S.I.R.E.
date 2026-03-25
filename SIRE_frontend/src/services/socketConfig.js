/**
 * Author: Leon Wasiliew
 * Last Update: 2026-03-25
 * Description: Shared Socket.IO connection configuration for client components.
 */

/** Base URL for the Socket.IO server, derived from the API base URL by stripping the /api suffix. */
export const SOCKET_URL = (import.meta.env.VITE_API_BASE?.replace(/\/$/, "") || "http://localhost:8080").replace(/\/api$/, "");

/** Optional API key for authenticating Socket.IO connections. */
export const SOCKET_API_KEY = import.meta.env.VITE_API_KEY || null;
