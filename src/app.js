import express from 'express'
import cors from 'cors'
import morgan from 'morgan'
import authRoutes from './routes/auth.routes.js'
import eventRoutes from './routes/event.routes.js'
import bookingRoutes from './routes/booking.routes.js'
import walletRoutes from './routes/wallet.routes.js'
import adminRoutes from './routes/admin.routes.js'
import { errorHandler } from './middleware/error.middleware.js'
import { expireReservationsJob } from './services/reservation.service.js'

const app = express()

const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:4173',
    'https://ticket-booking-admin-frontend-oxyus8r8e-nayanamotagis-projects.vercel.app',
    'https://ticket-booking-system-frontend.vercel.app',
]

const allowedOriginPatterns = [
    /^https:\/\/ticket-booking-system-frontend(?:-[^.]+)?\.vercel\.app$/,
    /^https:\/\/ticket-booking-admin-frontend(?:-[^.]+)?\.vercel\.app$/,
]

const corsOptions = {
    origin(origin, callback) {
        const isAllowedOrigin =
            !origin ||
            allowedOrigins.includes(origin) ||
            allowedOriginPatterns.some((pattern) => pattern.test(origin))

        if (isAllowedOrigin) {
            return callback(null, true)
        }

        console.error('Blocked Origin:', origin)

        callback(new Error(`CORS policy does not allow access from origin ${origin}`))
    },
    credentials: true,
}

app.use(cors(corsOptions))
app.options('*', cors(corsOptions))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(morgan('dev'))

app.use(['/api/auth', '/auth'], authRoutes)
app.use('/api/events', eventRoutes)
app.use('/api/bookings', bookingRoutes)
app.use('/api/wallet', walletRoutes)
app.use('/api/admin', adminRoutes)

app.get('/', (req, res) => {
    res.status(200).json({ message: 'Ticket booking backend is running' })
})

app.use(errorHandler)

expireReservationsJob()

export default app
