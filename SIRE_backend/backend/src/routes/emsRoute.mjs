import { Router } from 'express'
import { inMemorySessionStore } from '../models/inMemorySessionStore.mjs'
import { normalizeSessionCode } from '../utils/validation.mjs'

const router = Router()

router.post('/ems/sessions/:sessionCode/mci/init', (req, res) => {
  const sessionCode = normalizeSessionCode(req.params.sessionCode)
  if (!sessionCode) return res.status(400).json({ error: 'INVALID_SESSION_CODE' })

  const session = inMemorySessionStore.getSession(sessionCode)
  if (!session) return res.status(404).json({ error: 'SESSION_NOT_FOUND' })

  const mciState = inMemorySessionStore.initMciState(sessionCode)
  return res.json(mciState)
})

router.get('/ems/sessions/:sessionCode/mci', (req, res) => {
  const sessionCode = normalizeSessionCode(req.params.sessionCode)
  if (!sessionCode) return res.status(400).json({ error: 'INVALID_SESSION_CODE' })

  const session = inMemorySessionStore.getSession(sessionCode)
  if (!session) return res.status(404).json({ error: 'SESSION_NOT_FOUND' })

  return res.json(session.mciState)
})

router.put('/ems/sessions/:sessionCode/mci', (req, res) => {
  const sessionCode = normalizeSessionCode(req.params.sessionCode)
  if (!sessionCode) return res.status(400).json({ error: 'INVALID_SESSION_CODE' })

  const session = inMemorySessionStore.getSession(sessionCode)
  if (!session) return res.status(404).json({ error: 'SESSION_NOT_FOUND' })

  if (!session.mciState) return res.status(409).json({ error: 'MCI_NOT_INITIALIZED' })

  const updates = req.body
  if (!updates || typeof updates !== 'object' || Array.isArray(updates)) {
    return res.status(400).json({ error: 'INVALID_PAYLOAD' })
  }

  const mciState = inMemorySessionStore.updateMciState(sessionCode, updates)
  return res.json(mciState)
})

router.get('/ems/sessions/:sessionCode/hseep-report', (req, res) => {
  const sessionCode = normalizeSessionCode(req.params.sessionCode)
  if (!sessionCode) return res.status(400).json({ error: 'INVALID_SESSION_CODE' })

  const session = inMemorySessionStore.getSession(sessionCode)
  if (!session) return res.status(404).json({ error: 'SESSION_NOT_FOUND' })

  const eventLog = session.eventLog || []
  const strengths = eventLog
    .filter(e => e.isCorrect === true)
    .map(e => ({ description: e.action, participant: e.displayName, role: e.role || null, timestamp: e.timestampIso }))
  const areasForImprovement = eventLog
    .filter(e => e.isCorrect === false)
    .map(e => ({ description: e.action, participant: e.displayName, role: e.role || null, timestamp: e.timestampIso }))

  const uniqueRoles = [...new Set(session.trainees.map(t => t.role).filter(Boolean))]

  const report = {
    sessionCode,
    scenarioKey: session.scenarioKey,
    generatedAt: new Date().toISOString(),
    exerciseObjectives: [
      'Demonstrate MCI command activation',
      'Apply START triage protocol',
      'Coordinate hospital diversion',
      'Request and integrate mutual aid',
      'Manage supply shortages under surge conditions',
    ],
    coreCapabilities: [
      'Mass Casualty Management',
      'Emergency Operations Coordination',
      'Public Information and Warning',
      'Logistics and Supply Chain Management',
    ],
    strengths,
    areasForImprovement,
    correctiveActions: session.actionItems || [],
    mciState: session.mciState,
    decisionLog: session.mciState?.decisionLog ?? [],
    participantCount: session.trainees.length,
    roles: uniqueRoles,
  }

  return res.json(report)
})

export default router
