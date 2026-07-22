import jwt from 'jsonwebtoken'
import User from '../models/user.model.js'

export const authenticate = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization || ''
        const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null
        if (!token) {
            return res.status(401).json({ message: 'Missing authorization token' })
        }

        const secret = process.env.JWT_SECRET
        if (!secret) throw new Error('JWT_SECRET is required')

        const payload = jwt.verify(token, secret)
        const user = await User.findById(payload.sub)
        if (!user) return res.status(401).json({ message: 'Invalid token payload' })

        const tokenVersion = typeof payload.tokenVersion === 'number' ? payload.tokenVersion : 0
        if (tokenVersion !== user.tokenVersion) {
            return res.status(401).json({ message: 'Token has been revoked' })
        }

        req.user = user
        next()
    } catch (error) {
        return res.status(401).json({ message: 'Unauthorized access', details: error.message })
    }
}

export const authorize = (...allowedRoles) => (req, res, next) => {
    if (!req.user) return res.status(401).json({ message: 'Unauthorized' })
    if (!allowedRoles.includes(req.user.role)) {
        return res.status(403).json({ message: 'Forbidden' })
    }
    next()
}
