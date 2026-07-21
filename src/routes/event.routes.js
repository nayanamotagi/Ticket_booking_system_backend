import express from 'express'
import { listEvents, getEvent } from '../controllers/event.controller.js'

const router = express.Router()

router.get('/', listEvents)
router.get('/:id', getEvent)

export default router
