import mongoose from 'mongoose'

const bookingSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
    seatIds: [{ type: Number, required: true }],
    seatNumbers: [{ type: Number, required: true }],
    amount: { type: Number, required: true },
    status: {
        type: String,
        required: true,
        enum: ['RESERVED', 'BOOKED', 'CANCELLED', 'EXPIRED'],
        default: 'RESERVED',
    },
    expiresAt: { type: Number, required: true },
}, { timestamps: true })

const Booking = mongoose.model('Booking', bookingSchema)
export default Booking
