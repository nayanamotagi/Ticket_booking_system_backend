import mongoose from 'mongoose'
import Booking from '../models/booking.model.js'
import Event from '../models/event.model.js'
import Transaction from '../models/transaction.model.js'
import User from '../models/user.model.js'

const RESERVATION_MS = 5 * 60 * 1000

const validateSeatNumbers = (event, seatNumbers) => {
    const available = event.seats.filter((seat) => seatNumbers.includes(seat.number) && seat.status === 'AVAILABLE')
    return available.length === seatNumbers.length
}

export const reserveSeats = async (req, res, next) => {
    const session = await mongoose.startSession()
    try {
        const { eventId, seatNumbers } = req.body
        if (!eventId || !Array.isArray(seatNumbers) || seatNumbers.length === 0) {
            return res.status(400).json({ message: 'Event ID and seatNumbers are required' })
        }

        session.startTransaction()
        const event = await Event.findById(eventId).session(session)
        if (!event) {
            await session.abortTransaction()
            return res.status(404).json({ message: 'Event not found' })
        }

        if (!validateSeatNumbers(event, seatNumbers)) {
            await session.abortTransaction()
            return res.status(409).json({ message: 'Selected seats are unavailable' })
        }

        const amount = seatNumbers.length * event.price
        if (req.user.walletBalance < amount) {
            await session.abortTransaction()
            return res.status(400).json({ message: 'Insufficient wallet balance to reserve seats' })
        }

        event.seats = event.seats.map((seat) => (seatNumbers.includes(seat.number) ? { ...seat.toObject(), status: 'RESERVED' } : seat))
        await event.save({ session })

        const booking = await Booking.create([{
            userId: req.user._id,
            eventId: event._id,
            seatIds: seatNumbers,
            seatNumbers,
            amount,
            status: 'RESERVED',
            expiresAt: Date.now() + RESERVATION_MS,
        }], { session })

        await session.commitTransaction()
        res.status(201).json({ booking: booking[0] })
    } catch (error) {
        await session.abortTransaction()
        next(error)
    } finally {
        session.endSession()
    }
}

export const confirmBooking = async (req, res, next) => {
    const session = await mongoose.startSession()
    try {
        const { bookingId } = req.body
        if (!bookingId) {
            return res.status(400).json({ message: 'Booking ID is required' })
        }

        session.startTransaction()
        const booking = await Booking.findById(bookingId).session(session)
        if (!booking || booking.userId.toString() !== req.user._id.toString()) {
            await session.abortTransaction()
            return res.status(404).json({ message: 'Booking not found' })
        }

        if (booking.status !== 'RESERVED') {
            await session.abortTransaction()
            return res.status(409).json({ message: 'Booking is not in a reservable state' })
        }
        if (booking.expiresAt <= Date.now()) {
            booking.status = 'EXPIRED'
            await booking.save({ session })
            await session.abortTransaction()
            return res.status(410).json({ message: 'Reservation has expired' })
        }

        const event = await Event.findById(booking.eventId).session(session)
        if (!event) {
            await session.abortTransaction()
            return res.status(404).json({ message: 'Event not found for booking' })
        }

        const reservedSeats = event.seats.filter((seat) => booking.seatNumbers.includes(seat.number) && seat.status === 'RESERVED')
        if (reservedSeats.length !== booking.seatNumbers.length) {
            await session.abortTransaction()
            return res.status(409).json({ message: 'One or more seats are no longer reserved' })
        }

        const user = await User.findOne({ _id: req.user._id, walletBalance: { $gte: booking.amount } }).session(session)
        if (!user) {
            await session.abortTransaction()
            return res.status(400).json({ message: 'Insufficient wallet balance' })
        }

        user.walletBalance -= booking.amount
        await user.save({ session })

        event.seats = event.seats.map((seat) => (booking.seatNumbers.includes(seat.number) ? { ...seat.toObject(), status: 'BOOKED' } : seat))
        await event.save({ session })

        booking.status = 'BOOKED'
        await booking.save({ session })

        await Transaction.create([{
            userId: user._id,
            bookingId: booking._id,
            eventId: event._id,
            type: 'DEBIT',
            amount: booking.amount,
            note: `Booked ${booking.seatNumbers.length} seat(s) for ${event.title}`,
        }], { session })

        await session.commitTransaction()
        res.json({ booking })
    } catch (error) {
        await session.abortTransaction()
        next(error)
    } finally {
        session.endSession()
    }
}

export const listBookings = async (req, res, next) => {
    try {
        const bookings = await Booking.find({ userId: req.user._id }).sort({ createdAt: -1 })
        res.json(bookings)
    } catch (error) {
        next(error)
    }
}

export const cancelBooking = async (req, res, next) => {
    const session = await mongoose.startSession()
    try {
        const { id } = req.params
        session.startTransaction()

        const booking = await Booking.findById(id).session(session)
        if (!booking || booking.userId.toString() !== req.user._id.toString()) {
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
            const user = await User.findById(req.user._id).session(session)
            user.walletBalance += booking.amount
            await user.save({ session })

            await Transaction.create([{
                userId: user._id,
                bookingId: booking._id,
                eventId: event._id,
                type: 'REFUND',
                amount: booking.amount,
                note: 'Refund for cancelled booking',
            }], { session })
        }

        await session.commitTransaction()
        res.json({ message: 'Booking cancelled', booking })
    } catch (error) {
        await session.abortTransaction()
        next(error)
    } finally {
        session.endSession()
    }
}
