
import assert from 'node:assert'
import http from 'node:http'
import { request } from 'node:http'
import express from 'express'
import { io as clientIo } from 'socket.io-client'

process.env.API_KEY = 'test-api-key'
process.env.REQUIRE_API_KEY = 'true'
process.env.REQUIRE_TICKET_ID = 'true'
process.env.AUDIT_LOG_ENABLED = 'false'

const { inMemorySessionStore } = await import('../src/models/inMemorySessionStore.mjs')
const { sessionService } = await import('../src/services/sessionService.mjs')
const { scenarioRegistry } = await import('../src/services/scenarioRegistry.mjs')
const { attachSocketServer } = await import('../src/sockets/socketServer.mjs')
const sessionRoute = (await import('../src/routes/sessionRoute.mjs')).default
const { attachRequestContext, requireApiKey, requireTicket } = await import('../src/middleware/authMiddleware.mjs')
const { securityHeaders } = await import('../src/middleware/securityHeaders.mjs')

const scenarioKeys = scenarioRegistry.listScenarioKeys()
assert.strictEqual(scenarioKeys.length, 8)

const sampleScenario = scenarioRegistry.getScenarioByKey(scenarioKeys[0])
const session = sessionService.createSession({ scenarioKey: scenarioKeys[0], instructorDisplayName: 'Instructor' })
assert.ok(session.sessionCode)
assert.ok(sampleScenario)

const app = express()
app.use(securityHeaders)
app.use(express.json({ limit: '50kb' }))
app.use(attachRequestContext)
app.use('/api', requireApiKey)
app.use('/api', requireTicket)
app.use('/api', sessionRoute)

const httpServer = http.createServer(app)
const io = attachSocketServer(httpServer, console)
await new Promise(resolve => httpServer.listen(0, resolve))
const port = httpServer.address().port
const baseUrl = `http://127.0.0.1:${port}`
const apiKeyHeader = { 'x-api-key': process.env.API_KEY }
const ticketHeader = { 'x-ticket-id': 'TICKET-1234' }

const fetchJson = async (method, path, body, headers = {}) => new Promise((resolve, reject) => {
  const mergedHeaders = body ? { 'Content-Type': 'application/json', ...headers } : headers
  const req = request(`${baseUrl}${path}`, {
    method,
    headers: Object.keys(mergedHeaders).length > 0 ? mergedHeaders : undefined
  }, res => {
    let data = ''
    res.on('data', chunk => { data += chunk })
    res.on('end', () => {
      const parsed = data ? JSON.parse(data) : null
      resolve({ statusCode: res.statusCode, body: parsed })
    })
  })
  req.on('error', reject)
  if (body) req.write(JSON.stringify(body))
  req.end()
})

const unauthorizedList = await fetchJson('GET', '/api/session')
assert.strictEqual(unauthorizedList.statusCode, 401)

const listResponse = await fetchJson('GET', '/api/session', null, apiKeyHeader)
assert.strictEqual(listResponse.statusCode, 200)
assert.ok(Array.isArray(listResponse.body))
assert.ok(listResponse.body.find(item => item.sessionCode === session.sessionCode))

const invalidLimitResponse = await fetchJson('GET', '/api/session?limit=not-a-number', null, apiKeyHeader)
assert.strictEqual(invalidLimitResponse.statusCode, 400)

const client = clientIo(`http://localhost:${port}/sim`, {
  transports: ['websocket'],
  extraHeaders: apiKeyHeader,
  forceNew: true
})
await new Promise((resolve, reject) => {
  const timer = setTimeout(() => reject(new Error('connect timeout')), 1000)
  client.on('connect', () => {
    clearTimeout(timer)
    resolve()
  })
  client.on('connect_error', reject)
})
const joined = await new Promise((resolve, reject) => {
  const timer = setTimeout(() => reject(new Error('join timeout')), 1000)
  client.on('session:joined', data => {
    clearTimeout(timer)
    resolve(data)
  })
  client.emit('session:join', { sessionCode: session.sessionCode, displayName: 'Trainee One' })
})

assert.strictEqual(joined.sessionCode, session.sessionCode)
assert.strictEqual(joined.currentTimelineIndex, -1)

const deleteDenied = await fetchJson('DELETE', `/api/session/${session.sessionCode}`, null, apiKeyHeader)
assert.strictEqual(deleteDenied.statusCode, 400)

const deleteResponse = await fetchJson('DELETE', `/api/session/${session.sessionCode}`, null, { ...apiKeyHeader, ...ticketHeader })
assert.strictEqual(deleteResponse.statusCode, 200)
const listAfterDelete = await fetchJson('GET', '/api/session', null, apiKeyHeader)
assert.strictEqual(listAfterDelete.statusCode, 200)
assert.ok(!listAfterDelete.body.find(item => item.sessionCode === session.sessionCode))

client.close()
io.close()
httpServer.close()
inMemorySessionStore.setActive(session.sessionCode, false)
console.log('Socket.IO integration test passed')
