
/**
 * sessionService.js
 * Session orchestration business logic.
 */
import { inMemorySessionStore } from '../models/inMemorySessionStore.mjs'
import { environmentConfig } from '../config/environmentConfig.mjs'

export const sessionService = {
  getSession: (sessionCode) => inMemorySessionStore.getSession(sessionCode),
  createSession: ({ scenarioKey, instructorDisplayName }) => {
    return inMemorySessionStore.createSession({ scenarioKey, instructorDisplayName })
  },
  joinSession: ({ sessionCode, socketId, displayName }) => {
    const s = inMemorySessionStore.getSession(sessionCode)
    if (!s) throw new Error('SESSION_NOT_FOUND')
    if (s.trainees.length >= environmentConfig.sessionMaxTrainees) {
      throw new Error('SESSION_AT_CAPACITY')
    }
    inMemorySessionStore.addTrainee(sessionCode, { socketId, displayName })
    return inMemorySessionStore.getSession(sessionCode)
  },
}

