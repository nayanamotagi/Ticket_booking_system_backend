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
    process.env.FRONTEND_URL || 'https://ticket-booking-system-frontend-5z7pjqw9k-nayanamotagis-projects.vercel.app',
    process.env.ADMIN_FRONTEND_URL || 'https://ticket-booking-admin-frontend-5ebqc472x-nayanamotagis-projects.vercel.app',
    'https://ticket-booking-system-frontend-5z7pjqw9k-nayanamotagis-projects.vercel.app',
    'https://ticket-booking-admin-frontend-5ebqc472x-nayanamotagis-projects.vercel.app',
]

const corsOptions = {
    origin(origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true)
        } else {
            callback(new Error(`CORS policy does not allow access from origin ${origin}`))
        }
    },
    credentials: true,
}

app.use(cors(corsOptions))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(morgan('dev'))

app.use(['/api/auth', '/auth'], authRoutes)
app.use('/api/events', eventRoutes)
app.use('/api/bookings', bookingRoutes)
app.use('/api/wallet', walletRoutes)
app.use('/api/admin', adminRoutes)

app.use(errorHandler)

expireReservationsJob()

export default app
