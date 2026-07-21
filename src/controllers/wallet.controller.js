import mongoose from 'mongoose'
import Transaction from '../models/transaction.model.js'
import User from '../models/user.model.js'

export const topUpWallet = async (req, res, next) => {
    const session = await mongoose.startSession()
    try {
        const { amount } = req.body
        const cents = Number(amount)
        if (!Number.isInteger(cents) || cents <= 0) {
            return res.status(400).json({ message: 'Amount must be a positive integer in cents' })
        }

        session.startTransaction()
        const user = await User.findById(req.user._id).session(session)
        user.walletBalance += cents
        await user.save({ session })

        await Transaction.create([{
            userId: user._id,
            type: 'CREDIT',
            amount: cents,
            note: 'Wallet top-up',
        }], { session })

        await session.commitTransaction()
        res.json({ walletBalance: user.walletBalance })
    } catch (error) {
        await session.abortTransaction()
        next(error)
    } finally {
        session.endSession()
    }
}

export const transferWallet = async (req, res, next) => {
    const session = await mongoose.startSession()
    try {
        const { recipientEmail, amount } = req.body
        const cents = Number(amount)
        if (!recipientEmail || !Number.isInteger(cents) || cents <= 0) {
            return res.status(400).json({ message: 'Recipient email and positive integer amount are required' })
        }

        if (recipientEmail.toLowerCase().trim() === req.user.email.toLowerCase()) {
            return res.status(400).json({ message: 'Cannot transfer to yourself' })
        }

        session.startTransaction()
        const sender = await User.findOne({ _id: req.user._id, walletBalance: { $gte: cents } }).session(session)
        if (!sender) {
            await session.abortTransaction()
            return res.status(400).json({ message: 'Insufficient wallet balance' })
        }

        const recipient = await User.findOne({ email: recipientEmail.toLowerCase().trim() }).session(session)
        if (!recipient) {
            await session.abortTransaction()
            return res.status(404).json({ message: 'Recipient not found' })
        }

        sender.walletBalance -= cents
        recipient.walletBalance += cents
        await sender.save({ session })
        await recipient.save({ session })

        await Transaction.create([{
            userId: sender._id,
            type: 'TRANSFER_OUT',
            amount: cents,
            note: `Transferred ${cents} cents to ${recipient.email}`,
        }, {
            userId: recipient._id,
            type: 'TRANSFER_IN',
            amount: cents,
            note: `Received ${cents} cents from ${sender.email}`,
        }], { session })

        await session.commitTransaction()
        res.json({ walletBalance: sender.walletBalance })
    } catch (error) {
        await session.abortTransaction()
        next(error)
    } finally {
        session.endSession()
    }
}

export const getTransactions = async (req, res, next) => {
    try {
        const transactions = await Transaction.find({ userId: req.user._id }).sort({ createdAt: -1 })
        res.json(transactions)
    } catch (error) {
        next(error)
    }
}
