/**
 * sireDatabase.mjs
 * Standalone SQLite database for S.I.R.E. persistent storage.
 *
 * Intended to store:
 *   - users    : trainee participant usernames
 *   - scenarios: scenario definitions (metadata + full JSON payload)
 *
 * NOTE: This module is intentionally NOT imported by any route or service yet.
 *       It is a standalone store to be wired in once the application is ready
 *       to persist user and scenario data.
 */
import Database from 'better-sqlite3'
import path from 'path'
import fs from 'fs'

/** Resolve the database file path from the environment or use a sensible default. */
const dbPath = process.env.SIRE_DB_PATH
  ? path.resolve(process.env.SIRE_DB_PATH)
  : path.resolve('data', 'sire.db')

/** Ensure the directory for the database file exists. */
fs.mkdirSync(path.dirname(dbPath), { recursive: true })

const db = new Database(dbPath)

/** Enable WAL mode for better concurrent read performance. */
db.pragma('journal_mode = WAL')

/**
 * users table
 * Stores trainee participant usernames used during training sessions.
 *
 * Columns:
 *   id         - unique identifier (nanoid / UUID)
 *   username   - display name chosen by the trainee (unique)
 *   created_at - ISO-8601 timestamp of record creation
 */
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id         TEXT PRIMARY KEY,
    username   TEXT UNIQUE NOT NULL,
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
  )
`)

/**
 * scenarios table
 * Stores scenario definitions that can be used in training sessions.
 *
 * Columns:
 *   id          - unique scenario key (e.g. 'scenario_fire')
 *   title       - human-readable scenario title
 *   description - short summary shown to participants
 *   json_data   - full scenario definition serialised as a JSON string
 *   created_at  - ISO-8601 timestamp of record creation
 */
db.exec(`
  CREATE TABLE IF NOT EXISTS scenarios (
    id          TEXT PRIMARY KEY,
    title       TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    json_data   TEXT NOT NULL DEFAULT '{}',
    created_at  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
  )
`)

/**
 * session_results table
 * Stores completed session summaries for program-level analytics.
 *
 * Columns:
 *   session_code       - the short code that identified the session
 *   scenario_key       - scenario identifier (e.g. 'scenario_fire')
 *   started_at         - ISO-8601 timestamp when the timeline started
 *   ended_at           - ISO-8601 timestamp when the session ended
 *   participant_count  - number of trainees who joined
 *   json_data          - full KPI summary serialised as a JSON string
 *   created_at         - ISO-8601 timestamp when this record was inserted
 */
db.exec(`
  CREATE TABLE IF NOT EXISTS session_results (
    id                INTEGER PRIMARY KEY AUTOINCREMENT,
    session_code      TEXT NOT NULL,
    scenario_key      TEXT NOT NULL,
    started_at        TEXT,
    ended_at          TEXT,
    participant_count INTEGER NOT NULL DEFAULT 0,
    json_data         TEXT NOT NULL DEFAULT '{}',
    created_at        TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
  )
`)

/**
 * integrations table
 * Stores external integration configurations (ITSM webhooks, threat-intel feeds).
 *
 * Columns:
 *   id         - UUID primary key
 *   type       - integration category: 'itsm' | 'threat-intel'
 *   name       - human-readable label for the integration
 *   config     - JSON blob containing type-specific settings (webhookUrl, platformType, authToken, feedUrl, etc.)
 *   is_enabled - 1 (active) or 0 (disabled)
 *   created_at - ISO-8601 timestamp of record creation
 */
db.exec(`
  CREATE TABLE IF NOT EXISTS integrations (
    id         TEXT PRIMARY KEY,
    type       TEXT NOT NULL,
    name       TEXT NOT NULL,
    config     TEXT NOT NULL DEFAULT '{}',
    is_enabled INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
  )
`)



const stmts = {
  /* users */
  getUserById:       db.prepare('SELECT * FROM users WHERE id = ?'),
  getUserByUsername: db.prepare('SELECT * FROM users WHERE username = ?'),
  insertUser:        db.prepare(
    'INSERT INTO users (id, username) VALUES (?, ?)'
  ),
  listUsers:         db.prepare('SELECT * FROM users ORDER BY created_at ASC'),
  deleteUser:        db.prepare('DELETE FROM users WHERE id = ?'),

  /* scenarios */
  getScenarioById:   db.prepare('SELECT * FROM scenarios WHERE id = ?'),
  insertScenario:    db.prepare(
    'INSERT INTO scenarios (id, title, description, json_data) VALUES (?, ?, ?, ?)'
  ),
  updateScenario:    db.prepare(
    'UPDATE scenarios SET title = ?, description = ?, json_data = ? WHERE id = ?'
  ),
  listScenarios:     db.prepare('SELECT id, title, description, created_at FROM scenarios ORDER BY id ASC'),
  deleteScenario:    db.prepare('DELETE FROM scenarios WHERE id = ?'),

  /* session_results */
  insertSessionResult: db.prepare(
    'INSERT INTO session_results (session_code, scenario_key, started_at, ended_at, participant_count, json_data) VALUES (?, ?, ?, ?, ?, ?)'
  ),
  listSessionResults: db.prepare(
    'SELECT id, session_code, scenario_key, started_at, ended_at, participant_count, json_data, created_at FROM session_results ORDER BY created_at DESC LIMIT 100'
  ),

  /* integrations */
  getIntegrationById: db.prepare('SELECT * FROM integrations WHERE id = ?'),
  listIntegrations:   db.prepare('SELECT * FROM integrations ORDER BY created_at ASC'),
  listIntegrationsByType: db.prepare('SELECT * FROM integrations WHERE type = ? ORDER BY created_at ASC'),
  insertIntegration:  db.prepare(
    'INSERT INTO integrations (id, type, name, config, is_enabled) VALUES (?, ?, ?, ?, ?)'
  ),
  updateIntegration:  db.prepare(
    'UPDATE integrations SET name = ?, config = ?, is_enabled = ? WHERE id = ?'
  ),
  deleteIntegration:  db.prepare('DELETE FROM integrations WHERE id = ?'),
}

/* ------------------------------------------------------------------ */
/*  Public API                                                          */
/* ------------------------------------------------------------------ */

export const sireDatabase = {
  /* ---- users ---- */

  /**
   * Retrieves a trainee user by their id.
   * @param {string} id
   * @returns {{ id: string, username: string, created_at: string } | null}
   */
  getUserById: (id) => stmts.getUserById.get(id) ?? null,

  /**
   * Retrieves a trainee user by their username.
   * @param {string} username
   * @returns {{ id: string, username: string, created_at: string } | null}
   */
  getUserByUsername: (username) => stmts.getUserByUsername.get(username) ?? null,

  /**
   * Persists a new trainee user record.
   * @param {{ id: string, username: string }} user
   * @throws {Error} with code 'USERNAME_CONFLICT' if the username already exists
   */
  createUser: ({ id, username }) => {
    try {
      stmts.insertUser.run(id, username)
    } catch (err) {
      if (err.code === 'SQLITE_CONSTRAINT_UNIQUE' || err.code === 'SQLITE_CONSTRAINT') {
        const conflict = new Error('Username already taken')
        conflict.code = 'USERNAME_CONFLICT'
        throw conflict
      }
      throw err
    }
  },

  /**
   * Returns all trainee users ordered by creation time.
   * @returns {Array<{ id: string, username: string, created_at: string }>}
   */
  listUsers: () => stmts.listUsers.all(),

  /**
   * Removes a trainee user by their id.
   * @param {string} id
   */
  deleteUser: (id) => stmts.deleteUser.run(id),

  /* ---- scenarios ---- */

  /**
   * Retrieves a scenario definition by its key.
   * @param {string} id - scenario key (e.g. 'scenario_fire')
   * @returns {{ id: string, title: string, description: string, json_data: string, created_at: string } | null}
   */
  getScenarioById: (id) => stmts.getScenarioById.get(id) ?? null,

  /**
   * Persists a new scenario record.
   * @param {{ id: string, title: string, description?: string, jsonData: object }} scenario
   * @throws {Error} with code 'SCENARIO_CONFLICT' if the id already exists
   */
  createScenario: ({ id, title, description = '', jsonData }) => {
    try {
      stmts.insertScenario.run(id, title, description, JSON.stringify(jsonData))
    } catch (err) {
      if (err.code === 'SQLITE_CONSTRAINT_UNIQUE' || err.code === 'SQLITE_CONSTRAINT') {
        const conflict = new Error('Scenario id already exists')
        conflict.code = 'SCENARIO_CONFLICT'
        throw conflict
      }
      throw err
    }
  },

  /**
   * Updates an existing scenario record.
   * @param {{ id: string, title: string, description?: string, jsonData: object }} scenario
   * @throws {Error} with code 'SCENARIO_NOT_FOUND' if no scenario with the given id exists
   */
  updateScenario: ({ id, title, description = '', jsonData }) => {
    const result = stmts.updateScenario.run(title, description, JSON.stringify(jsonData), id)
    if (result.changes === 0) {
      const notFound = new Error(`Scenario '${id}' not found`)
      notFound.code = 'SCENARIO_NOT_FOUND'
      throw notFound
    }
  },

  /**
   * Returns all scenarios (id, title, description, created_at) without the full JSON payload.
   * @returns {Array<{ id: string, title: string, description: string, created_at: string }>}
   */
  listScenarios: () => stmts.listScenarios.all(),

  /**
   * Removes a scenario by its id.
   * @param {string} id
   */
  deleteScenario: (id) => stmts.deleteScenario.run(id),

  /* ---- session_results ---- */

  /**
   * Persists a completed session result for program-level analytics.
   * @param {{ sessionCode: string, scenarioKey: string, startedAt: string|null, endedAt: string, participantCount: number, kpis: object }} result
   */
  saveSessionResult: ({ sessionCode, scenarioKey, startedAt, endedAt, participantCount, kpis }) => {
    stmts.insertSessionResult.run(
      sessionCode,
      scenarioKey,
      startedAt || null,
      endedAt,
      participantCount,
      JSON.stringify(kpis)
    )
  },

  /**
   * Returns up to 100 most-recent session results (newest first).
   * @returns {Array<{ id: number, session_code: string, scenario_key: string, started_at: string, ended_at: string, participant_count: number, json_data: string, created_at: string }>}
   */
  listSessionResults: () => stmts.listSessionResults.all(),

  /* ---- integrations ---- */

  /**
   * Retrieves an integration by its id.
   * @param {string} id
   * @returns {{ id: string, type: string, name: string, config: string, is_enabled: number, created_at: string } | null}
   */
  getIntegrationById: (id) => stmts.getIntegrationById.get(id) ?? null,

  /**
   * Returns all integrations ordered by creation time.
   * @returns {Array}
   */
  listIntegrations: () => stmts.listIntegrations.all(),

  /**
   * Returns all integrations of a specific type.
   * @param {'itsm'|'threat-intel'} type
   * @returns {Array}
   */
  listIntegrationsByType: (type) => stmts.listIntegrationsByType.all(type),

  /**
   * Persists a new integration record.
   * @param {{ id: string, type: string, name: string, config: object, isEnabled?: boolean }} integration
   */
  createIntegration: ({ id, type, name, config, isEnabled = true }) => {
    stmts.insertIntegration.run(id, type, name, JSON.stringify(config), isEnabled ? 1 : 0)
  },

  /**
   * Updates an existing integration record.
   * @param {{ id: string, name: string, config: object, isEnabled?: boolean }} integration
   * @throws {Error} with code 'INTEGRATION_NOT_FOUND' if no integration with the given id exists
   */
  updateIntegration: ({ id, name, config, isEnabled = true }) => {
    const result = stmts.updateIntegration.run(name, JSON.stringify(config), isEnabled ? 1 : 0, id)
    if (result.changes === 0) {
      const notFound = new Error(`Integration '${id}' not found`)
      notFound.code = 'INTEGRATION_NOT_FOUND'
      throw notFound
    }
  },

  /**
   * Removes an integration by its id.
   * @param {string} id
   */
  deleteIntegration: (id) => stmts.deleteIntegration.run(id),
}
