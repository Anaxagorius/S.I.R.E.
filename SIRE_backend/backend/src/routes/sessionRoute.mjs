
/** sessionRoute.js */
import { Router } from 'express'
import { sessionController } from '../controllers/sessionController.mjs'
const router = Router()
router.post('/session', sessionController.createSession)
router.get('/session/:sessionCode', sessionController.getSession)
export default router

