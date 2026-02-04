
/**
 * sessionController.js
 * REST layer delegating to sessionService.
 */
import { sessionService } from '../services/sessionService.mjs'

export const sessionController = {
  createSession: (req, res) => {
    try {
      const { scenarioKey, instructorDisplayName } = req.body || {}
      if (!scenarioKey || !instructorDisplayName) return res.status(400).json({ message: 'Invalid payload' })
      const record = sessionService.createSession({ scenarioKey, instructorDisplayName })
      if (req.io) {
        req.io.of('/sim').emit('session:create', { sessionCode: record.sessionCode, scenarioKey })
      }
      return res.status(201).json(record)
    } catch (err) {
      return res.status(500).json({ message: 'Unexpected error', error: String(err) })
    }
  },
  listSessions: (_req, res) => {
    return res.json(sessionService.listSessions())
  },
  getSession: (req, res) => {
    const record = sessionService.getSession(req.params.sessionCode)
    if (!record) return res.status(404).json({ message: 'Not found' })
    return res.json(record)
  },
  deleteSession: (req, res) => {
    const record = sessionService.removeSession(req.params.sessionCode)
    if (!record) return res.status(404).json({ message: 'Not found' })
    return res.json(record)
  },
}
