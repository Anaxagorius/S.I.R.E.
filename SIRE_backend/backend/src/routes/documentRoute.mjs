/**
 * documentRoute.mjs
 * CRUD endpoints for the document reference library.
 *
 * GET    /api/documents            - list all documents (filter with ?scenarioId=xxx)
 * POST   /api/documents            - create a new document reference
 * PUT    /api/documents/:id        - update an existing document reference
 * DELETE /api/documents/:id        - delete a document reference
 */
import { Router } from 'express'
import crypto from 'crypto'
import { sireDatabase } from '../models/sireDatabase.mjs'
import { isPlainObject, normalizeText, normalizeScenarioKey } from '../utils/validation.mjs'

const router = Router()

const MAX_NAME_LENGTH = 200
const MAX_DESC_LENGTH = 500
const MAX_URL_LENGTH = 2000

/** Validate and normalise a URL string. Returns null if invalid or too long. */
function normalizeUrl(value) {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  if (!trimmed || trimmed.length > MAX_URL_LENGTH) return null
  return trimmed
}

/** GET /api/documents — list all documents, optionally filtered by scenarioId. */
router.get('/documents', (req, res) => {
  const scenarioId = req.query.scenarioId
    ? normalizeScenarioKey(req.query.scenarioId)
    : null

  if (req.query.scenarioId && !scenarioId) {
    return res.status(400).json({ message: 'Invalid scenarioId', correlationId: req.context?.correlationId })
  }

  const docs = sireDatabase.listDocuments(scenarioId || undefined)
  return res.json(docs)
})

/** POST /api/documents — create a new document reference. */
router.post('/documents', (req, res) => {
  if (!isPlainObject(req.body)) {
    return res.status(400).json({ message: 'Invalid payload', correlationId: req.context?.correlationId })
  }

  const name = normalizeText(req.body.name, MAX_NAME_LENGTH)
  const description = normalizeText(req.body.description, MAX_DESC_LENGTH) || ''
  const url = normalizeUrl(req.body.url)
  const scenarioId = req.body.scenarioId
    ? normalizeScenarioKey(req.body.scenarioId)
    : null

  if (!name) {
    return res.status(400).json({ message: 'name is required', correlationId: req.context?.correlationId })
  }
  if (!url) {
    return res.status(400).json({ message: 'url is required and must be at most 2000 characters', correlationId: req.context?.correlationId })
  }

  const id = crypto.randomUUID()
  sireDatabase.createDocument({ id, name, description, url, scenarioId })

  const doc = sireDatabase.getDocumentById(id)
  return res.status(201).json(doc)
})

/** PUT /api/documents/:id — update an existing document reference. */
router.put('/documents/:id', (req, res) => {
  const { id } = req.params

  if (!isPlainObject(req.body)) {
    return res.status(400).json({ message: 'Invalid payload', correlationId: req.context?.correlationId })
  }

  const name = normalizeText(req.body.name, MAX_NAME_LENGTH)
  const description = normalizeText(req.body.description, MAX_DESC_LENGTH) || ''
  const url = normalizeUrl(req.body.url)
  const scenarioId = req.body.scenarioId
    ? normalizeScenarioKey(req.body.scenarioId)
    : null

  if (!name) {
    return res.status(400).json({ message: 'name is required', correlationId: req.context?.correlationId })
  }
  if (!url) {
    return res.status(400).json({ message: 'url is required and must be at most 2000 characters', correlationId: req.context?.correlationId })
  }

  try {
    sireDatabase.updateDocument({ id, name, description, url, scenarioId })
    const doc = sireDatabase.getDocumentById(id)
    return res.json(doc)
  } catch (err) {
    if (err.code === 'DOCUMENT_NOT_FOUND') {
      return res.status(404).json({ message: 'Document not found', correlationId: req.context?.correlationId })
    }
    throw err
  }
})

/** DELETE /api/documents/:id — delete a document reference. */
router.delete('/documents/:id', (req, res) => {
  const { id } = req.params
  if (!id) {
    return res.status(400).json({ message: 'Document id is required', correlationId: req.context?.correlationId })
  }

  const existing = sireDatabase.getDocumentById(id)
  if (!existing) {
    return res.status(404).json({ message: 'Document not found', correlationId: req.context?.correlationId })
  }

  sireDatabase.deleteDocument(id)
  return res.status(204).send()
})

export default router
