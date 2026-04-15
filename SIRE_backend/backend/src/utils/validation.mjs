import crypto from 'crypto'

const newlinePattern = /[\r\n\t]/g
const allowedScenarioKey = /^[a-z0-9_-]+$/i
const allowedSessionCode = /^[A-Z0-9]{6}$/
const allowedSeverity = new Set(['info', 'warning', 'critical'])
const allowedChannels = new Set(['in-app', 'email'])
const allowedPressureTypes = new Set(['media', 'regulator', 'customer'])

export const isPlainObject = (value) => {
  if (!value || typeof value !== 'object') return false
  if (Array.isArray(value)) return false
  return Object.getPrototypeOf(value) === Object.prototype
}

export const normalizeText = (value, maxLength = 120) => {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  if (!trimmed) return null
  const sanitized = trimmed.replace(newlinePattern, ' ')
  if (sanitized.length > maxLength) return sanitized.slice(0, maxLength)
  return sanitized
}

export const normalizeOptionalText = (value, maxLength = 120) => {
  if (value === null || value === undefined || value === '') return null
  return normalizeText(value, maxLength)
}

export const normalizeSessionCode = (value) => {
  const candidate = normalizeText(value, 12)
  if (!candidate) return null
  const upper = candidate.toUpperCase()
  if (!allowedSessionCode.test(upper)) return null
  return upper
}

export const normalizeScenarioKey = (value) => {
  const candidate = normalizeText(value, 64)
  if (!candidate || !allowedScenarioKey.test(candidate)) return null
  return candidate
}

export const normalizeDisplayName = (value) => normalizeText(value, 64)

export const normalizeActionText = (value) => normalizeText(value, 200)

export const normalizeRationaleText = (value) => normalizeOptionalText(value, 200)

export const normalizeMessageText = (value) => normalizeText(value, 200)

export const normalizeSeverity = (value) => {
  const candidate = normalizeText(value, 16)
  if (!candidate) return null
  const lowered = candidate.toLowerCase()
  if (!allowedSeverity.has(lowered)) return null
  return lowered
}

/**
 * Parse and validate a pagination limit value.
 * Returns { value, valid } where valid is true for in-range numbers; invalid inputs return value=null.
 */
export const parseLimit = (value, { fallback = 100, min = 1, max = 200 } = {}) => {
  if (value === undefined || value === null || value === '') {
    return { value: fallback, valid: true }
  }
  const numeric = Number(value)
  if (!Number.isFinite(numeric)) return { value: null, valid: false }
  const rounded = Math.trunc(numeric)
  if (rounded < min) return { value: null, valid: false }
  if (rounded > max) return { value: null, valid: false }
  return { value: rounded, valid: true }
}

const ALLOWED_ROLES = new Set([
  'security',
  'safety',
  'medical',
  'communications',
  'facilities',
  'evacuation',
  'it-secops',
  'legal',
  'exec',
  'comms',
  'ed-charge',
  'incident-commander',
  'pio',
  'logistics',
  'triage-officer',
  'treatment-officer',
  'transport-officer',
])

export const normalizeRole = (value) => {
  const candidate = normalizeText(value, 32)
  if (!candidate) return null
  const lowered = candidate.toLowerCase()
  if (!ALLOWED_ROLES.has(lowered)) return null
  return lowered
}

/** Validate a UUID v4 inject ID.  Returns null if invalid. */
export const normalizeInjectId = (value) => {
  const candidate = normalizeText(value, 40)
  if (!candidate) return null
  // UUID format: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(candidate)) return null
  return candidate.toLowerCase()
}

/** Normalize inject delivery channel. Defaults to 'in-app' for unknown values. */
export const normalizeChannel = (value) => {
  if (value === null || value === undefined || value === '') return 'in-app'
  const candidate = normalizeText(value, 16)
  if (!candidate) return 'in-app'
  const lowered = candidate.toLowerCase()
  return allowedChannels.has(lowered) ? lowered : 'in-app'
}

/** Normalize pressure-type tag for stakeholder narrative injects. Returns null for absent/unknown. */
export const normalizePressureType = (value) => {
  if (value === null || value === undefined || value === '') return null
  const candidate = normalizeText(value, 16)
  if (!candidate) return null
  const lowered = candidate.toLowerCase()
  return allowedPressureTypes.has(lowered) ? lowered : null
}

/** Normalize free-form text up to 500 chars (for action items). */
export const normalizeActionItemText = (value) => normalizeText(value, 500)

const allowedTaskStatuses = new Set(['open', 'in-progress', 'closed'])

/** Normalize action task status. Returns null for absent/unknown values. */
export const normalizeTaskStatus = (value) => {
  if (value === null || value === undefined || value === '') return null
  const candidate = normalizeText(value, 16)
  if (!candidate) return null
  const lowered = candidate.toLowerCase()
  return allowedTaskStatuses.has(lowered) ? lowered : null
}

/** Normalize a task owner name (free text, up to 120 chars). */
export const normalizeOwner = (value) => normalizeOptionalText(value, 120)

/** Normalize an ISO date string (YYYY-MM-DD). Returns null if format is invalid. */
export const normalizeDueDate = (value) => {
  if (value === null || value === undefined || value === '') return null
  const candidate = normalizeText(value, 12)
  if (!candidate) return null
  if (!/^\d{4}-\d{2}-\d{2}$/.test(candidate)) return null
  return candidate
}

/** Normalize a standards reference string (e.g. "NIST CSF: RC.RP-1; ISO 27001: A.16.1.5"). Up to 500 chars. */
export const normalizeStandardsRef = (value) => normalizeOptionalText(value, 500)

/** Validate a task UUID ID.  Returns null if invalid. */
export const normalizeTaskId = (value) => {
  const candidate = normalizeText(value, 40)
  if (!candidate) return null
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(candidate)) return null
  return candidate.toLowerCase()
}

export const generateRandomUuid = () => crypto.randomUUID()
