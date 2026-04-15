import crypto from 'crypto'
import { securityConfig } from '../config/securityConfig.mjs'
import { auditLogger } from '../config/auditLogger.mjs'
import { generateRandomUuid, normalizeText } from '../utils/validation.mjs'
import { buildAuditContext } from '../utils/auditContext.mjs'
import { tokenStore } from '../models/tokenStore.mjs'
import { userDatabase } from '../models/userDatabase.mjs'

/**
 * Timing-safe comparison for sensitive values such as API keys.
 */
const safeEqual = (a, b) => {
  if (typeof a !== 'string' || typeof b !== 'string') return false
  const maxLength = Math.max(a.length, b.length, 1)
  const left = Buffer.alloc(maxLength, 0)
  const right = Buffer.alloc(maxLength, 0)
  Buffer.from(a).copy(left)
  Buffer.from(b).copy(right)
  return crypto.timingSafeEqual(left, right) && a.length === b.length
}

const resolveRequestId = (req) => {
  const headerValue = req.headers[securityConfig.requestIdHeader]
  const normalized = normalizeText(Array.isArray(headerValue) ? headerValue[0] : headerValue, 64)
  return normalized || generateRandomUuid()
}

export const attachRequestContext = (req, res, next) => {
  req.context = {
    requestId: resolveRequestId(req),
    correlationId: generateRandomUuid(),
  }
  res.setHeader(securityConfig.requestIdHeader, req.context.requestId)
  next()
}

export const requireApiKey = (req, res, next) => {
  if (!securityConfig.requireApiKey) {
    req.auth = { actor: 'anonymous', scope: 'open' }
    return next()
  }
  const provided = req.headers[securityConfig.apiKeyHeader]
  const candidate = Array.isArray(provided) ? provided[0] : provided
  if (securityConfig.apiKey && safeEqual(String(candidate || ''), securityConfig.apiKey)) {
    req.auth = { actor: 'api-key', scope: 'rest' }
    return next()
  }
  auditLogger.event({
    action: 'auth:failure',
    actor: 'unknown',
    context: buildAuditContext({ path: req.path, method: req.method }, ['path', 'method']),
    outcome: 'denied',
    correlationId: req.context?.correlationId,
    requestId: req.context?.requestId,
  })
  return res.status(401).json({ message: 'Unauthorized', correlationId: req.context?.correlationId })
}

export const requireTicket = (req, res, next) => {
  if (!securityConfig.requireTicketForMutations) return next()
  const method = req.method?.toUpperCase()
  if (method === 'GET' || method === 'HEAD' || method === 'OPTIONS') return next()
  const provided = req.headers[securityConfig.ticketHeader]
  const candidate = normalizeText(Array.isArray(provided) ? provided[0] : provided, 64)
  if (candidate) {
    Object.assign(req.context, { ticketId: candidate })
    return next()
  }
  auditLogger.event({
    action: 'ticket:missing',
    actor: req.auth?.actor || 'unknown',
    context: buildAuditContext({ path: req.path, method: req.method }, ['path', 'method']),
    outcome: 'denied',
    correlationId: req.context?.correlationId,
    requestId: req.context?.requestId,
  })
  return res.status(400).json({ message: 'Ticket ID required', correlationId: req.context?.correlationId })
}

/**
 * requireAuth — validates the Bearer token in the Authorization header.
 * On success, populates req.auth.user with { id, email, name, role }.
 * Returns 401 if no valid token is present.
 */
export const requireAuth = (req, res, next) => {
  const authHeader = req.headers.authorization
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null

  if (!token || !tokenStore.has(token)) {
    auditLogger.event({
      action: 'auth:token:missing',
      actor: 'unknown',
      context: buildAuditContext({ path: req.path, method: req.method }, ['path', 'method']),
      outcome: 'denied',
      correlationId: req.context?.correlationId,
      requestId: req.context?.requestId,
    })
    return res.status(401).json({ message: 'Unauthorized', correlationId: req.context?.correlationId })
  }

  const session = tokenStore.get(token)
  const user = userDatabase.getById(session.userId)

  if (!user) {
    tokenStore.delete(token)
    return res.status(401).json({ message: 'Unauthorized', correlationId: req.context?.correlationId })
  }

  req.auth = {
    ...req.auth,
    user: { id: user.id, email: user.email, name: user.name, role: user.role || 'participant' },
  }
  return next()
}

/**
 * requireRole — factory that returns middleware requiring the authenticated user to have
 * one of the specified system roles ('admin', 'facilitator', 'participant').
 * Must be used after requireAuth.
 *
 * Users with the 'admin' role always pass this check regardless of which roles
 * are listed, granting admins full access to all protected endpoints.
 *
 * @param {...string} roles - one or more allowed role strings
 */
export const requireRole = (...roles) => (req, res, next) => {
  const userRole = req.auth?.user?.role
  if (userRole === 'admin') return next()
  if (!userRole || !roles.includes(userRole)) {
    auditLogger.event({
      action: 'auth:role:forbidden',
      actor: req.auth?.user?.email || 'unknown',
      context: buildAuditContext({ requiredRoles: roles, userRole, path: req.path }, ['requiredRoles', 'userRole', 'path']),
      outcome: 'denied',
      correlationId: req.context?.correlationId,
      requestId: req.context?.requestId,
    })
    return res.status(403).json({ message: 'Forbidden', correlationId: req.context?.correlationId })
  }
  return next()
}
