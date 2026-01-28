
/** healthRoute.js */
import { Router } from 'express'
const router = Router()
router.get('/health', (req, res) => res.json({ status: 'ok', timestampIso: new Date().toISOString() }))
export default router

