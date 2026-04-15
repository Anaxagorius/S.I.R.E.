
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
      trainees: [],
      currentTimelineIndex: -1,
      isActive: false,
      isPaused: false,
      pausedAtMs: null,
      /** @type {Array<import('./types.mjs').InjectRecord>} */
      injectQueue: [],
      /** @type {Array<import('./types.mjs').ActionItemRecord>} */
      actionItems: [],
      /** Event log entries for analytics (decisions, injections, etc.). */
      eventLog: [],
      /** Wall-clock ms when the session timeline was first started. */
      startedAtMs: null,
      mciState: null,
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
  addInjectToQueue: (sessionCode, { message, severity, roleFilter, channel, pressureType, requiresApproval, approvalRole, confidential }) => {
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
      /** When true, this inject is only visible to admin/facilitator sockets, not participant sockets. */
      confidential: confidential === true,
      released: false,
      releasedAt: null,
      editedAt: null,
      createdAt: new Date().toISOString(),
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
  captureActionItem: (sessionCode, { text, capturedBy, role, assignedTo, owner, dueDate }) => {
    const s = sessionMap.get(sessionCode)
    if (!s) return null
    const item = {
      id: crypto.randomUUID(),
      text,
      capturedBy: capturedBy || null,
      role: role || null,
      assignedTo: assignedTo || null,
      owner: owner || null,
      dueDate: dueDate || null,
      status: 'open',
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
  /** Mark the session as started and record the wall-clock start time. */
  markStarted: (sessionCode) => {
    const s = sessionMap.get(sessionCode)
    if (!s) return null
    if (s.startedAtMs === null) s.startedAtMs = Date.now()
    return s
  },
  /** Append an event log entry used for analytics KPI computation. */
  logEvent: (sessionCode, entry) => {
    const s = sessionMap.get(sessionCode)
    if (!s) return null
    s.eventLog.push(entry)
    return entry
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
  /** Initialize MCI state for an EMS/MCI session. */
  initMciState: (sessionCode) => {
    const s = sessionMap.get(sessionCode)
    if (!s) return null
    s.mciState = {
      bedCapacity: { total: 100, available: 40, icu: 8, ed: 20 },
      hospitalDiversion: { hospitalA: false, hospitalB: false, hospitalC: false },
      ambulances: { total: 12, available: 4, dispatched: 6, returning: 2 },
      supplies: { bloodBank: 'adequate', ventilators: 'adequate', medications: 'adequate' },
      mciActivated: false,
      alternateCareActivated: false,
      mutualAidRequested: false,
      electivesCancelled: false,
      decisionLog: [],
    }
    return s.mciState
  },
  /** Return current MCI state for a session. */
  getMciState: (sessionCode) => {
    const s = sessionMap.get(sessionCode)
    if (!s) return null
    return s.mciState
  },
  /** Merge whitelisted top-level updates into session.mciState (no deep merge). */
  updateMciState: (sessionCode, updates) => {
    const s = sessionMap.get(sessionCode)
    if (!s || !s.mciState) return null
    const ALLOWED_MCI_KEYS = new Set(['bedCapacity', 'ambulances', 'supplies', 'hospitalDiversion'])
    for (const key of ALLOWED_MCI_KEYS) {
      if (Object.prototype.hasOwnProperty.call(updates, key)) {
        s.mciState[key] = updates[key]
      }
    }
    return s.mciState
  },
  /** Append a decision to mciState.decisionLog and flip boolean flags when applicable. */
  recordMciDecision: (sessionCode, { decision, madeBy, role, rationale }) => {
    const s = sessionMap.get(sessionCode)
    if (!s || !s.mciState) return null
    const entry = {
      id: crypto.randomUUID(),
      decision,
      madeBy: madeBy || null,
      role: role || null,
      rationale: rationale || null,
      timestamp: new Date().toISOString(),
    }
    s.mciState.decisionLog.push(entry)
    if (decision === 'mci-activated') s.mciState.mciActivated = true
    if (decision === 'alternate-care-activated') s.mciState.alternateCareActivated = true
    if (decision === 'mutual-aid-requested') s.mciState.mutualAidRequested = true
    if (decision === 'electives-cancelled') s.mciState.electivesCancelled = true
    return entry
  },
}
