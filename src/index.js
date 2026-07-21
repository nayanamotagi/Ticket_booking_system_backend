import dotenv from 'dotenv'
import app from './app.js'
import connectDatabase from './config/db.js'

dotenv.config()

const PORT = process.env.PORT || 4000

async function start() {
    await connectDatabase()
    app.listen(PORT, () => {
        // eslint-disable-next-line no-console
        console.log(`Ticket booking backend listening on http://localhost:${PORT}`)
    })
}

start().catch((error) => {
    // eslint-disable-next-line no-console
    console.error('Server startup failed:', error)
    process.exit(1)
})
