/**
 * authRoute.mjs
 * Authentication endpoints for the new frontend API contract.
 * POST /login          - authenticate with email and password
 * POST /signup         - register a new user
 * POST /refresh-token  - refresh an access token
 * GET  /me             - get the current user profile
 *
 * NOTE: This implementation uses an in-memory user store and issues simple
 * tokens for demonstration purposes. Replace with a persistent database
 * and secure JWT library for production use.
 */
import { Router } from 'express'
import crypto from 'crypto'
import { auditLogger } from '../config/auditLogger.mjs'
import { buildAuditContext } from '../utils/auditContext.mjs'
import { isPlainObject, normalizeText } from '../utils/validation.mjs'

const router = Router()

/** Simple in-memory user store (keyed by email). */
const userStore = new Map()

/** Simple in-memory token store (keyed by token). */
const tokenStore = new Map()

/** Generates a random opaque token. */
const generateToken = () => crypto.randomBytes(32).toString('hex')

/** POST /login - authenticates a user and returns an access token. */
router.post('/login', (req, res) => {
  if (!isPlainObject(req.body)) {
    return res.status(400).json({ message: 'Invalid payload', correlationId: req.context?.correlationId })
  }

  const email = normalizeText(req.body.email, 254)
  const password = normalizeText(req.body.password, 128)

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required', correlationId: req.context?.correlationId })
  }

  const user = userStore.get(email.toLowerCase())
  if (!user) {
    auditLogger.event({
      action: 'auth:login',
      actor: email,
      context: buildAuditContext({ reason: 'user_not_found' }, ['reason']),
      outcome: 'denied',
      correlationId: req.context?.correlationId,
      requestId: req.context?.requestId,
    })
    return res.status(401).json({ message: 'Invalid credentials', correlationId: req.context?.correlationId })
  }

  const hash = crypto.createHash('sha256').update(password).digest('hex')
  if (hash !== user.passwordHash) {
    auditLogger.event({
      action: 'auth:login',
      actor: email,
      context: buildAuditContext({ reason: 'invalid_password' }, ['reason']),
      outcome: 'denied',
      correlationId: req.context?.correlationId,
      requestId: req.context?.requestId,
    })
    return res.status(401).json({ message: 'Invalid credentials', correlationId: req.context?.correlationId })
  }

  const token = generateToken()
  tokenStore.set(token, { userId: user.id, email: user.email })

  auditLogger.event({
    action: 'auth:login',
    actor: email,
    context: buildAuditContext({ userId: user.id }, ['userId']),
    outcome: 'success',
    correlationId: req.context?.correlationId,
    requestId: req.context?.requestId,
  })

  return res.json({ authToken: token, user: { id: user.id, email: user.email, name: user.name } })
})

/** POST /signup - registers a new user account. */
router.post('/signup', (req, res) => {
  if (!isPlainObject(req.body)) {
    return res.status(400).json({ message: 'Invalid payload', correlationId: req.context?.correlationId })
  }

  const email = normalizeText(req.body.email, 254)
  const password = normalizeText(req.body.password, 128)
  const name = normalizeText(req.body.name, 64)

  if (!email || !password || !name) {
    return res.status(400).json({ message: 'Email, password, and name are required', correlationId: req.context?.correlationId })
  }

  if (userStore.has(email.toLowerCase())) {
    return res.status(409).json({ message: 'Email already registered', correlationId: req.context?.correlationId })
  }

  const id = crypto.randomUUID()
  const passwordHash = crypto.createHash('sha256').update(password).digest('hex')
  userStore.set(email.toLowerCase(), { id, email: email.toLowerCase(), name, passwordHash })

  auditLogger.event({
    action: 'auth:signup',
    actor: email,
    context: buildAuditContext({ userId: id }, ['userId']),
    outcome: 'success',
    correlationId: req.context?.correlationId,
    requestId: req.context?.requestId,
  })

  return res.status(201).json({ message: 'Account created successfully' })
})

/** POST /refresh-token - refreshes an access token (stub - issues a new token for valid tokens). */
router.post('/refresh-token', (req, res) => {
  if (!isPlainObject(req.body)) {
    return res.status(400).json({ message: 'Invalid payload', correlationId: req.context?.correlationId })
  }

  const oldToken = normalizeText(req.body.refreshToken, 128)
  if (!oldToken || !tokenStore.has(oldToken)) {
    return res.status(401).json({ message: 'Invalid or expired token', correlationId: req.context?.correlationId })
  }

  const session = tokenStore.get(oldToken)
  tokenStore.delete(oldToken)
  const newToken = generateToken()
  tokenStore.set(newToken, session)

  return res.json({ authToken: newToken })
})

/** GET /me - returns the current authenticated user's profile. */
router.get('/me', (req, res) => {
  const authHeader = req.headers.authorization
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null

  if (!token || !tokenStore.has(token)) {
    return res.status(401).json({ message: 'Unauthorized', correlationId: req.context?.correlationId })
  }

  const session = tokenStore.get(token)
  const user = Array.from(userStore.values()).find((u) => u.id === session.userId)

  if (!user) {
    return res.status(404).json({ message: 'User not found', correlationId: req.context?.correlationId })
  }

  return res.json({ id: user.id, email: user.email, name: user.name })
})

export default router
