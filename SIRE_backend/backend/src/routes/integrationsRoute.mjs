/**
 * integrationsRoute.mjs
 * Author: Copilot
 * Last Update: 2026-04-14
 *
 * ITSM / incident management and threat intel integration endpoints.
 *
 * ITSM endpoints:
 *   GET  /api/integrations/itsm              — list ITSM integrations
 *   POST /api/integrations/itsm              — create / update ITSM integration
 *   POST /api/integrations/itsm/:id/test     — send a test payload to the webhook
 *   POST /api/integrations/itsm/:id/push     — push an evidence pack to the webhook
 *   DELETE /api/integrations/:id             — delete any integration by id
 *
 * Threat Intel endpoints:
 *   GET    /api/integrations/threat-intel           — list threat intel feeds
 *   POST   /api/integrations/threat-intel           — add a threat intel feed
 *   GET    /api/integrations/threat-intel/:id/fetch — proxy-fetch items from a feed
 */

import { Router } from 'express'
import crypto from 'crypto'
import { sireDatabase } from '../models/sireDatabase.mjs'
import { applicationLogger } from '../config/logger.mjs'

const router = Router()

/* ------------------------------------------------------------------ */
/*  Helpers                                                             */
/* ------------------------------------------------------------------ */

/** Parse a stored integration row, decoding the JSON config blob. */
function parseIntegration(row) {
  if (!row) return null
  let config = {}
  try { config = JSON.parse(row.config) } catch { /* ignore */ }
  return { ...row, config, isEnabled: row.is_enabled === 1 }
}

/**
 * Guard against SSRF: only allow public HTTPS URLs.
 * Blocks localhost, loopback, link-local, and private RFC-1918 ranges.
 * @param {string} urlString
 * @returns {boolean}
 */
function isSafeWebhookUrl(urlString) {
  let parsed
  try { parsed = new URL(urlString) } catch { return false }
  if (parsed.protocol !== 'https:') return false
  const host = parsed.hostname.toLowerCase()
  if (host === 'localhost') return false
  // IPv4 literal check for private/reserved ranges
  const ipv4 = host.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/)
  if (ipv4) {
    const [, a, b] = ipv4.map(Number)
    if (a === 10) return false                          // 10.0.0.0/8
    if (a === 127) return false                         // 127.0.0.0/8 loopback
    if (a === 169 && b === 254) return false            // 169.254.0.0/16 link-local
    if (a === 172 && b >= 16 && b <= 31) return false  // 172.16.0.0/12
    if (a === 192 && b === 168) return false            // 192.168.0.0/16
  }
  return true
}

/** Build a structured evidence pack from a session snapshot payload. */
function buildEvidencePack(payload) {
  const {
    sessionCode,
    scenarioName,
    exportedAt,
    participants = [],
    actionItems = [],
    injectLog = [],
    eventLog = [],
    kpis = {},
  } = payload

  const traineeDecisions = eventLog.filter(
    e => e.actorRole === 'trainee' && typeof e.isCorrect === 'boolean',
  )
  const correctCount = traineeDecisions.filter(e => e.isCorrect).length
  const overallAccuracy = traineeDecisions.length > 0
    ? Math.round((correctCount / traineeDecisions.length) * 100)
    : null
  const activeTrainees = new Set(traineeDecisions.map(e => e.displayName)).size
  const participationRate = participants.length > 0
    ? Math.round((activeTrainees / participants.length) * 100)
    : null

  return {
    source: 'S.I.R.E. — Scenario Incident Response Exerciser',
    exportedAt: exportedAt || new Date().toISOString(),
    session: {
      code: sessionCode,
      scenario: scenarioName,
    },
    summary: {
      totalParticipants: participants.length,
      participationRate: participationRate != null ? `${participationRate}%` : null,
      overallAccuracy: overallAccuracy != null ? `${overallAccuracy}%` : null,
      totalDecisions: traineeDecisions.length,
      ...(kpis.avgTimeToDecisionMs != null && { avgTimeToDecisionMs: kpis.avgTimeToDecisionMs }),
    },
    participants: participants.map(p => ({
      name: p.displayName,
      role: p.role,
      score: p.score ?? 0,
      decisions: p.decisions ?? 0,
    })),
    actionItems: actionItems.map(item => ({
      timestamp: item.timestampIso,
      capturedBy: item.capturedBy,
      role: item.role,
      text: item.text,
      assignedTo: item.assignedTo || null,
    })),
    injectLog: injectLog.map(inj => ({
      severity: inj.severity,
      message: inj.message,
      channel: inj.channel,
      releasedAt: inj.releasedAt,
      acknowledgements: inj.acknowledgements?.length ?? 0,
    })),
    eventLog: eventLog.map(e => ({
      time: e.time,
      trainee: e.displayName || null,
      role: e.actorRole,
      action: e.description,
      correct: e.isCorrect ?? null,
    })),
  }
}

/* ------------------------------------------------------------------ */
/*  ITSM routes                                                         */
/* ------------------------------------------------------------------ */

/** GET /api/integrations/itsm — list all ITSM integrations. */
router.get('/integrations/itsm', (req, res) => {
  try {
    const rows = sireDatabase.listIntegrationsByType('itsm')
    return res.json(rows.map(parseIntegration))
  } catch (err) {
    applicationLogger.error('Failed to list ITSM integrations', { err })
    return res.status(500).json({ message: 'Unable to retrieve ITSM integrations' })
  }
})

/**
 * POST /api/integrations/itsm — create or update an ITSM integration.
 * Body: { id?, name, webhookUrl, platformType?, authToken?, isEnabled? }
 */
router.post('/integrations/itsm', (req, res) => {
  const { id, name, webhookUrl, platformType, authToken, isEnabled } = req.body || {}

  if (!name || typeof name !== 'string' || !name.trim()) {
    return res.status(400).json({ message: 'name is required' })
  }
  if (!webhookUrl || typeof webhookUrl !== 'string') {
    return res.status(400).json({ message: 'webhookUrl is required' })
  }
  if (!isSafeWebhookUrl(webhookUrl)) {
    return res.status(400).json({ message: 'webhookUrl must be a valid public HTTPS URL' })
  }

  const config = {
    webhookUrl: webhookUrl.trim(),
    platformType: platformType || 'generic',
    authToken: authToken ? String(authToken).trim() : null,
  }

  try {
    if (id) {
      // Update existing
      sireDatabase.updateIntegration({
        id,
        name: name.trim(),
        config,
        isEnabled: isEnabled !== false,
      })
      const updated = parseIntegration(sireDatabase.getIntegrationById(id))
      return res.json(updated)
    } else {
      // Create new
      const newId = crypto.randomUUID()
      sireDatabase.createIntegration({
        id: newId,
        type: 'itsm',
        name: name.trim(),
        config,
        isEnabled: isEnabled !== false,
      })
      const created = parseIntegration(sireDatabase.getIntegrationById(newId))
      return res.status(201).json(created)
    }
  } catch (err) {
    if (err.code === 'INTEGRATION_NOT_FOUND') {
      return res.status(404).json({ message: err.message })
    }
    applicationLogger.error('Failed to save ITSM integration', { err })
    return res.status(500).json({ message: 'Unable to save ITSM integration' })
  }
})

/**
 * POST /api/integrations/itsm/:id/test — send a test payload to the configured webhook.
 */
router.post('/integrations/itsm/:id/test', async (req, res) => {
  const integration = parseIntegration(sireDatabase.getIntegrationById(req.params.id))
  if (!integration || integration.type !== 'itsm') {
    return res.status(404).json({ message: 'ITSM integration not found' })
  }
  const { webhookUrl, authToken } = integration.config
  if (!isSafeWebhookUrl(webhookUrl)) {
    return res.status(400).json({ message: 'Configured webhookUrl is not a valid public HTTPS URL' })
  }

  const testPayload = {
    source: 'S.I.R.E. — Scenario Incident Response Exerciser',
    event: 'integration.test',
    message: 'This is a test connection from S.I.R.E. Your ITSM integration is configured correctly.',
    timestamp: new Date().toISOString(),
  }

  const headers = { 'Content-Type': 'application/json' }
  if (authToken) headers['Authorization'] = `Bearer ${authToken}`

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(testPayload),
      signal: AbortSignal.timeout(10_000),
    })
    return res.json({
      success: response.ok,
      statusCode: response.status,
      statusText: response.statusText,
    })
  } catch (err) {
    applicationLogger.warn('ITSM webhook test failed', { err: err.message })
    return res.status(502).json({ message: `Webhook request failed: ${err.message}` })
  }
})

/**
 * POST /api/integrations/itsm/:id/push — push an evidence pack to the ITSM webhook.
 * Body: session snapshot (sessionCode, scenarioName, participants, actionItems, injectLog, eventLog, kpis)
 */
router.post('/integrations/itsm/:id/push', async (req, res) => {
  const integration = parseIntegration(sireDatabase.getIntegrationById(req.params.id))
  if (!integration || integration.type !== 'itsm') {
    return res.status(404).json({ message: 'ITSM integration not found' })
  }
  if (!integration.isEnabled) {
    return res.status(409).json({ message: 'ITSM integration is disabled' })
  }
  const { webhookUrl, authToken } = integration.config
  if (!isSafeWebhookUrl(webhookUrl)) {
    return res.status(400).json({ message: 'Configured webhookUrl is not a valid public HTTPS URL' })
  }

  const evidencePack = buildEvidencePack(req.body || {})

  const headers = { 'Content-Type': 'application/json' }
  if (authToken) headers['Authorization'] = `Bearer ${authToken}`

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(evidencePack),
      signal: AbortSignal.timeout(15_000),
    })
    return res.json({
      success: response.ok,
      statusCode: response.status,
      statusText: response.statusText,
      evidencePack,
    })
  } catch (err) {
    applicationLogger.warn('ITSM evidence pack push failed', { err: err.message })
    return res.status(502).json({ message: `Webhook request failed: ${err.message}` })
  }
})

/* ------------------------------------------------------------------ */
/*  Threat Intel routes                                                 */
/* ------------------------------------------------------------------ */

/** GET /api/integrations/threat-intel — list all configured threat intel feeds. */
router.get('/integrations/threat-intel', (req, res) => {
  try {
    const rows = sireDatabase.listIntegrationsByType('threat-intel')
    return res.json(rows.map(parseIntegration))
  } catch (err) {
    applicationLogger.error('Failed to list threat intel feeds', { err })
    return res.status(500).json({ message: 'Unable to retrieve threat intel feeds' })
  }
})

/**
 * POST /api/integrations/threat-intel — add a threat intel feed.
 * Body: { name, feedUrl, feedType?, isEnabled? }
 */
router.post('/integrations/threat-intel', (req, res) => {
  const { name, feedUrl, feedType, isEnabled } = req.body || {}

  if (!name || typeof name !== 'string' || !name.trim()) {
    return res.status(400).json({ message: 'name is required' })
  }
  if (!feedUrl || typeof feedUrl !== 'string') {
    return res.status(400).json({ message: 'feedUrl is required' })
  }
  if (!isSafeWebhookUrl(feedUrl)) {
    return res.status(400).json({ message: 'feedUrl must be a valid public HTTPS URL' })
  }

  const config = {
    feedUrl: feedUrl.trim(),
    feedType: feedType || 'json',
  }

  try {
    const newId = crypto.randomUUID()
    sireDatabase.createIntegration({
      id: newId,
      type: 'threat-intel',
      name: name.trim(),
      config,
      isEnabled: isEnabled !== false,
    })
    const created = parseIntegration(sireDatabase.getIntegrationById(newId))
    return res.status(201).json(created)
  } catch (err) {
    applicationLogger.error('Failed to save threat intel feed', { err })
    return res.status(500).json({ message: 'Unable to save threat intel feed' })
  }
})

/**
 * GET /api/integrations/threat-intel/:id/fetch — proxy-fetch items from a configured feed.
 * Returns the raw JSON body (or an error if the feed is unreachable).
 */
router.get('/integrations/threat-intel/:id/fetch', async (req, res) => {
  const integration = parseIntegration(sireDatabase.getIntegrationById(req.params.id))
  if (!integration || integration.type !== 'threat-intel') {
    return res.status(404).json({ message: 'Threat intel feed not found' })
  }
  const { feedUrl } = integration.config
  if (!isSafeWebhookUrl(feedUrl)) {
    return res.status(400).json({ message: 'Configured feedUrl is not a valid public HTTPS URL' })
  }

  try {
    const response = await fetch(feedUrl, {
      headers: { Accept: 'application/json, text/plain, */*' },
      signal: AbortSignal.timeout(10_000),
    })
    const contentType = response.headers.get('content-type') || ''
    const text = await response.text()

    // Attempt JSON parse; fall back to returning raw text under a 'raw' key
    let data
    try {
      data = JSON.parse(text)
    } catch {
      data = { raw: text.slice(0, 5000) }
    }

    return res.json({
      ok: response.ok,
      statusCode: response.status,
      contentType,
      data,
    })
  } catch (err) {
    applicationLogger.warn('Threat intel feed fetch failed', { err: err.message })
    return res.status(502).json({ message: `Feed fetch failed: ${err.message}` })
  }
})

/* ------------------------------------------------------------------ */
/*  Shared — delete any integration by id                              */
/* ------------------------------------------------------------------ */

/** DELETE /api/integrations/:id — remove an integration. */
router.delete('/integrations/:id', (req, res) => {
  const { id } = req.params
  const existing = sireDatabase.getIntegrationById(id)
  if (!existing) {
    return res.status(404).json({ message: 'Integration not found' })
  }
  try {
    sireDatabase.deleteIntegration(id)
    return res.json({ deleted: true, id })
  } catch (err) {
    applicationLogger.error('Failed to delete integration', { err })
    return res.status(500).json({ message: 'Unable to delete integration' })
  }
})

export default router
