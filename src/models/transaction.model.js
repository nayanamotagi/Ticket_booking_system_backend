import mongoose from 'mongoose'

const transactionSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    bookingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking' },
    eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event' },
    type: {
        type: String,
        required: true,
        enum: ['CREDIT', 'DEBIT', 'TRANSFER_IN', 'TRANSFER_OUT', 'REFUND'],
    },
    amount: { type: Number, required: true },
    note: { type: String, required: true },
}, { timestamps: true })

const Transaction = mongoose.model('Transaction', transactionSchema)
export default Transaction
