/**
 * server.mjs — Application entrypoint
 * - Creates Express app for REST API
 * - Attaches Socket.IO server for real‑time events
 * - Exposes health and session endpoints
 */

import express from 'express';
import http from 'http';
import cors from 'cors';
import morgan from 'morgan';

import healthRoute from './routes/healthRoute.mjs';
import sessionRoute from './routes/sessionRoute.mjs';
import sessionsRoute from './routes/sessionsRoute.mjs';
import scenarioRoute from './routes/scenarioRoute.mjs';
import authRoute from './routes/authRoute.mjs';
import exportRoute from './routes/exportRoute.mjs';
import documentRoute from './routes/documentRoute.mjs';
import analyticsRoute from './routes/analyticsRoute.mjs';

import { environmentConfig } from './config/environmentConfig.mjs';
import { applicationLogger } from './config/logger.mjs';
import { attachSocketServer } from './sockets/socketServer.mjs';
import { attachRequestContext, requireApiKey, requireTicket } from './middleware/authMiddleware.mjs';
import { securityHeaders } from './middleware/securityHeaders.mjs';
import { errorHandler } from './middleware/errorHandler.mjs';
import { securityConfig } from './config/securityConfig.mjs';

/**
 * Normalize allowed origins from env/config:
 * - supports array input
 * - supports comma-separated string input
 * - trims whitespace
 */
const normalizeAllowedOrigins = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value.map(v => String(v).trim()).filter(Boolean);
  }
  return String(value)
    .split(',')
    .map(v => v.trim())
    .filter(Boolean);
};

const app = express();

/** =========================
 *  ✅ CORS — MUST BE EARLY
 *  =========================
 *
 * Browsers enforce CORS and will preflight (OPTIONS) for JSON POSTs and
 * requests with custom headers. If OPTIONS doesn't return the right headers,
 * the real request never happens. [1](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/CORS)[4](https://bobbyhadz.com/blog/response-to-preflight-request-doesnt-pass-access-control-check)
 *
 * The server must respond with Access-Control-Allow-Origin, etc. The client
 * cannot "fix" this by setting request headers. [2](https://expressjs.com/en/resources/middleware/cors.html)[1](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/CORS)
 */
const allowedOrigins = normalizeAllowedOrigins(environmentConfig.allowedOrigins);
const allowAllOrigins = allowedOrigins.includes('*');

// NOTE: credentials + wildcard ACAO is invalid; browsers reject it. [3](https://www.xjavascript.com/blog/cors-credentials-mode-is-include/)[1](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/CORS)
const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no Origin header (curl, server-to-server, some mobile clients)
    if (!origin) return callback(null, true);

    if (allowAllOrigins) return callback(null, true);

    if (allowedOrigins.includes(origin)) return callback(null, true);

    // Block disallowed origins (no CORS headers will be set)
    return callback(new Error(`CORS blocked for origin: ${origin}`));
  },
  credentials: !allowAllOrigins,
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'Accept',
    'x-api-key',
    'x-ticket-id',
    'x-request-id'
  ],
  methods: ['GET', 'HEAD', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  optionsSuccessStatus: 200
};

// Preflight handling for all routes
app.options('*', cors(corsOptions));
app.use(cors(corsOptions));

/** =========================
 *  Security + parsing
 *  ========================= */
app.use(securityHeaders);
app.use(express.json({ limit: '50kb' }));
app.use(attachRequestContext);
app.use(morgan('tiny'));

if (securityConfig.requireApiKey && !securityConfig.apiKey) {
  applicationLogger.warn(
    'API key enforcement enabled without API_KEY configured — ' +
    'all API requests will be rejected with 401. ' +
    'Set the API_KEY environment variable (and VITE_API_KEY on the frontend) to fix this.'
  );
}

/** =========================
 *  HTTP + Socket.IO
 *  ========================= */
const httpServer = http.createServer(app);
const io = attachSocketServer(httpServer, applicationLogger);

// attach Socket.IO instance to req for routes that emit events
app.use((req, res, next) => {
  req.io = io;
  next();
});

/** =========================
 *  Routes
 *  ========================= */
app.use('/api', authRoute);
app.use('/api', healthRoute);
app.use('/api', scenarioRoute);
app.use('/api', sessionsRoute);
app.use('/api', exportRoute);
app.use('/api', documentRoute);
app.use('/api', analyticsRoute);

// Security enforcement AFTER public endpoints
app.use('/api', requireApiKey);
app.use('/api', requireTicket);
app.use('/api', sessionRoute);

// Error handling last
app.use(errorHandler);

/** =========================
 *  Start server
 *  ========================= */
httpServer.listen(environmentConfig.httpPort, () => {
  applicationLogger.info('HTTP server listening', {
    port: environmentConfig.httpPort,
    allowedOrigins,
    allowAllOrigins
  });
});
