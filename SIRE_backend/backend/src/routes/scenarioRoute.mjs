/**
 * scenarioRoute.mjs
 * Exposes available scenario keys from the scenario registry.
 * Also provides CRUD endpoints for custom (author-created) scenarios stored in the database.
 */
import { Router } from 'express'
import { nanoid } from 'nanoid'
import { scenarioRegistry } from '../services/scenarioRegistry.mjs'
import { sireDatabase } from '../models/sireDatabase.mjs'
import { auditLogger } from '../config/auditLogger.mjs'
import { buildAuditContext } from '../utils/auditContext.mjs'
import { normalizeScenarioKey, isPlainObject } from '../utils/validation.mjs'
import { requireAuth, requireRole } from '../middleware/authMiddleware.mjs'

const router = Router()

/** Clamp a string to a maximum character length, returning null when the value is missing. */
function clampString(value, max) {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  return trimmed.length > max ? trimmed.slice(0, max) : trimmed || null
}

/** Validate and sanitise a full custom scenario body. Returns { error } on failure or the cleaned data. */
function parseScenarioBody(body) {
  if (!isPlainObject(body)) return { error: 'Invalid payload' }

  const title = clampString(body.title, 200)
  if (!title) return { error: 'title is required' }

  const description  = clampString(body.description, 500) || ''
  const category     = clampString(body.category, 64) || ''
  const difficulty   = clampString(body.difficulty, 32) || 'Intermediate'

  const tags = Array.isArray(body.tags)
    ? body.tags.map(t => String(t).trim()).filter(Boolean).slice(0, 20)
    : []

  const objectives = Array.isArray(body.objectives)
    ? body.objectives.map(o => String(o).trim()).filter(Boolean).slice(0, 50)
    : []

  const discussionPrompts = Array.isArray(body.discussionPrompts)
    ? body.discussionPrompts.map(p => String(p).trim()).filter(Boolean).slice(0, 50)
    : []

  const timeline = Array.isArray(body.timeline) ? body.timeline : []
  const nodes    = isPlainObject(body.nodes) ? body.nodes : {}
  const root     = clampString(body.root, 64) || null

  const orgContext = isPlainObject(body.orgContext) ? body.orgContext : null

  return {
    data: { title, description, category, difficulty, tags, objectives, discussionPrompts, timeline, nodes, root, orgContext },
  }
}

/** GET /scenarios - returns a list of available scenario objects with id, name, description, category, and difficulty. */
router.get('/scenarios', (req, res) => {
  const keys = scenarioRegistry.listScenarioKeys()
  const scenarios = keys.map((key) => {
    const data = scenarioRegistry.getScenarioByKey(key)
    return {
      id: key,
      name: key
        .replace(/^scenario_/, '')
        .replace(/^custom_[a-z0-9]+_?/, '')
        .replace(/_/g, ' ')
        .replace(/\b\w/g, (c) => c.toUpperCase()),
      description: data?.description || '',
      category: data?.category || '',
      difficulty: data?.difficulty || '',
      isCustom: key.startsWith('custom_'),
    }
  })
  auditLogger.event({
    action: 'scenario:list',
    actor: req.auth?.actor || 'unknown',
    context: buildAuditContext({ count: scenarios.length }, ['count']),
    outcome: 'success',
    correlationId: req.context?.correlationId,
    requestId: req.context?.requestId,
  })
  return res.json(scenarios)
})

/** GET /scenarios/:key - returns the full scenario definition including decision nodes. */
router.get('/scenarios/:key', (req, res) => {
  const scenarioKey = normalizeScenarioKey(req.params.key)
  if (!scenarioKey) {
    return res.status(400).json({ message: 'Invalid scenario key', correlationId: req.context?.correlationId })
  }
  const scenario = scenarioRegistry.getScenarioByKey(scenarioKey)
  if (!scenario) {
    auditLogger.event({
      action: 'scenario:get',
      actor: req.auth?.actor || 'unknown',
      context: buildAuditContext({ scenarioKey }, ['scenarioKey']),
      outcome: 'not_found',
      correlationId: req.context?.correlationId,
      requestId: req.context?.requestId,
    })
    return res.status(404).json({ message: 'Scenario not found', correlationId: req.context?.correlationId })
  }
  auditLogger.event({
    action: 'scenario:get',
    actor: req.auth?.actor || 'unknown',
    context: buildAuditContext({ scenarioKey }, ['scenarioKey']),
    outcome: 'success',
    correlationId: req.context?.correlationId,
    requestId: req.context?.requestId,
  })
  return res.json(scenario)
})

/** POST /scenarios - create a new custom scenario and persist it in the database. */
router.post('/scenarios', requireAuth, requireRole('admin', 'facilitator'), (req, res) => {
  const parsed = parseScenarioBody(req.body)
  if (parsed.error) {
    return res.status(400).json({ message: parsed.error, correlationId: req.context?.correlationId })
  }

  const { title, description, ...rest } = parsed.data
  const id = `custom_${nanoid(8).toLowerCase()}`
  const jsonData = { title, description, ...rest }

  try {
    sireDatabase.createScenario({ id, title, description, jsonData })
    auditLogger.event({
      action: 'scenario:create',
      actor: req.auth?.actor || 'unknown',
      context: buildAuditContext({ id }, ['id']),
      outcome: 'success',
      correlationId: req.context?.correlationId,
      requestId: req.context?.requestId,
    })
    return res.status(201).json({ id, title, description, ...rest })
  } catch (err) {
    if (err.code === 'SCENARIO_CONFLICT') {
      return res.status(409).json({ message: 'Scenario already exists', correlationId: req.context?.correlationId })
    }
    return res.status(500).json({ message: 'Failed to create scenario', correlationId: req.context?.correlationId })
  }
})

/** PUT /scenarios/:key - update an existing custom scenario in the database. */
router.put('/scenarios/:key', requireAuth, requireRole('admin', 'facilitator'), (req, res) => {
  const scenarioKey = normalizeScenarioKey(req.params.key)
  if (!scenarioKey) {
    return res.status(400).json({ message: 'Invalid scenario key', correlationId: req.context?.correlationId })
  }

  // Only database-stored (custom) scenarios may be updated through this endpoint.
  let existing
  try {
    existing = sireDatabase.getScenarioById(scenarioKey)
  } catch (_) {
    existing = null
  }
  if (!existing) {
    return res.status(404).json({ message: 'Custom scenario not found', correlationId: req.context?.correlationId })
  }

  const parsed = parseScenarioBody(req.body)
  if (parsed.error) {
    return res.status(400).json({ message: parsed.error, correlationId: req.context?.correlationId })
  }

  const { title, description, ...rest } = parsed.data
  const jsonData = { title: scenarioKey, description, ...rest }

  try {
    sireDatabase.updateScenario({ id: scenarioKey, title, description, jsonData })
    auditLogger.event({
      action: 'scenario:update',
      actor: req.auth?.actor || 'unknown',
      context: buildAuditContext({ scenarioKey }, ['scenarioKey']),
      outcome: 'success',
      correlationId: req.context?.correlationId,
      requestId: req.context?.requestId,
    })
    return res.json({ id: scenarioKey, title, description, ...rest })
  } catch (err) {
    if (err.code === 'SCENARIO_NOT_FOUND') {
      return res.status(404).json({ message: 'Scenario not found', correlationId: req.context?.correlationId })
    }
    return res.status(500).json({ message: 'Failed to update scenario', correlationId: req.context?.correlationId })
  }
})

/** DELETE /scenarios/:key - delete a custom scenario from the database. */
router.delete('/scenarios/:key', requireAuth, requireRole('admin', 'facilitator'), (req, res) => {
  const scenarioKey = normalizeScenarioKey(req.params.key)
  if (!scenarioKey) {
    return res.status(400).json({ message: 'Invalid scenario key', correlationId: req.context?.correlationId })
  }

  // Only database-stored (custom) scenarios may be deleted.
  let existing
  try {
    existing = sireDatabase.getScenarioById(scenarioKey)
  } catch (_) {
    existing = null
  }
  if (!existing) {
    return res.status(404).json({ message: 'Custom scenario not found', correlationId: req.context?.correlationId })
  }

  try {
    sireDatabase.deleteScenario(scenarioKey)
    auditLogger.event({
      action: 'scenario:delete',
      actor: req.auth?.actor || 'unknown',
      context: buildAuditContext({ scenarioKey }, ['scenarioKey']),
      outcome: 'success',
      correlationId: req.context?.correlationId,
      requestId: req.context?.requestId,
    })
    return res.status(204).send()
  } catch (err) {
    return res.status(500).json({ message: 'Failed to delete scenario', correlationId: req.context?.correlationId })
  }
})

export default router
