
/**
 * escalationService.js
 * Timed escalation engine that emits events on schedule.
 * Supports pause/resume: remaining delays are preserved so the timeline
 * can be suspended and restarted from where it left off.
 */
import { inMemorySessionStore } from '../models/inMemorySessionStore.mjs'
import { applicationLogger } from '../config/logger.mjs'

/**
 * @typedef {{ handle: ReturnType<typeof setTimeout>, evt: object, remainingMs: number, scheduledAtMs: number }} TimerEntry
 * @typedef {{ entries: TimerEntry[], completionEntry: TimerEntry | null, io: object }} TimerState
 */

/** @type {Map<string, TimerState>} */
const timersBySession = new Map()

/** Cancel all active handles in a timer state without removing it. */
function cancelHandles(state) {
  state.entries.forEach(e => { if (e.handle !== null) clearTimeout(e.handle) })
  if (state.completionEntry?.handle !== null) clearTimeout(state.completionEntry?.handle)
}

/** Schedule a single timer entry, updating its handle and scheduledAtMs. */
function scheduleEntry(entry, onFire) {
  entry.scheduledAtMs = Date.now()
  entry.handle = setTimeout(() => {
    entry.handle = null
    onFire()
  }, entry.remainingMs)
}

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
    const offsets = events.map(evt => normalizeOffset(evt.timeOffsetSec))
    const lastOffset = offsets.length > 0 ? Math.max(...offsets) : 0

    applicationLogger.info('Starting timeline', { sessionCode, events: events.length })
    inMemorySessionStore.setActive(sessionCode, true)

    /** @type {TimerEntry[]} */
    const entries = events.map((evt, idx) => {
      const delayMs = normalizeOffset(evt.timeOffsetSec) * 1000
      const entry = {
        handle: null,
        evt,
        remainingMs: delayMs,
        scheduledAtMs: 0,
      }
      scheduleEntry(entry, () => {
        const currentIndex = inMemorySessionStore.advanceTimeline(sessionCode)
        io.of('/sim').to(room).emit('timeline:tick', {
          index: currentIndex,
          title: evt.title,
          description: evt.description,
          timeOffsetSec: evt.timeOffsetSec,
        })
      })
      return entry
    })

    /** @type {TimerEntry | null} */
    let completionEntry = null
    const sessionEndBufferSec = 1
    if (events.length === 0) {
      inMemorySessionStore.setActive(sessionCode, false)
      io.of('/sim').to(room).emit('session:end', { sessionCode })
    } else if (lastOffset > 0) {
      completionEntry = {
        handle: null,
        evt: null,
        remainingMs: (lastOffset + sessionEndBufferSec) * 1000,
        scheduledAtMs: 0,
      }
      scheduleEntry(completionEntry, () => {
        inMemorySessionStore.setActive(sessionCode, false)
        io.of('/sim').to(room).emit('session:end', { sessionCode })
      })
    }

    timersBySession.set(sessionCode, { entries, completionEntry, io })
  },

  pauseTimeline: ({ sessionCode }) => {
    const state = timersBySession.get(sessionCode)
    if (!state) return false

    const now = Date.now()
    // Calculate remaining ms for each pending entry
    state.entries.forEach(entry => {
      if (entry.handle !== null) {
        entry.remainingMs = Math.max(0, entry.remainingMs - (now - entry.scheduledAtMs))
      }
    })
    if (state.completionEntry?.handle !== null) {
      state.completionEntry.remainingMs = Math.max(
        0,
        state.completionEntry.remainingMs - (now - state.completionEntry.scheduledAtMs)
      )
    }
    cancelHandles(state)
    inMemorySessionStore.pauseSession(sessionCode)
    applicationLogger.info('Timeline paused', { sessionCode })
    return true
  },

  resumeTimeline: ({ sessionCode }) => {
    const state = timersBySession.get(sessionCode)
    if (!state) return false

    const room = `session:${sessionCode}`
    const io = state.io

    // Re-schedule pending entries with their remaining delays
    state.entries.forEach(entry => {
      if (entry.remainingMs > 0) {
        const evt = entry.evt
        scheduleEntry(entry, () => {
          const currentIndex = inMemorySessionStore.advanceTimeline(sessionCode)
          io.of('/sim').to(room).emit('timeline:tick', {
            index: currentIndex,
            title: evt.title,
            description: evt.description,
            timeOffsetSec: evt.timeOffsetSec,
          })
        })
      }
    })

    if (state.completionEntry && state.completionEntry.remainingMs > 0) {
      scheduleEntry(state.completionEntry, () => {
        inMemorySessionStore.setActive(sessionCode, false)
        io.of('/sim').to(room).emit('session:end', { sessionCode })
      })
    }

    inMemorySessionStore.resumeSession(sessionCode)
    applicationLogger.info('Timeline resumed', { sessionCode })
    return true
  },

  stopTimeline: ({ sessionCode }) => {
    const state = timersBySession.get(sessionCode)
    if (state) cancelHandles(state)
    timersBySession.delete(sessionCode)
  }
}
