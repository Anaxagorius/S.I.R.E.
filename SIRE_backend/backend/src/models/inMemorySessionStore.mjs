
/**
 * inMemorySessionStore.js
 * Minimal in-memory store for sessions.
 */
import { customAlphabet } from 'nanoid'
import crypto from 'crypto'

/** @type {Map<string, any>} */
const sessionMap = new Map()

/** Alphabet restricted to uppercase letters and digits only (matches normalizeSessionCode validator) */
const nanoidAlphanumeric = customAlphabet('ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', 6)

/** Generate human-friendly 6-char session code using only [A-Z0-9] characters */
const generateSessionCode = () => nanoidAlphanumeric()

export const inMemorySessionStore = {
  createSession: ({ scenarioKey, instructorDisplayName }) => {
    const sessionCode = generateSessionCode()
    const record = {
      sessionCode,
      scenarioKey,
      instructorDisplayName,
      createdAtEpochMs: Date.now(),
      startedAt: null,
      endedAt: null,
      trainees: [],
      currentTimelineIndex: -1,
      isActive: false,
      isPaused: false,
      pausedAtMs: null,
      /** @type {Array<import('./types.mjs').InjectRecord>} */
      injectQueue: [],
      /** @type {Array<import('./types.mjs').ActionItemRecord>} */
      actionItems: [],
      /** @type {Array<object>} Ordered audit trail of all significant session events. */
      eventLog: [],
    }
    sessionMap.set(sessionCode, record)
    return record
  },
  getSession: (sessionCode) => sessionMap.get(sessionCode) || null,
  listSessions: (limit) => {
    const sessions = Array.from(sessionMap.values())
    if (limit === undefined || limit === null) return sessions
    return sessions.slice(0, Number(limit))
  },
  removeSession: (sessionCode) => {
    const record = sessionMap.get(sessionCode)
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
  setStarted: (sessionCode) => {
    const s = sessionMap.get(sessionCode)
    if (!s) return null
    if (!s.startedAt) s.startedAt = new Date().toISOString()
    return s
  },
  setEnded: (sessionCode) => {
    const s = sessionMap.get(sessionCode)
    if (!s) return null
    if (!s.endedAt) s.endedAt = new Date().toISOString()
    return s
  },
  pauseSession: (sessionCode) => {
    const s = sessionMap.get(sessionCode)
    if (!s) return null
    s.isPaused = true
    s.pausedAtMs = Date.now()
    return s
  },
  resumeSession: (sessionCode) => {
    const s = sessionMap.get(sessionCode)
    if (!s) return null
    s.isPaused = false
    s.pausedAtMs = null
    return s
  },
  /** Add an inject to the facilitator queue (not yet released to participants). */
  addInjectToQueue: (sessionCode, { message, severity, roleFilter, channel, pressureType, requiresApproval, approvalRole }) => {
    const s = sessionMap.get(sessionCode)
    if (!s) return null
    const inject = {
      id: crypto.randomUUID(),
      message,
      originalMessage: null,
      severity: severity || 'info',
      roleFilter: roleFilter || null,
      channel: channel || 'in-app',
      pressureType: pressureType || null,
      requiresApproval: requiresApproval === true,
      approvalRole: approvalRole || null,
      approvedBy: null,
      approvedAt: null,
      released: false,
      releasedAt: null,
      editedAt: null,
      createdAt: new Date().toISOString(),
      /** @type {Array<{ id: string, text: string, createdAt: string }>} */
      notes: [],
      /** @type {Array<import('./types.mjs').DeliveryEntry>} */
      deliveryLog: [],
      /** @type {Array<import('./types.mjs').AcknowledgementEntry>} */
      acknowledgements: [],
    }
    s.injectQueue.push(inject)
    return inject
  },
  /** Mark a queued inject as released (visible to participants). */
  releaseInject: (sessionCode, injectId) => {
    const s = sessionMap.get(sessionCode)
    if (!s) return null
    const inject = s.injectQueue.find(i => i.id === injectId)
    if (!inject || inject.released) return null
    inject.released = true
    inject.releasedAt = new Date().toISOString()
    return inject
  },
  /** Edit the message of a queued (unreleased) inject, preserving original for audit. */
  editInject: (sessionCode, injectId, { message, severity, roleFilter }) => {
    const s = sessionMap.get(sessionCode)
    if (!s) return null
    const inject = s.injectQueue.find(i => i.id === injectId)
    if (!inject || inject.released) return null
    if (inject.originalMessage === null) {
      inject.originalMessage = inject.message
    }
    inject.message = message
    if (severity) inject.severity = severity
    if (roleFilter !== undefined) inject.roleFilter = roleFilter || null
    inject.editedAt = new Date().toISOString()
    return inject
  },
  getInjectQueue: (sessionCode) => {
    const s = sessionMap.get(sessionCode)
    if (!s) return null
    return s.injectQueue
  },
  /** Record a delivery entry on a released inject. */
  addDeliveryEntry: (sessionCode, injectId, { channel, recipient, role }) => {
    const s = sessionMap.get(sessionCode)
    if (!s) return null
    const inject = s.injectQueue.find(i => i.id === injectId)
    if (!inject) return null
    inject.deliveryLog.push({
      channel: channel || 'in-app',
      recipient,
      role: role || null,
      deliveredAt: new Date().toISOString(),
    })
    return inject
  },
  /** Mark an inject as approved by a participant with the required role. */
  approveInject: (sessionCode, injectId, { approvedBy, approverRole }) => {
    const s = sessionMap.get(sessionCode)
    if (!s) return null
    const inject = s.injectQueue.find(i => i.id === injectId)
    if (!inject || !inject.released || inject.approvedAt) return null
    if (inject.approvalRole && inject.approvalRole !== approverRole) return null
    inject.approvedBy = approvedBy
    inject.approvedAt = new Date().toISOString()
    return inject
  },
  /** Record that a participant acknowledged a released inject. */
  acknowledgeInject: (sessionCode, injectId, { displayName, role }) => {
    const s = sessionMap.get(sessionCode)
    if (!s) return null
    const inject = s.injectQueue.find(i => i.id === injectId)
    if (!inject || !inject.released) return null
    const alreadyAcked = inject.acknowledgements.some(a => a.displayName === displayName)
    if (alreadyAcked) return inject
    inject.acknowledgements.push({
      displayName,
      role: role || null,
      acknowledgedAt: new Date().toISOString(),
    })
    return inject
  },
  /** Capture an action item raised during the exercise. */
  captureActionItem: (sessionCode, { text, capturedBy, role, assignedTo }) => {
    const s = sessionMap.get(sessionCode)
    if (!s) return null
    const item = {
      id: crypto.randomUUID(),
      text,
      capturedBy: capturedBy || null,
      role: role || null,
      assignedTo: assignedTo || null,
      timestampIso: new Date().toISOString(),
    }
    s.actionItems.push(item)
    return item
  },
  getActionItems: (sessionCode) => {
    const s = sessionMap.get(sessionCode)
    if (!s) return null
    return s.actionItems
  },
  /** Update a trainee's role (facilitator-assigned override). */
  assignTraineeRole: (sessionCode, displayName, role) => {
    const s = sessionMap.get(sessionCode)
    if (!s) return null
    const trainee = s.trainees.find(t => t.displayName === displayName)
    if (!trainee) return null
    trainee.role = role
    return trainee
  },
  /** Append a timestamped event to the session's ordered audit trail. */
  appendEventLog: (sessionCode, entry) => {
    const s = sessionMap.get(sessionCode)
    if (!s) return null
    const event = { ...entry, timestampIso: entry.timestampIso || new Date().toISOString() }
    s.eventLog.push(event)
    return event
  },
  /** Return the full ordered audit trail for a session. */
  getEventLog: (sessionCode) => {
    const s = sessionMap.get(sessionCode)
    if (!s) return null
    return s.eventLog
  },
  /** Add a facilitator note to a queued inject (released or not). */
  addNoteToInject: (sessionCode, injectId, noteText) => {
    const s = sessionMap.get(sessionCode)
    if (!s) return null
    const inject = s.injectQueue.find(i => i.id === injectId)
    if (!inject) return null
    const note = {
      id: crypto.randomUUID(),
      text: noteText,
      createdAt: new Date().toISOString(),
    }
    inject.notes.push(note)
    return note
  },
}
