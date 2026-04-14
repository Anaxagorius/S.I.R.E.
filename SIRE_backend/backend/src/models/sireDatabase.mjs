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
 * documents table
 * Stores reference documents (URL links) that can be attached to scenarios
 * and referenced by participants during exercises.
 *
 * Columns:
 *   id          - unique document identifier (UUID)
 *   name        - human-readable document title
 *   description - short summary of the document
 *   url         - link to the document (external URL or data URI)
 *   scenario_id - optional scenario this document is linked to (nullable)
 *   created_at  - ISO-8601 timestamp of record creation
 */
db.exec(`
  CREATE TABLE IF NOT EXISTS documents (
    id          TEXT PRIMARY KEY,
    name        TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    url         TEXT NOT NULL,
    scenario_id TEXT,
    created_at  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
  )
`)

/* ------------------------------------------------------------------ */
/*  Prepared statements                                                 */
/* ------------------------------------------------------------------ */

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

  /* documents */
  getDocumentById:   db.prepare('SELECT * FROM documents WHERE id = ?'),
  listDocuments:     db.prepare('SELECT * FROM documents ORDER BY created_at ASC'),
  listDocumentsByScenario: db.prepare(
    'SELECT * FROM documents WHERE scenario_id = ? ORDER BY created_at ASC'
  ),
  insertDocument:    db.prepare(
    'INSERT INTO documents (id, name, description, url, scenario_id) VALUES (?, ?, ?, ?, ?)'
  ),
  updateDocument:    db.prepare(
    'UPDATE documents SET name = ?, description = ?, url = ?, scenario_id = ? WHERE id = ?'
  ),
  deleteDocument:    db.prepare('DELETE FROM documents WHERE id = ?'),
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

  /* ---- documents ---- */

  /**
   * Retrieves a document by its id.
   * @param {string} id
   * @returns {{ id: string, name: string, description: string, url: string, scenario_id: string|null, created_at: string } | null}
   */
  getDocumentById: (id) => stmts.getDocumentById.get(id) ?? null,

  /**
   * Returns all documents, optionally filtered to a specific scenario.
   * @param {string} [scenarioId]
   * @returns {Array<{ id: string, name: string, description: string, url: string, scenario_id: string|null, created_at: string }>}
   */
  listDocuments: (scenarioId) => {
    if (scenarioId) return stmts.listDocumentsByScenario.all(scenarioId)
    return stmts.listDocuments.all()
  },

  /**
   * Persists a new document reference.
   * @param {{ id: string, name: string, description?: string, url: string, scenarioId?: string|null }} doc
   */
  createDocument: ({ id, name, description = '', url, scenarioId = null }) => {
    stmts.insertDocument.run(id, name, description, url, scenarioId || null)
  },

  /**
   * Updates an existing document reference.
   * @param {{ id: string, name: string, description?: string, url: string, scenarioId?: string|null }} doc
   * @throws {Error} with code 'DOCUMENT_NOT_FOUND' if no document with the given id exists
   */
  updateDocument: ({ id, name, description = '', url, scenarioId = null }) => {
    const result = stmts.updateDocument.run(name, description, url, scenarioId || null, id)
    if (result.changes === 0) {
      const notFound = new Error(`Document '${id}' not found`)
      notFound.code = 'DOCUMENT_NOT_FOUND'
      throw notFound
    }
  },

  /**
   * Removes a document by its id.
   * @param {string} id
   */
  deleteDocument: (id) => stmts.deleteDocument.run(id),
}
