import mongoose from 'mongoose'
import Event from '../models/event.model.js'
import Booking from '../models/booking.model.js'
import Transaction from '../models/transaction.model.js'
import User from '../models/user.model.js'

export const createEvent = async (req, res, next) => {
    try {
        const { title, date, venue, price, totalSeats } = req.body
        if (!title || !date || !venue || !Number.isInteger(price) || price <= 0 || !Number.isInteger(totalSeats) || totalSeats <= 0) {
            return res.status(400).json({ message: 'Event title, date, venue, price and totalSeats are required' })
        }

        const seats = Array.from({ length: totalSeats }, (_, index) => ({ number: index + 1, status: 'AVAILABLE' }))
        const event = await Event.create({ title, date, venue, price, totalSeats, seats })
        res.status(201).json(event)
    } catch (error) {
        next(error)
    }
}

export const updateEvent = async (req, res, next) => {
    try {
        const event = await Event.findById(req.params.id)
        if (!event) return res.status(404).json({ message: 'Event not found' })

        const { title, date, venue, price } = req.body
        if (title) event.title = title
        if (date) event.date = date
        if (venue) event.venue = venue
        if (Number.isInteger(price) && price > 0) event.price = price

        await event.save()
        res.json(event)
    } catch (error) {
        next(error)
    }
}

export const deleteEvent = async (req, res, next) => {
    try {
        const event = await Event.findByIdAndDelete(req.params.id)
        if (!event) return res.status(404).json({ message: 'Event not found' })
        await Booking.deleteMany({ eventId: event._id })
        await Transaction.deleteMany({ eventId: event._id })
        res.json({ message: 'Event deleted' })
    } catch (error) {
        next(error)
    }
}

export const bulkCreateSeats = async (req, res, next) => {
    try {
        const { eventId, count } = req.body
        if (!eventId || !Number.isInteger(count) || count <= 0) {
            return res.status(400).json({ message: 'Event ID and positive seat count are required' })
        }

        const event = await Event.findById(eventId)
        if (!event) return res.status(404).json({ message: 'Event not found' })

        const currentCount = event.seats.length
        const newSeats = Array.from({ length: count }, (_, index) => ({ number: currentCount + index + 1, status: 'AVAILABLE' }))
        event.seats.push(...newSeats)
        event.totalSeats = event.seats.length
        await event.save()
        res.json(event)
    } catch (error) {
        next(error)
    }
}

export const listBookings = async (req, res, next) => {
    try {
        const { userId, eventId, status } = req.query
        const query = {}
        if (userId) query.userId = userId
        if (eventId) query.eventId = eventId
        if (status) query.status = status

        const bookings = await Booking.find(query).sort({ createdAt: -1 })
        res.json(bookings)
    } catch (error) {
        next(error)
    }
}

export const listTransactions = async (req, res, next) => {
    try {
        const { userId, eventId, type } = req.query
        const query = {}
        if (userId) query.userId = userId
        if (eventId) query.eventId = eventId
        if (type) query.type = type

        const transactions = await Transaction.find(query).sort({ createdAt: -1 })
        res.json(transactions)
    } catch (error) {
        next(error)
    }
}

export const cancelBookingAsAdmin = async (req, res, next) => {
    const session = await mongoose.startSession()
    try {
        session.startTransaction()
        const booking = await Booking.findById(req.params.id).session(session)
        if (!booking) {
            await session.abortTransaction()
            return res.status(404).json({ message: 'Booking not found' })
        }
        if (booking.status === 'CANCELLED' || booking.status === 'EXPIRED') {
            await session.abortTransaction()
            return res.status(409).json({ message: 'Booking cannot be cancelled' })
        }

        const event = await Event.findById(booking.eventId).session(session)
        if (!event) {
            await session.abortTransaction()
            return res.status(404).json({ message: 'Event not found' })
        }

        const wasBooked = booking.status === 'BOOKED'
        event.seats = event.seats.map((seat) => (booking.seatNumbers.includes(seat.number) ? { ...seat.toObject(), status: 'AVAILABLE' } : seat))
        await event.save({ session })

        booking.status = 'CANCELLED'
        await booking.save({ session })

        if (wasBooked) {
            const user = await User.findById(booking.userId).session(session)
            user.walletBalance += booking.amount
            await user.save({ session })

            await Transaction.create([{
                userId: user._id,
                bookingId: booking._id,
                eventId: event._id,
                type: 'REFUND',
                amount: booking.amount,
                note: 'Admin refund for cancelled booking',
            }], { session })
        }

        await session.commitTransaction()
        res.json({ message: 'Booking cancelled by admin', booking })
    } catch (error) {
        await session.abortTransaction()
        next(error)
    } finally {
        session.endSession()
    }
}
