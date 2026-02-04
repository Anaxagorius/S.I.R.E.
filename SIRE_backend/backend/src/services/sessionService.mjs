
/**
 * sessionService.js
 * Session orchestration business logic.
 */
import { inMemorySessionStore } from '../models/inMemorySessionStore.mjs'
import { environmentConfig } from '../config/environmentConfig.mjs'
import { scenarioRegistry } from './scenarioRegistry.mjs'

export const sessionService = {
  getSession: (sessionCode) => inMemorySessionStore.getSession(sessionCode),
  listSessions: () => inMemorySessionStore.listSessions(),
  createSession: ({ scenarioKey, instructorDisplayName }) => {
    const scenario = scenarioRegistry.getScenarioByKey(scenarioKey)
    if (!scenario) throw new Error('SCENARIO_NOT_FOUND')
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
  removeSession: (sessionCode) => inMemorySessionStore.removeSession(sessionCode),
}
