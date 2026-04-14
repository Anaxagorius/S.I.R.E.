/**
 * tokenStore.mjs
 * Shared in-memory token store for auth session tracking.
 * Extracted so both authRoute.mjs and authMiddleware.mjs can reference it.
 *
 * Each entry stores: { userId, email, role }
 */

/** @type {Map<string, { userId: string, email: string, role: string }>} */
const store = new Map()

export const tokenStore = {
  /** Store a session entry for a token. */
  set: (token, session) => store.set(token, session),

  /** Retrieve a session entry by token. Returns undefined if not found. */
  get: (token) => store.get(token),

  /** Returns true if the token exists. */
  has: (token) => store.has(token),

  /** Remove a token from the store. */
  delete: (token) => store.delete(token),
}
