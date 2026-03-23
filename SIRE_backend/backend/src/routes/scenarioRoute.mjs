/**
 * scenarioRoute.mjs
 * Exposes available scenario keys from the scenario registry.
 */
import { Router } from 'express'
import { scenarioRegistry } from '../services/scenarioRegistry.mjs'
import { auditLogger } from '../config/auditLogger.mjs'
import { buildAuditContext } from '../utils/auditContext.mjs'

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

export default router
