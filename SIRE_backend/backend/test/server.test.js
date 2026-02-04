
import assert from 'node:assert'
import http from 'node:http'
import { Server } from 'socket.io'
import { io as clientIo } from 'socket.io-client'
import { inMemorySessionStore } from '../src/models/inMemorySessionStore.mjs'
import { sessionService } from '../src/services/sessionService.mjs'
import { scenarioRegistry } from '../src/services/scenarioRegistry.mjs'
import { attachSocketServer } from '../src/sockets/socketServer.mjs'

const scenarioKeys = scenarioRegistry.listScenarioKeys()
assert.strictEqual(scenarioKeys.length, 8)

const sampleScenario = scenarioRegistry.getScenarioByKey(scenarioKeys[0])
const session = sessionService.createSession({ scenarioKey: scenarioKeys[0], instructorDisplayName: 'Instructor' })
assert.ok(session.sessionCode)
assert.ok(sampleScenario)

const httpServer = http.createServer()
const io = attachSocketServer(httpServer, console)
await new Promise(resolve => httpServer.listen(0, resolve))
const port = httpServer.address().port

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

client.close()
io.close()
httpServer.close()
inMemorySessionStore.setActive(session.sessionCode, false)
console.log('Socket.IO integration test passed')
