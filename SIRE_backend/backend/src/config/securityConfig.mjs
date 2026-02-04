export const securityConfig = Object.freeze({
  apiKey: process.env.API_KEY ? String(process.env.API_KEY) : null,
  requireApiKey: String(process.env.REQUIRE_API_KEY || 'true').toLowerCase() !== 'false',
  auditLogEnabled: String(process.env.AUDIT_LOG_ENABLED || 'true').toLowerCase() !== 'false',
  requestIdHeader: String(process.env.REQUEST_ID_HEADER || 'x-request-id').toLowerCase(),
  apiKeyHeader: String(process.env.API_KEY_HEADER || 'x-api-key').toLowerCase(),
  socketHandshakeHeader: String(process.env.SOCKET_API_KEY_HEADER || 'x-api-key').toLowerCase(),
  ticketHeader: String(process.env.TICKET_HEADER || 'x-ticket-id').toLowerCase(),
  requireTicketForMutations: String(process.env.REQUIRE_TICKET_ID || 'true').toLowerCase() !== 'false',
  auditContextLabel: String(process.env.CODEBASE_CONTEXT || 'SIRE_backend'),
})
