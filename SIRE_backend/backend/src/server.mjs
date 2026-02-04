
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


const app = express()
app.use(cors())
app.use(express.json())
app.use(morgan('dev'))

const httpServer = http.createServer(app)
const io = attachSocketServer(httpServer, applicationLogger)
app.use((req, res, next) => {
  req.io = io
  next()
})

app.use('/api', healthRoute)
app.use('/api', sessionRoute)

httpServer.listen(environmentConfig.httpPort, () => {
  applicationLogger.info('HTTP server listening', { port: environmentConfig.httpPort })
})
