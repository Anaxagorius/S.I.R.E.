
/**
 * escalationService.js
 * Timed escalation engine that emits events on schedule.
 */
import { inMemorySessionStore } from '../models/inMemorySessionStore.mjs'
import { applicationLogger } from '../config/logger.mjs'

const timersBySession = new Map()

export const escalationService = {
  startTimeline: ({ io, sessionCode, scenarioDefinition }) => {
    // Clear any existing timers for the session
    escalationService.stopTimeline({ sessionCode })

    const room = `session:${sessionCode}`
    const events = scenarioDefinition.timeline || []

    applicationLogger.info('Starting timeline', { sessionCode, events: events.length })

    const timeouts = []
    events.forEach((evt, idx) => {
      const handle = setTimeout(() => {
        const currentIndex = inMemorySessionStore.advanceTimeline(sessionCode)
        io.of('/sim').to(room).emit('timeline:tick', {
          index: currentIndex,
          title: evt.title,
          description: evt.description,
          timeOffsetSec: evt.timeOffsetSec,
        })
      }, evt.timeOffsetSec * 1000)
      timeouts.push(handle)
    })

    timersBySession.set(sessionCode, timeouts)
  },
  stopTimeline: ({ sessionCode }) => {
    const arr = timersBySession.get(sessionCode)
    if (arr && Array.isArray(arr)) {
      arr.forEach(clearTimeout)
    }
    timersBySession.delete(sessionCode)
  }
}

