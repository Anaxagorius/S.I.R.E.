import { auditLogger } from '../config/auditLogger.mjs'
import { buildAuditContext } from '../utils/auditContext.mjs'

export const errorHandler = (err, req, res, _next) => {
  const correlationId = req.context?.correlationId
  const requestId = req.context?.requestId
  auditLogger.event({
    action: 'request:error',
    actor: req.auth?.actor || 'unknown',
    context: buildAuditContext({ path: req.path, method: req.method }, ['path', 'method']),
    outcome: 'error',
    correlationId,
    requestId,
  })
  res.status(500).json({ message: 'Unexpected error', correlationId })
}
