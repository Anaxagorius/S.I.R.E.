
/**
 * server.mjs â€” Application entrypoint
 * - Creates Express app for REST API
 * - Attaches Socket.IO server for realâ€‘time events
 * - Exposes health and session endpoints
 */
import express from 'express'
import http from 'http'
import cors from 'cors'
import morgan from 'morgan'


import healthRoute from './routes/healthRoute.mjs'
import sessionRoute from './routes/sessionRoute.mjs'
import sessionsRoute from './routes/sessionsRoute.mjs'
import scenarioRoute from './routes/scenarioRoute.mjs'
import authRoute from './routes/authRoute.mjs'
import { environmentConfig } from './config/environmentConfig.mjs'
import { applicationLogger } from './config/logger.mjs'
import { attachSocketServer } from './sockets/socketServer.mjs'
import { attachRequestContext, requireApiKey, requireTicket } from './middleware/authMiddleware.mjs'
import { securityHeaders } from './middleware/securityHeaders.mjs'
import { errorHandler } from './middleware/errorHandler.mjs'
import { securityConfig } from './config/securityConfig.mjs'


const app = express()
app.use(securityHeaders)
app.use(cors({
  origin: environmentConfig.allowedOrigins.includes('*') 
    ? '*' 
    : environmentConfig.allowedOrigins,
  credentials: !environmentConfig.allowedOrigins.includes('*')
}))
app.use(express.json({ limit: '50kb' }))
app.use(attachRequestContext)
app.use(morgan('tiny'))

if (securityConfig.requireApiKey && !securityConfig.apiKey) {
  applicationLogger.warn(
    'API key enforcement enabled without API_KEY configured — ' +
    'all API requests will be rejected with 401. ' +
    'Set the API_KEY environment variable (and VITE_API_KEY on the frontend) to fix this.'
  )
}

const httpServer = http.createServer(app)
const io = attachSocketServer(httpServer, applicationLogger)
app.use((req, res, next) => {
  req.io = io
  next()
})

app.use('/api', authRoute)
app.use('/api', healthRoute)
app.use('/api', scenarioRoute)
app.use('/api', requireApiKey)
app.use('/api', requireTicket)
app.use('/api', sessionRoute)
app.use('/api', sessionsRoute)
app.use(errorHandler)

httpServer.listen(environmentConfig.httpPort, () => {
  applicationLogger.info('HTTP server listening', { port: environmentConfig.httpPort })
})
