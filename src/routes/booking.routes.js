import express from 'express'
import { authenticate } from '../middleware/auth.middleware.js'
import { reserveSeats, confirmBooking, listBookings, cancelBooking } from '../controllers/booking.controller.js'

const router = express.Router()

router.use(authenticate)
router.get('/', listBookings)
router.post('/reserve', reserveSeats)
router.post('/confirm', confirmBooking)
router.post('/:id/cancel', cancelBooking)

export default router
