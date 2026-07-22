import express from 'express'
import { authenticate } from '../middleware/auth.middleware.js'
import { login, loginAdmin, logout, register } from '../controllers/auth.controller.js'

const router = express.Router()

router.post('/register', register)
router.post('/login', login)
router.post('/logout', authenticate, logout)
router.post('/admin/login', loginAdmin)

export default router
