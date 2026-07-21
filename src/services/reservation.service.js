import Booking from '../models/booking.model.js'
import Event from '../models/event.model.js'

export const expireReservationsJob = () => {
    const releaseExpired = async () => {
        const now = Date.now()
        const expiredBookings = await Booking.find({ status: 'RESERVED', expiresAt: { $lte: now } })

        if (!expiredBookings.length) return

        const eventUpdates = new Map()
        expiredBookings.forEach((booking) => {
            const stored = eventUpdates.get(booking.eventId.toString()) || new Set()
            booking.seatIds.forEach((seatId) => stored.add(seatId))
            eventUpdates.set(booking.eventId.toString(), stored)
        })

        const session = await Booking.startSession()
        try {
            session.startTransaction()
            await Booking.updateMany({ _id: { $in: expiredBookings.map((booking) => booking._id) } }, { status: 'EXPIRED' }).session(session)

            for (const [eventId, seatSet] of eventUpdates.entries()) {
                const event = await Event.findById(eventId).session(session)
                if (!event) continue
                event.seats = event.seats.map((seat) => (seatSet.has(seat.number) && seat.status === 'RESERVED' ? { ...seat.toObject(), status: 'AVAILABLE' } : seat))
                await event.save({ session })
            }
            await session.commitTransaction()
        } catch (error) {
            await session.abortTransaction()
            // eslint-disable-next-line no-console
            console.error('Failed to expire reservations', error)
        } finally {
            session.endSession()
        }
    }

    setInterval(releaseExpired, 60 * 1000)
}
