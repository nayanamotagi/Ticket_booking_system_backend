import express from 'express'
import { authenticate, authorize } from '../middleware/auth.middleware.js'
import {
    createEvent,
    updateEvent,
    deleteEvent,
    bulkCreateSeats,
    listBookings,
    listTransactions,
    cancelBookingAsAdmin,
} from '../controllers/admin.controller.js'

const router = express.Router()

router.use(authenticate)
router.use(authorize('admin'))

router.post('/events', createEvent)
router.put('/events/:id', updateEvent)
router.delete('/events/:id', deleteEvent)
router.post('/events/seats/bulk-create', bulkCreateSeats)
router.get('/bookings', listBookings)
router.post('/bookings/:id/cancel', cancelBookingAsAdmin)
router.get('/transactions', listTransactions)

export default router
