
import assert from 'node:assert'
import http from 'node:http'
import { request } from 'node:http'
import express from 'express'
import { io as clientIo } from 'socket.io-client'
import { inMemorySessionStore } from '../src/models/inMemorySessionStore.mjs'
import { sessionService } from '../src/services/sessionService.mjs'
import { scenarioRegistry } from '../src/services/scenarioRegistry.mjs'
import { attachSocketServer } from '../src/sockets/socketServer.mjs'
import sessionRoute from '../src/routes/sessionRoute.mjs'

const scenarioKeys = scenarioRegistry.listScenarioKeys()
assert.strictEqual(scenarioKeys.length, 8)

const sampleScenario = scenarioRegistry.getScenarioByKey(scenarioKeys[0])
const session = sessionService.createSession({ scenarioKey: scenarioKeys[0], instructorDisplayName: 'Instructor' })
assert.ok(session.sessionCode)
assert.ok(sampleScenario)

const app = express()
app.use(express.json())
app.use('/api', sessionRoute)

const httpServer = http.createServer(app)
const io = attachSocketServer(httpServer, console)
await new Promise(resolve => httpServer.listen(0, resolve))
const port = httpServer.address().port
const baseUrl = `http://127.0.0.1:${port}`

const fetchJson = async (method, path, body) => new Promise((resolve, reject) => {
  const req = request(`${baseUrl}${path}`, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined
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

const listResponse = await fetchJson('GET', '/api/session')
assert.strictEqual(listResponse.statusCode, 200)
assert.ok(Array.isArray(listResponse.body))
assert.ok(listResponse.body.find(item => item.sessionCode === session.sessionCode))

const client = clientIo(`http://localhost:${port}/sim`, { transports: ['websocket'] })
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

const deleteResponse = await fetchJson('DELETE', `/api/session/${session.sessionCode}`)
assert.strictEqual(deleteResponse.statusCode, 200)
const listAfterDelete = await fetchJson('GET', '/api/session')
assert.strictEqual(listAfterDelete.statusCode, 200)
assert.ok(!listAfterDelete.body.find(item => item.sessionCode === session.sessionCode))

client.close()
io.close()
httpServer.close()
inMemorySessionStore.setActive(session.sessionCode, false)
console.log('Socket.IO integration test passed')
