import { securityConfig } from './securityConfig.mjs'
import { applicationLogger } from './logger.mjs'

/**
 * Sanitize audit payloads by filtering non-primitive values and unsafe keys.
 */
const sanitizePayload = (payload) => {
  if (!payload || typeof payload !== 'object') return null
  const allowed = Object.create(null)
  Object.entries(payload).forEach(([key, value]) => {
    if (key === '__proto__' || key === 'constructor' || key === 'prototype') return
    if (value === undefined) return
    if (value === null) {
      allowed[key] = null
    } else if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
      allowed[key] = value
    }
  })
  return Object.keys(allowed).length > 0 ? allowed : null
}

export const auditLogger = {
  event: ({ action, actor, context, outcome, correlationId, requestId }) => {
    if (!securityConfig.auditLogEnabled) return
    const sanitized = sanitizePayload(context) || {}
    applicationLogger.info('AUDIT', {
      action,
      actor,
      context: Object.keys(sanitized).length > 0 ? sanitized : null,
      outcome,
      correlationId,
      requestId,
      timestampIso: new Date().toISOString(),
    })
  },
}
