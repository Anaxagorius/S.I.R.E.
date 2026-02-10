
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
  credentials: true
}))
app.use(express.json({ limit: '50kb' }))
app.use(attachRequestContext)
app.use(morgan('tiny'))

if (securityConfig.requireApiKey && !securityConfig.apiKey) {
  applicationLogger.warn('API key enforcement enabled without API_KEY configured')
}

const httpServer = http.createServer(app)
const io = attachSocketServer(httpServer, applicationLogger)
app.use((req, res, next) => {
  req.io = io
  next()
})

app.use('/api', requireApiKey)
app.use('/api', requireTicket)
app.use('/api', healthRoute)
app.use('/api', sessionRoute)
app.use(errorHandler)

httpServer.listen(environmentConfig.httpPort, () => {
  applicationLogger.info('HTTP server listening', { port: environmentConfig.httpPort })
})
