import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import User from '../models/user.model.js'

const createToken = (user) => {
    const secret = process.env.JWT_SECRET
    if (!secret) throw new Error('JWT_SECRET is required')

    return jwt.sign(
        {
            sub: user._id.toString(),
            role: user.role,
            name: user.name,
            tokenVersion: user.tokenVersion || 0,
        },
        secret,
        {
            expiresIn: '8h',
        },
    )
}

export const register = async (req, res, next) => {
    try {
        const { name, email, password } = req.body
        if (!name || !email || !password) {
            return res.status(400).json({ message: 'Name, email and password are required' })
        }

        const existing = await User.findOne({ email: email.toLowerCase().trim() })
        if (existing) {
            return res.status(409).json({ message: 'Email already registered' })
        }

        const passwordHash = await bcrypt.hash(password, 10)
        const user = await User.create({
            name,
            email: email.toLowerCase().trim(),
            password: passwordHash,
            role: 'user',
            walletBalance: 5000,
        })

        const token = createToken(user)
        res.status(201).json({ token, user: { id: user._id, name: user.name, email: user.email, role: user.role, walletBalance: user.walletBalance } })
    } catch (error) {
        next(error)
    }
}

export const login = async (req, res, next) => {
    try {
        const { email, password } = req.body
        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required' })
        }

        const user = await User.findOne({ email: email.toLowerCase().trim() })
        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials' })
        }

        const isMatch = await bcrypt.compare(password, user.password)
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials' })
        }

        const token = createToken(user)
        res.json({ token, user: { id: user._id, name: user.name, email: user.email, role: user.role, walletBalance: user.walletBalance } })
    } catch (error) {
        next(error)
    }
}

export const loginAdmin = async (req, res, next) => {
    try {
        const { email, password } = req.body
        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required' })
        }

        const user = await User.findOne({ email: email.toLowerCase().trim() })
        if (!user || user.role !== 'admin') {
            return res.status(401).json({ message: 'Invalid credentials' })
        }

        const isMatch = await bcrypt.compare(password, user.password)
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials' })
        }

        const token = createToken(user)
        res.json({ token, user: { id: user._id, name: user.name, email: user.email, role: user.role, walletBalance: user.walletBalance } })
    } catch (error) {
        next(error)
    }
}

export const logout = async (req, res, next) => {
    try {
        const user = req.user
        if (!user) {
            return res.status(401).json({ message: 'Unauthorized' })
        }

        user.tokenVersion += 1
        await user.save()

        res.json({ message: 'Logout successful' })
    } catch (error) {
        next(error)
    }
}
