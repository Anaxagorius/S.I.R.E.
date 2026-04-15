/**
 * authRoute.mjs
 * Authentication endpoints for the new frontend API contract.
 * POST /login          - authenticate with email and password
 * POST /signup         - register a new user
 * POST /refresh-token  - refresh an access token
 * GET  /me             - get the current user profile
 * GET  /users          - list all users (admin only)
 * PUT  /users/:id/role - update a user's role (admin only)
 */
import { Router } from 'express'
import crypto from 'crypto'
import { auditLogger } from '../config/auditLogger.mjs'
import { buildAuditContext } from '../utils/auditContext.mjs'
import { isPlainObject, normalizeText } from '../utils/validation.mjs'
import { userDatabase } from '../models/userDatabase.mjs'
import { tokenStore } from '../models/tokenStore.mjs'
import { requireAuth, requireRole } from '../middleware/authMiddleware.mjs'

const router = Router()

/** Valid system roles. */
const SYSTEM_ROLES = new Set(['admin', 'facilitator', 'participant'])

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

  const user = userDatabase.getByEmail(email.toLowerCase())
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
  tokenStore.set(token, { userId: user.id, email: user.email, role: user.role || 'participant' })

  auditLogger.event({
    action: 'auth:login',
    actor: email,
    context: buildAuditContext({ userId: user.id, role: user.role }, ['userId', 'role']),
    outcome: 'success',
    correlationId: req.context?.correlationId,
    requestId: req.context?.requestId,
  })

  return res.json({ authToken: token, user: { id: user.id, email: user.email, name: user.name, role: user.role || 'participant' } })
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

  // Self-signup is always 'participant'. Admins promote users via PUT /users/:id/role.
  const role = 'participant'

  if (userDatabase.emailExists(email.toLowerCase())) {
    return res.status(409).json({ message: 'Email already registered', correlationId: req.context?.correlationId })
  }

  const id = crypto.randomUUID()
  const passwordHash = crypto.createHash('sha256').update(password).digest('hex')
  try {
    userDatabase.createUser({ id, email: email.toLowerCase(), name, passwordHash, role })
  } catch (err) {
    if (err.code === 'EMAIL_CONFLICT') {
      return res.status(409).json({ message: 'Email already registered', correlationId: req.context?.correlationId })
    }
    throw err
  }

  auditLogger.event({
    action: 'auth:signup',
    actor: email,
    context: buildAuditContext({ userId: id, role }, ['userId', 'role']),
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
  const user = userDatabase.getById(session.userId)

  if (!user) {
    return res.status(404).json({ message: 'User not found', correlationId: req.context?.correlationId })
  }

  return res.json({ id: user.id, email: user.email, name: user.name, role: user.role || 'participant' })
})

/** GET /users - list all registered users (admin only). */
router.get('/users', requireAuth, requireRole('admin'), (req, res) => {
  const users = userDatabase.listAll()

  auditLogger.event({
    action: 'admin:users:list',
    actor: req.auth?.user?.email || 'unknown',
    context: buildAuditContext({ count: users.length }, ['count']),
    outcome: 'success',
    correlationId: req.context?.correlationId,
    requestId: req.context?.requestId,
  })

  return res.json(users)
})

/** PUT /users/:id/role - update a user's system role (admin only). */
router.put('/users/:id/role', requireAuth, requireRole('admin'), (req, res) => {
  if (!isPlainObject(req.body)) {
    return res.status(400).json({ message: 'Invalid payload', correlationId: req.context?.correlationId })
  }

  const targetId = normalizeText(req.params.id, 64)
  const newRole = normalizeText(req.body.role, 32)

  if (!targetId) {
    return res.status(400).json({ message: 'User id is required', correlationId: req.context?.correlationId })
  }

  if (!newRole || !SYSTEM_ROLES.has(newRole)) {
    return res.status(400).json({ message: 'role must be one of: admin, facilitator, participant', correlationId: req.context?.correlationId })
  }

  const target = userDatabase.getById(targetId)
  if (!target) {
    return res.status(404).json({ message: 'User not found', correlationId: req.context?.correlationId })
  }

  // Prevent an admin from demoting themselves to avoid lockout
  if (target.id === req.auth.user.id && newRole !== 'admin') {
    return res.status(403).json({ message: 'Admins cannot change their own role', correlationId: req.context?.correlationId })
  }

  userDatabase.setRole(targetId, newRole)

  auditLogger.event({
    action: 'admin:users:role:update',
    actor: req.auth?.user?.email || 'unknown',
    context: buildAuditContext({ targetId, newRole }, ['targetId', 'newRole']),
    outcome: 'success',
    correlationId: req.context?.correlationId,
    requestId: req.context?.requestId,
  })

  return res.json({ id: targetId, role: newRole })
})

export default router

