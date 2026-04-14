
/**
 * scenarioRegistry.js
 * Loads scenario definitions from local JSON files and the sireDatabase (custom scenarios).
 * Custom scenarios stored in the database take precedence over built-in file-based scenarios.
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { sireDatabase } from '../models/sireDatabase.mjs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const scenariosDirPath = path.resolve(__dirname, '../scenarios')

/** Returns scenario keys from the local filesystem scenario directory. */
function listFileScenarioKeys() {
  return fs.readdirSync(scenariosDirPath)
    .filter(f => f.endsWith('.json'))
    .map(f => f.replace('.json', ''))
}

/** Returns scenario keys stored as custom scenarios in the database. */
function listDbScenarioKeys() {
  try {
    return sireDatabase.listScenarios().map(s => s.id)
  } catch (_) {
    return []
  }
}

/** Retrieves a custom scenario from the database by key. Returns null if not found or on error. */
function getDbScenario(scenarioKey) {
  try {
    const row = sireDatabase.getScenarioById(scenarioKey)
    if (!row) return null
    return JSON.parse(row.json_data)
  } catch (_) {
    return null
  }
}

export const scenarioRegistry = {
  listScenarioKeys: () => {
    const fsKeys = listFileScenarioKeys()
    const dbKeys = listDbScenarioKeys()
    const all = new Set([...fsKeys, ...dbKeys])
    return [...all]
  },

  getScenarioByKey: (scenarioKey) => {
    // Custom (DB) scenarios take precedence over built-in file scenarios.
    const dbScenario = getDbScenario(scenarioKey)
    if (dbScenario) return dbScenario

    const filePath = path.join(scenariosDirPath, `${scenarioKey}.json`)
    if (!fs.existsSync(filePath)) return null
    const raw = fs.readFileSync(filePath, 'utf-8')
    return JSON.parse(raw)
  },
}

