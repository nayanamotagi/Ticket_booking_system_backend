import express from 'express'
import { authenticate, authorize } from '../middleware/auth.middleware.js'
import { loginAdmin } from '../controllers/auth.controller.js'
import { listEvents } from '../controllers/event.controller.js'
import {
    createEvent,
    updateEvent,
    deleteEvent,
    bulkCreateSeats,
    listBookings,
    listTransactions,
    getEventSeatStatus,
    refundWallet,
    cancelBookingAsAdmin,
} from '../controllers/admin.controller.js'
import { logout } from '../controllers/auth.controller.js'

const router = express.Router()

router.post('/login', loginAdmin)

router.use(authenticate)
router.use(authorize('admin'))

router.get('/events', listEvents)
router.post('/events', createEvent)
router.put('/events/:id', updateEvent)
router.delete('/events/:id', deleteEvent)
router.post('/events/seats/bulk-create', bulkCreateSeats)
router.get('/events/:id/seats', getEventSeatStatus)
router.post('/wallet/refund', refundWallet)
router.post('/logout', logout)
router.get('/bookings', listBookings)
router.get('/bookings/filter', listBookings)
router.post('/bookings/:id/cancel', cancelBookingAsAdmin)
router.get('/transactions', listTransactions)

export default router
