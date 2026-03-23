/**
 * userDatabase.mjs
 * SQLite-backed persistent user store for authentication.
 * Provides the same interface previously served by the in-memory Map in authRoute.mjs
 * so that the rest of the auth logic is unchanged.
 */
import Database from 'better-sqlite3'
import path from 'path'
import fs from 'fs'

/** Resolve the database file path from the environment or use a sensible default. */
const dbPath = process.env.DB_PATH
  ? path.resolve(process.env.DB_PATH)
  : path.resolve('data', 'users.db')

/** Ensure the directory for the database file exists. */
fs.mkdirSync(path.dirname(dbPath), { recursive: true })

const db = new Database(dbPath)

/** Enable WAL mode for better concurrent read performance. */
db.pragma('journal_mode = WAL')

/** Create the users table if it does not already exist. */
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id          TEXT PRIMARY KEY,
    email       TEXT UNIQUE NOT NULL,
    name        TEXT NOT NULL,
    passwordHash TEXT NOT NULL
  )
`)

/** Returns the user row for the given (lower-cased) email, or undefined. */
const getByEmail = db.prepare('SELECT * FROM users WHERE email = ?')

/** Returns the user row for the given id, or undefined. */
const getById = db.prepare('SELECT * FROM users WHERE id = ?')

/** Inserts a new user row. */
const insertUser = db.prepare(
  'INSERT INTO users (id, email, name, passwordHash) VALUES (?, ?, ?, ?)'
)

/** Checks whether an email already exists in the table. */
const emailExists = db.prepare('SELECT 1 FROM users WHERE email = ? LIMIT 1')

export const userDatabase = {
  /**
   * Retrieves a user by their email address.
   * @param {string} email - lower-cased email
   * @returns {{ id: string, email: string, name: string, passwordHash: string } | null}
   */
  getByEmail: (email) => getByEmail.get(email) ?? null,

  /**
   * Retrieves a user by their id.
   * @param {string} id
   * @returns {{ id: string, email: string, name: string, passwordHash: string } | null}
   */
  getById: (id) => getById.get(id) ?? null,

  /**
   * Returns true if the given email is already registered.
   * @param {string} email - lower-cased email
   * @returns {boolean}
   */
  emailExists: (email) => !!emailExists.get(email),

  /**
   * Persists a new user record.
   * Callers must verify the email does not already exist (via emailExists) before calling this
   * to avoid a UNIQUE constraint error.
   * @param {{ id: string, email: string, name: string, passwordHash: string }} user
   * @throws {Error} if the email already exists in the database
   */
  createUser: ({ id, email, name, passwordHash }) => {
    try {
      insertUser.run(id, email, name, passwordHash)
    } catch (err) {
      if (err.code === 'SQLITE_CONSTRAINT_UNIQUE' || err.code === 'SQLITE_CONSTRAINT') {
        const duplicate = new Error('Email already registered')
        duplicate.code = 'EMAIL_CONFLICT'
        throw duplicate
      }
      throw err
    }
  },
}
