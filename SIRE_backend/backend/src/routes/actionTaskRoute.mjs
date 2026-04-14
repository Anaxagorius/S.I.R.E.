/**
 * actionTaskRoute.mjs
 * REST endpoints for the persistent action-task tracker.
 *
 * GET  /api/action-tasks                  — list all tasks (optionally filter by sessionCode query param)
 * POST /api/action-tasks                  — create one or more tasks
 * PUT  /api/action-tasks/:id              — update a task (owner, dueDate, status, standardsRef)
 */
import { Router } from 'express'
import { sireDatabase } from '../models/sireDatabase.mjs'
import {
  generateRandomUuid,
  normalizeSessionCode,
  normalizeScenarioKey,
  normalizeActionItemText,
  normalizeOwner,
  normalizeDueDate,
  normalizeTaskStatus,
  normalizeStandardsRef,
  normalizeTaskId,
  normalizeText,
} from '../utils/validation.mjs'

const router = Router()

const ALLOWED_SOURCES = new Set(['aar_finding', 'aar_action', 'live'])

function normalizeSource(value) {
  const candidate = normalizeText(value, 16)
  if (!candidate) return 'aar_finding'
  return ALLOWED_SOURCES.has(candidate) ? candidate : 'aar_finding'
}

/**
 * GET /api/action-tasks
 * Query params:
 *   sessionCode — filter by session (optional)
 */
router.get('/action-tasks', (req, res) => {
  try {
    const sessionCode = normalizeSessionCode(req.query.sessionCode)
    const tasks = sessionCode
      ? sireDatabase.listActionTasksBySession(sessionCode)
      : sireDatabase.listActionTasks()
    return res.json(tasks)
  } catch {
    return res.status(500).json({ message: 'Unable to retrieve action tasks' })
  }
})

/**
 * POST /api/action-tasks
 * Body: single task object OR array of task objects.
 * Each task:
 *   { text, sessionCode?, scenarioKey?, source?, owner?, dueDate?, status?, standardsRef? }
 */
router.post('/action-tasks', (req, res) => {
  try {
    const body = req.body
    const items = Array.isArray(body) ? body : [body]

    if (items.length === 0 || items.length > 50) {
      return res.status(400).json({ message: 'Provide between 1 and 50 tasks' })
    }

    const created = []
    for (const item of items) {
      const text = normalizeActionItemText(item?.text)
      if (!text) {
        return res.status(400).json({ message: 'Each task must have a non-empty text field' })
      }

      const id = generateRandomUuid()
      const sessionCode = normalizeSessionCode(item?.sessionCode) || ''
      const scenarioKey = normalizeScenarioKey(item?.scenarioKey) || ''
      const source = normalizeSource(item?.source)
      const owner = normalizeOwner(item?.owner) || null
      const dueDate = normalizeDueDate(item?.dueDate) || null
      const status = normalizeTaskStatus(item?.status) || 'open'
      const standardsRef = normalizeStandardsRef(item?.standardsRef) || null

      sireDatabase.createActionTask({ id, sessionCode, scenarioKey, text, source, owner, dueDate, status, standardsRef })
      created.push(sireDatabase.getActionTaskById(id))
    }

    return res.status(201).json(created.length === 1 ? created[0] : created)
  } catch {
    return res.status(500).json({ message: 'Unable to create action task' })
  }
})

/**
 * PUT /api/action-tasks/:id
 * Body: { owner?, dueDate?, status?, standardsRef? }
 */
router.put('/action-tasks/:id', (req, res) => {
  try {
    const id = normalizeTaskId(req.params.id)
    if (!id) return res.status(400).json({ message: 'Invalid task id' })

    const existing = sireDatabase.getActionTaskById(id)
    if (!existing) return res.status(404).json({ message: 'Task not found' })

    const body = req.body || {}
    const owner = 'owner' in body ? (normalizeOwner(body.owner) ?? null) : existing.owner
    const dueDate = 'dueDate' in body ? (normalizeDueDate(body.dueDate) ?? null) : existing.due_date
    const status = 'status' in body ? (normalizeTaskStatus(body.status) ?? existing.status) : existing.status
    const standardsRef = 'standardsRef' in body ? (normalizeStandardsRef(body.standardsRef) ?? null) : existing.standards_ref

    sireDatabase.updateActionTask({ id, owner, dueDate, status, standardsRef })
    const updated = sireDatabase.getActionTaskById(id)
    return res.json(updated)
  } catch (err) {
    if (err.code === 'TASK_NOT_FOUND') return res.status(404).json({ message: err.message })
    return res.status(500).json({ message: 'Unable to update action task' })
  }
})

export default router
