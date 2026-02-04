import crypto from 'crypto'

const newlinePattern = /[\r\n\t]/g
const allowedScenarioKey = /^[a-z0-9_-]+$/i
const allowedSessionCode = /^[A-Z0-9]{6}$/
const allowedSeverity = new Set(['info', 'warning', 'critical'])

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

export const generateRandomUuid = () => crypto.randomUUID()
