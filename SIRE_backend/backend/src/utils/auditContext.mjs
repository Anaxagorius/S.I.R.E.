export const buildAuditContext = (payload, allowedKeys = []) => {
  if (!payload || typeof payload !== 'object') return null
  const context = {}
  allowedKeys.forEach((key) => {
    if (payload[key] !== undefined && payload[key] !== null) {
      context[key] = payload[key]
    }
  })
  return Object.keys(context).length > 0 ? context : null
}
