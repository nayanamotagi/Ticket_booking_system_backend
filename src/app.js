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
    'https://your-frontend.vercel.app',
]

app.use(cors({
    origin: [...allowedOrigins, 'https://ticket-booking-system-frontend-5z7pjqw9k-nayanamotagis-projects.vercel.app'],
    credentials: true,
}))
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
