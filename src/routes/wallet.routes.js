import express from 'express'
import { authenticate } from '../middleware/auth.middleware.js'
import { topUpWallet, transferWallet, getTransactions } from '../controllers/wallet.controller.js'

const router = express.Router()

router.use(authenticate)
router.post('/topup', topUpWallet)
router.post('/transfer', transferWallet)
router.get('/transactions', getTransactions)

export default router
