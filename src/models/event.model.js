import mongoose from 'mongoose'

const seatSchema = new mongoose.Schema({
    number: { type: Number, required: true },
    status: {
        type: String,
        required: true,
        enum: ['AVAILABLE', 'RESERVED', 'BOOKED'],
        default: 'AVAILABLE',
    },
}, { _id: false })

const eventSchema = new mongoose.Schema({
    title: { type: String, required: true },
    date: { type: String, required: true },
    venue: { type: String, required: true },
    price: { type: Number, required: true },
    totalSeats: { type: Number, required: true },
    seats: { type: [seatSchema], required: true, default: [] },
}, { timestamps: true })

const Event = mongoose.model('Event', eventSchema)
export default Event
