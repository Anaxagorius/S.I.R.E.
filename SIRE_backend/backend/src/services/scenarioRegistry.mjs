
/**
 * scenarioRegistry.js
 * Loads scenario definitions from local JSON files.
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const scenariosDirPath = path.resolve(__dirname, '../scenarios')

export const scenarioRegistry = {
  listScenarioKeys: () => {
    return fs.readdirSync(scenariosDirPath)
      .filter(f => f.endsWith('.json'))
      .map(f => f.replace('.json',''))
  },
  getScenarioByKey: (scenarioKey) => {
    const filePath = path.join(scenariosDirPath, `${scenarioKey}.json`)
    if (!fs.existsSync(filePath)) return null
    const raw = fs.readFileSync(filePath, 'utf-8')
    return JSON.parse(raw)
  }
}

