
/**
 * inMemorySessionStore.js
 * Minimal in-memory store for sessions.
 */
import { nanoid } from 'nanoid'

/** @type {Map<string, any>} */
const sessionMap = new Map()

/** Generate human-friendly 6-char session code */
const generateSessionCode = () => nanoid(6).toUpperCase()

export const inMemorySessionStore = {
  createSession: ({ scenarioKey, instructorDisplayName }) => {
    const sessionCode = generateSessionCode()
    const record = {
      sessionCode,
      scenarioKey,
      instructorDisplayName,
      createdAtEpochMs: Date.now(),
      trainees: [],
      currentTimelineIndex: -1,
      isActive: false,
    }
    sessionMap.set(sessionCode, record)
    return record
  },
  getSession: (sessionCode) => sessionMap.get(sessionCode) || null,
  listSessions: () => Array.from(sessionMap.values()),
  removeSession: (sessionCode) => {
    const record = sessionMap.get(sessionCode) || null
    sessionMap.delete(sessionCode)
    return record
  },
  addTrainee: (sessionCode, trainee) => {
    const s = sessionMap.get(sessionCode)
    if (!s) return null
    s.trainees.push(trainee)
    return s
  },
  advanceTimeline: (sessionCode) => {
    const s = sessionMap.get(sessionCode)
    if (!s) return null
    s.currentTimelineIndex += 1
    return s.currentTimelineIndex
  },
  setActive: (sessionCode, isActive) => {
    const s = sessionMap.get(sessionCode)
    if (!s) return null
    s.isActive = isActive
    return s
  },
}
