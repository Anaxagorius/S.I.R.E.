/**
 * Author: Leon Wasiliew
 * Last Update: 2026-03-30
 * Description: Shared Socket.IO connection configuration for client components.
 */

/** Raw API base from Vite env (may be a bare hostname from Render's fromService). */
const _rawApiBase = import.meta.env.VITE_API_BASE?.replace(/\/$/, "") || "http://localhost:8080";

/** Ensure the URL has a protocol prefix — Render's hostMachineUrl may omit it. */
const _apiBaseWithProto = /^https?:\/\//i.test(_rawApiBase) ? _rawApiBase : `https://${_rawApiBase}`;

/** Base URL for the Socket.IO server, derived from the API base URL by stripping the /api suffix. */
export const SOCKET_URL = _apiBaseWithProto.replace(/\/api$/, "");

/** Optional API key for authenticating Socket.IO connections. */
export const SOCKET_API_KEY = import.meta.env.VITE_API_KEY || null;
