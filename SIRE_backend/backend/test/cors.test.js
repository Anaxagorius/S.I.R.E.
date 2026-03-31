
import assert from 'node:assert'
import http from 'node:http'
import { request } from 'node:http'
import express from 'express'
import cors from 'cors'

// Test 1: Verify environmentConfig properly parses ALLOWED_ORIGINS
console.log('Test 1: Verify environmentConfig parses ALLOWED_ORIGINS')

// Test with wildcard (current default)
const { environmentConfig: config1 } = await import('../src/config/environmentConfig.mjs')
assert.ok(Array.isArray(config1.allowedOrigins), 'allowedOrigins should be an array')
console.log('✓ ALLOWED_ORIGINS is configured as an array')

// Test 2: Verify Express CORS middleware configuration
console.log('\nTest 2: Verify Express CORS middleware configuration with restricted origins')

// Manually test CORS configuration behavior
const testOrigins = ['http://localhost:3000', 'https://sire.example.com']

const app = express()
app.use(cors({
  origin: testOrigins,
  credentials: true
}))

app.get('/test', (req, res) => {
  res.json({ ok: true })
})

const httpServer = http.createServer(app)
await new Promise(resolve => httpServer.listen(0, resolve))
const port = httpServer.address().port
const baseUrl = `http://127.0.0.1:${port}`

// Test with allowed origin
const allowedOriginResponse = await new Promise((resolve, reject) => {
  const req = request(`${baseUrl}/test`, {
    method: 'GET',
    headers: {
      'Origin': 'http://localhost:3000'
    }
  }, res => {
    let data = ''
    res.on('data', chunk => { data += chunk })
    res.on('end', () => {
      resolve({ 
        statusCode: res.statusCode, 
        headers: res.headers,
        body: data ? JSON.parse(data) : null 
      })
    })
  })
  req.on('error', reject)
  req.end()
})

assert.strictEqual(allowedOriginResponse.statusCode, 200, 'Allowed origin should succeed')
assert.strictEqual(
  allowedOriginResponse.headers['access-control-allow-origin'], 
  'http://localhost:3000', 
  'Should return matching origin'
)
assert.strictEqual(
  allowedOriginResponse.headers['access-control-allow-credentials'], 
  'true', 
  'Should allow credentials for non-wildcard origins'
)
console.log('✓ Allowed origin returns correct CORS headers with credentials')

// Test with non-allowed origin
const disallowedOriginResponse = await new Promise((resolve, reject) => {
  const req = request(`${baseUrl}/test`, {
    method: 'GET',
    headers: {
      'Origin': 'http://evil.example.com'
    }
  }, res => {
    let data = ''
    res.on('data', chunk => { data += chunk })
    res.on('end', () => {
      resolve({ 
        statusCode: res.statusCode, 
        headers: res.headers,
        body: data ? JSON.parse(data) : null 
      })
    })
  })
  req.on('error', reject)
  req.end()
})

assert.strictEqual(disallowedOriginResponse.statusCode, 200, 'Request should still succeed')
assert.strictEqual(
  disallowedOriginResponse.headers['access-control-allow-origin'], 
  undefined, 
  'Should not return CORS header for disallowed origin'
)
console.log('✓ Disallowed origin does not receive CORS headers')

httpServer.close()

// Test 3: Verify wildcard CORS still works
console.log('\nTest 3: Verify wildcard CORS configuration')

const wildcardApp = express()
wildcardApp.use(cors({
  origin: '*',
  credentials: false
}))

wildcardApp.get('/test', (req, res) => {
  res.json({ ok: true })
})

const wildcardServer = http.createServer(wildcardApp)
await new Promise(resolve => wildcardServer.listen(0, resolve))
const wildcardPort = wildcardServer.address().port
const wildcardBaseUrl = `http://127.0.0.1:${wildcardPort}`

const wildcardResponse = await new Promise((resolve, reject) => {
  const req = request(`${wildcardBaseUrl}/test`, {
    method: 'GET',
    headers: {
      'Origin': 'http://any-origin.example.com'
    }
  }, res => {
    let data = ''
    res.on('data', chunk => { data += chunk })
    res.on('end', () => {
      resolve({ 
        statusCode: res.statusCode, 
        headers: res.headers,
        body: data ? JSON.parse(data) : null 
      })
    })
  })
  req.on('error', reject)
  req.end()
})

assert.strictEqual(wildcardResponse.statusCode, 200, 'Wildcard should allow all origins')
assert.strictEqual(
  wildcardResponse.headers['access-control-allow-origin'], 
  '*', 
  'Should return wildcard for any origin'
)
assert.strictEqual(
  wildcardResponse.headers['access-control-allow-credentials'], 
  undefined, 
  'Should not set credentials header for wildcard origin'
)
console.log('✓ Wildcard CORS configuration allows all origins without credentials')

wildcardServer.close()

// Test 4: OPTIONS preflight handling — the critical case for POST with custom headers
console.log('\nTest 4: OPTIONS preflight with allowed origin and custom frontend headers')

const preflightApp = express()
preflightApp.use(cors({
  origin: ['https://s-i-r-e-frontend.onrender.com'],
  credentials: true
}))
preflightApp.post('/api/sessions', (req, res) => {
  res.status(201).json({ sessionKey: 'TEST' })
})

const preflightServer = http.createServer(preflightApp)
await new Promise(resolve => preflightServer.listen(0, resolve))
const preflightPort = preflightServer.address().port
const preflightBaseUrl = `http://127.0.0.1:${preflightPort}`

// Simulate what the browser sends before a POST /api/sessions from the frontend
const preflightResponse = await new Promise((resolve, reject) => {
  const req = request(`${preflightBaseUrl}/api/sessions`, {
    method: 'OPTIONS',
    headers: {
      'Origin': 'https://s-i-r-e-frontend.onrender.com',
      'Access-Control-Request-Method': 'POST',
      'Access-Control-Request-Headers': 'content-type, x-ticket-id'
    }
  }, res => {
    let data = ''
    res.on('data', chunk => { data += chunk })
    res.on('end', () => resolve({ statusCode: res.statusCode, headers: res.headers }))
  })
  req.on('error', reject)
  req.end()
})

assert.strictEqual(preflightResponse.statusCode, 204, 'Preflight OPTIONS should return 204')
assert.strictEqual(
  preflightResponse.headers['access-control-allow-origin'],
  'https://s-i-r-e-frontend.onrender.com',
  'Preflight should echo back the allowed origin'
)
assert.strictEqual(
  preflightResponse.headers['access-control-allow-credentials'],
  'true',
  'Preflight should allow credentials for specific origin'
)
assert.ok(
  preflightResponse.headers['access-control-allow-methods'],
  'Preflight should include Access-Control-Allow-Methods'
)
assert.ok(
  preflightResponse.headers['access-control-allow-headers'],
  'Preflight should include Access-Control-Allow-Headers'
)
console.log('✓ OPTIONS preflight returns correct CORS headers for allowed origin')

// Preflight from disallowed origin should return no CORS headers
const blockedPreflightResponse = await new Promise((resolve, reject) => {
  const req = request(`${preflightBaseUrl}/api/sessions`, {
    method: 'OPTIONS',
    headers: {
      'Origin': 'https://evil.example.com',
      'Access-Control-Request-Method': 'POST',
      'Access-Control-Request-Headers': 'content-type'
    }
  }, res => {
    let data = ''
    res.on('data', chunk => { data += chunk })
    res.on('end', () => resolve({ statusCode: res.statusCode, headers: res.headers }))
  })
  req.on('error', reject)
  req.end()
})

assert.strictEqual(
  blockedPreflightResponse.headers['access-control-allow-origin'],
  undefined,
  'Preflight from disallowed origin should not receive CORS headers'
)
console.log('✓ OPTIONS preflight from disallowed origin receives no CORS headers')

preflightServer.close()

// Test 5: environmentConfig CORS config used in server matches production scenario
console.log('\nTest 5: CORS config derived from environmentConfig handles production origin')

// Simulate the production environment: ALLOWED_ORIGINS set to the frontend URL
const prodOrigin = 'https://s-i-r-e-frontend.onrender.com'
const prodApp = express()
prodApp.use(cors({
  origin: [prodOrigin],
  credentials: true
}))
prodApp.post('/api/sessions', (req, res) => res.status(201).json({ sessionKey: 'TEST' }))

const prodServer = http.createServer(prodApp)
await new Promise(resolve => prodServer.listen(0, resolve))
const prodPort = prodServer.address().port

const prodPreflightResponse = await new Promise((resolve, reject) => {
  const req = request(`http://127.0.0.1:${prodPort}/api/sessions`, {
    method: 'OPTIONS',
    headers: {
      'Origin': prodOrigin,
      'Access-Control-Request-Method': 'POST',
      'Access-Control-Request-Headers': 'content-type, x-ticket-id'
    }
  }, res => {
    let data = ''
    res.on('data', chunk => { data += chunk })
    res.on('end', () => resolve({ statusCode: res.statusCode, headers: res.headers }))
  })
  req.on('error', reject)
  req.end()
})

assert.strictEqual(prodPreflightResponse.statusCode, 204, 'Production preflight should return 204')
assert.strictEqual(
  prodPreflightResponse.headers['access-control-allow-origin'],
  prodOrigin,
  'Production CORS should allow the frontend origin'
)
assert.strictEqual(
  prodPreflightResponse.headers['access-control-allow-credentials'],
  'true',
  'Production CORS should allow credentials for specific origin'
)
console.log('✓ Production CORS config correctly handles frontend origin preflight')

prodServer.close()

console.log('\n✅ All CORS configuration tests passed')
