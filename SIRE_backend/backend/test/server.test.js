
import assert from 'node:assert'
import http from 'node:http'
import { request } from 'node:http'
import express from 'express'
import { io as clientIo } from 'socket.io-client'

const TEST_OPERATION_TIMEOUT_MS = 2000

process.env.API_KEY = 'test-api-key'
process.env.REQUIRE_API_KEY = 'true'
process.env.REQUIRE_TICKET_ID = 'true'
process.env.AUDIT_LOG_ENABLED = 'false'

const { inMemorySessionStore } = await import('../src/models/inMemorySessionStore.mjs')
const { sessionService } = await import('../src/services/sessionService.mjs')
const { scenarioRegistry } = await import('../src/services/scenarioRegistry.mjs')
const { attachSocketServer } = await import('../src/sockets/socketServer.mjs')
const sessionRoute = (await import('../src/routes/sessionRoute.mjs')).default
const sessionsRoute = (await import('../src/routes/sessionsRoute.mjs')).default
const scenarioRoute = (await import('../src/routes/scenarioRoute.mjs')).default
const { attachRequestContext, requireApiKey, requireTicket } = await import('../src/middleware/authMiddleware.mjs')
const { securityHeaders } = await import('../src/middleware/securityHeaders.mjs')

const scenarioKeys = scenarioRegistry.listScenarioKeys()
assert.strictEqual(scenarioKeys.length, 65)

const sampleScenario = scenarioRegistry.getScenarioByKey(scenarioKeys[0])
const session = sessionService.createSession({ scenarioKey: scenarioKeys[0], instructorDisplayName: 'Instructor' })
assert.ok(session.sessionCode)
assert.ok(sampleScenario)

const app = express()
app.use(securityHeaders)
app.use(express.json({ limit: '50kb' }))
app.use(attachRequestContext)
app.use('/api', scenarioRoute)
app.use('/api', sessionsRoute)
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

const scenarioListResponse = await fetchJson('GET', '/api/scenarios')
assert.strictEqual(scenarioListResponse.statusCode, 200)
assert.ok(Array.isArray(scenarioListResponse.body))
assert.strictEqual(scenarioListResponse.body.length, 65)
assert.ok(scenarioListResponse.body.every(s => s.id && s.name))
console.log('✓ GET /api/scenarios accessible without API key')

const scenarioDetailResponse = await fetchJson('GET', `/api/scenarios/${scenarioKeys[0]}`)
assert.strictEqual(scenarioDetailResponse.statusCode, 200)
assert.ok(scenarioDetailResponse.body.root)
assert.ok(scenarioDetailResponse.body.nodes)
console.log('✓ GET /api/scenarios/:key accessible without API key')

const scenarioNotFoundResponse = await fetchJson('GET', '/api/scenarios/scenario_does_not_exist')
assert.strictEqual(scenarioNotFoundResponse.statusCode, 404)
console.log('✓ GET /api/scenarios/:key returns 404 for unknown key')


const listResponse = await fetchJson('GET', '/api/session', null, apiKeyHeader)
assert.strictEqual(listResponse.statusCode, 200)
assert.ok(Array.isArray(listResponse.body))
assert.ok(listResponse.body.find(item => item.sessionCode === session.sessionCode))

const invalidLimitResponse = await fetchJson('GET', '/api/session?limit=not-a-number', null, apiKeyHeader)
assert.strictEqual(invalidLimitResponse.statusCode, 400)

// Test 1: socket auth via legacy extraHeaders (backward-compatibility)
const client = clientIo(`http://localhost:${port}/sim`, {
  transports: ['websocket'],
  extraHeaders: apiKeyHeader,
  forceNew: true
})
await new Promise((resolve, reject) => {
  const timer = setTimeout(() => reject(new Error('connect timeout')), TEST_OPERATION_TIMEOUT_MS)
  client.on('connect', () => {
    clearTimeout(timer)
    resolve()
  })
  client.on('connect_error', reject)
})
const joined = await new Promise((resolve, reject) => {
  const timer = setTimeout(() => reject(new Error('join timeout')), TEST_OPERATION_TIMEOUT_MS)
  client.on('session:joined', data => {
    clearTimeout(timer)
    resolve(data)
  })
  client.emit('session:join', { sessionCode: session.sessionCode, displayName: 'Trainee One' })
  client.on('error:occurred', data => {
    clearTimeout(timer)
    reject(new Error(`join failed: ${data?.code || 'unknown'}`))
  })
})

assert.strictEqual(joined.sessionCode, session.sessionCode)
assert.strictEqual(joined.currentTimelineIndex, -1)
client.close()
console.log('✓ Socket.IO auth via extraHeaders (backward-compat) passed')

// Test 2: socket auth via auth payload (browser-safe primary path)
const session2 = sessionService.createSession({ scenarioKey: scenarioKeys[0], instructorDisplayName: 'Instructor2' })
const clientAuth = clientIo(`http://localhost:${port}/sim`, {
  transports: ['websocket'],
  auth: { apiKey: process.env.API_KEY },
  forceNew: true
})
await new Promise((resolve, reject) => {
  const timer = setTimeout(() => reject(new Error('auth connect timeout')), TEST_OPERATION_TIMEOUT_MS)
  clientAuth.on('connect', () => {
    clearTimeout(timer)
    resolve()
  })
  clientAuth.on('connect_error', reject)
})
const joined2 = await new Promise((resolve, reject) => {
  const timer = setTimeout(() => reject(new Error('auth join timeout')), TEST_OPERATION_TIMEOUT_MS)
  clientAuth.on('session:joined', data => {
    clearTimeout(timer)
    resolve(data)
  })
  clientAuth.emit('session:join', { sessionCode: session2.sessionCode, displayName: 'Trainee Two' })
  clientAuth.on('error:occurred', data => {
    clearTimeout(timer)
    reject(new Error(`auth join failed: ${data?.code || 'unknown'}`))
  })
})
assert.strictEqual(joined2.sessionCode, session2.sessionCode)
clientAuth.close()
console.log('✓ Socket.IO auth via auth payload (browser-safe) passed')

// Test 3: socket connection rejected when api key is wrong
const clientBadAuth = clientIo(`http://localhost:${port}/sim`, {
  transports: ['websocket'],
  auth: { apiKey: 'wrong-key' },
  forceNew: true
})
await new Promise((resolve, reject) => {
  const timer = setTimeout(() => reject(new Error('bad-auth timeout')), TEST_OPERATION_TIMEOUT_MS)
  clientBadAuth.on('connect_error', (err) => {
    clearTimeout(timer)
    if (String(err.message).includes('UNAUTHORIZED')) {
      resolve()
    } else {
      reject(new Error(`Expected UNAUTHORIZED, got: ${err.message}`))
    }
  })
  clientBadAuth.on('connect', () => {
    clearTimeout(timer)
    reject(new Error('Expected connection to be refused with wrong key'))
  })
})
clientBadAuth.close()
console.log('✓ Socket.IO rejects wrong api key')

// Test POST /sessions - create a session without API key (public endpoint)
const createSessionResponse = await fetchJson('POST', '/api/sessions', { scenario: scenarioKeys[0] })
assert.strictEqual(createSessionResponse.statusCode, 201)
assert.ok(createSessionResponse.body.sessionKey)
assert.strictEqual(createSessionResponse.body.scenarioKey, scenarioKeys[0])
console.log('✓ POST /api/sessions creates session without API key')

// Test POST /sessions with an invalid scenario key
const invalidScenarioResponse = await fetchJson('POST', '/api/sessions', { scenario: 'scenario_does_not_exist' })
assert.strictEqual(invalidScenarioResponse.statusCode, 404)
console.log('✓ POST /api/sessions returns 404 for unknown scenario')

// Test POST /sessions/join - join the newly created session without API key
const createdSessionKey = createSessionResponse.body.sessionKey
const joinSessionResponse = await fetchJson('POST', '/api/sessions/join', { sessionKey: createdSessionKey })
assert.strictEqual(joinSessionResponse.statusCode, 200)
assert.strictEqual(joinSessionResponse.body.sessionKey, createdSessionKey)
assert.strictEqual(joinSessionResponse.body.scenarioKey, scenarioKeys[0])
console.log('✓ POST /api/sessions/join joins session without API key')

// Test POST /sessions/join with an invalid session key
const invalidJoinResponse = await fetchJson('POST', '/api/sessions/join', { sessionKey: 'XXXXXX' })
assert.strictEqual(invalidJoinResponse.statusCode, 404)
console.log('✓ POST /api/sessions/join returns 404 for unknown session')

const deleteDenied = await fetchJson('DELETE', `/api/session/${session.sessionCode}`, null, apiKeyHeader)
assert.strictEqual(deleteDenied.statusCode, 400)

const deleteResponse = await fetchJson('DELETE', `/api/session/${session.sessionCode}`, null, { ...apiKeyHeader, ...ticketHeader })
assert.strictEqual(deleteResponse.statusCode, 200)
const listAfterDelete = await fetchJson('GET', '/api/session', null, apiKeyHeader)
assert.strictEqual(listAfterDelete.statusCode, 200)
assert.ok(!listAfterDelete.body.find(item => item.sessionCode === session.sessionCode))

io.close()
httpServer.close()
inMemorySessionStore.setActive(session.sessionCode, false)
inMemorySessionStore.setActive(session2.sessionCode, false)
inMemorySessionStore.setActive(createdSessionKey, false)
console.log('Socket.IO integration test passed')
