import mongoose from 'mongoose'

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    role: { type: String, required: true, enum: ['user', 'admin'], default: 'user' },
    walletBalance: { type: Number, required: true, default: 0 },
    tokenVersion: { type: Number, required: true, default: 0 },
}, { timestamps: true })

const User = mongoose.model('User', userSchema)
export default User
