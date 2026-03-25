/**
 * scenarioRoute.mjs
 * Exposes available scenario keys from the scenario registry.
 */
import { Router } from 'express'
import { scenarioRegistry } from '../services/scenarioRegistry.mjs'
import { auditLogger } from '../config/auditLogger.mjs'
import { buildAuditContext } from '../utils/auditContext.mjs'
import { normalizeScenarioKey } from '../utils/validation.mjs'

const router = Router()

/** GET /scenarios - returns a list of available scenario objects with id and name. */
router.get('/scenarios', (req, res) => {
  const keys = scenarioRegistry.listScenarioKeys()
  const scenarios = keys.map((key) => ({
    id: key,
    name: key
      .replace(/^scenario_/, '')
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase()),
  }))
  auditLogger.event({
    action: 'scenario:list',
    actor: req.auth?.actor || 'unknown',
    context: buildAuditContext({ count: scenarios.length }, ['count']),
    outcome: 'success',
    correlationId: req.context?.correlationId,
    requestId: req.context?.requestId,
  })
  return res.json(scenarios)
})

/** GET /scenarios/:key - returns the full scenario definition including decision nodes. */
router.get('/scenarios/:key', (req, res) => {
  const scenarioKey = normalizeScenarioKey(req.params.key)
  if (!scenarioKey) {
    return res.status(400).json({ message: 'Invalid scenario key', correlationId: req.context?.correlationId })
  }
  const scenario = scenarioRegistry.getScenarioByKey(scenarioKey)
  if (!scenario) {
    auditLogger.event({
      action: 'scenario:get',
      actor: req.auth?.actor || 'unknown',
      context: buildAuditContext({ scenarioKey }, ['scenarioKey']),
      outcome: 'not_found',
      correlationId: req.context?.correlationId,
      requestId: req.context?.requestId,
    })
    return res.status(404).json({ message: 'Scenario not found', correlationId: req.context?.correlationId })
  }
  auditLogger.event({
    action: 'scenario:get',
    actor: req.auth?.actor || 'unknown',
    context: buildAuditContext({ scenarioKey }, ['scenarioKey']),
    outcome: 'success',
    correlationId: req.context?.correlationId,
    requestId: req.context?.requestId,
  })
  return res.json(scenario)
})

export default router
