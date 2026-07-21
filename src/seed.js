import dotenv from 'dotenv'
import bcrypt from 'bcryptjs'
import connectDatabase from './config/db.js'
import User from './models/user.model.js'
import Event from './models/event.model.js'

dotenv.config()

const runSeed = async () => {
    await connectDatabase()

    const adminEmail = process.env.ADMIN_EMAIL || 'admin@example.com'
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123'
    const adminExists = await User.findOne({ email: adminEmail.toLowerCase().trim() })
    if (!adminExists) {
        await User.create({
            name: 'Administrator',
            email: adminEmail.toLowerCase().trim(),
            password: await bcrypt.hash(adminPassword, 10),
            role: 'admin',
            walletBalance: 0,
        })
        // eslint-disable-next-line no-console
        console.log(`Created admin user: ${adminEmail}`)
    }

    const events = [
        {
            title: 'Midnight Jazz',
            date: '2026-08-15',
            venue: 'Harbor Hall',
            price: 1800,
            totalSeats: 12,
        },
        {
            title: 'City Lights Film Night',
            date: '2026-09-02',
            venue: 'Riverside Plaza',
            price: 1400,
            totalSeats: 10,
        },
    ]

    for (const eventData of events) {
        const existing = await Event.findOne({ title: eventData.title })
        if (!existing) {
            const seats = Array.from({ length: eventData.totalSeats }, (_, index) => ({ number: index + 1, status: 'AVAILABLE' }))
            await Event.create({ ...eventData, seats })
            // eslint-disable-next-line no-console
            console.log(`Created event: ${eventData.title}`)
        }
    }

    // eslint-disable-next-line no-console
    console.log('Seed process completed.')
    process.exit(0)
}

runSeed().catch((error) => {
    // eslint-disable-next-line no-console
    console.error('Seed failed', error)
    process.exit(1)
})
