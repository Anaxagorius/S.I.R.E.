
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
  getSession: (req, res) => {
    const record = sessionService.getSession ? sessionService.getSession(req.params.sessionCode) : null
    if (!record) return res.status(404).json({ message: 'Not found' })
    return res.json(record)
  }
}
