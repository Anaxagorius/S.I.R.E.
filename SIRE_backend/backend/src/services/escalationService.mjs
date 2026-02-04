
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
    const normalizeOffset = (value) => {
      const numeric = Number(value)
      if (!Number.isFinite(numeric)) return 0
      return Math.max(0, numeric)
    }
    const lastOffset = Math.max(1, ...events.map(evt => normalizeOffset(evt.timeOffsetSec)))

    applicationLogger.info('Starting timeline', { sessionCode, events: events.length })
    inMemorySessionStore.setActive(sessionCode, true)

    const timeouts = []
    events.forEach((evt, idx) => {
      const delaySeconds = normalizeOffset(evt.timeOffsetSec)
      const handle = setTimeout(() => {
        const currentIndex = inMemorySessionStore.advanceTimeline(sessionCode)
        io.of('/sim').to(room).emit('timeline:tick', {
          index: currentIndex,
          title: evt.title,
          description: evt.description,
          timeOffsetSec: evt.timeOffsetSec,
        })
      }, delaySeconds * 1000)
      timeouts.push(handle)
    })

    const completeHandle = setTimeout(() => {
      inMemorySessionStore.setActive(sessionCode, false)
      io.of('/sim').to(room).emit('session:end', { sessionCode })
    }, (lastOffset + 1) * 1000)
    timeouts.push(completeHandle)

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
