import dotenv from 'dotenv'
import app from './app.js'
import connectDatabase from './config/db.js'

dotenv.config()

const BASE_PORT = parseInt(process.env.PORT, 10) || 5000
const MAX_PORT_RETRIES = 50

const listen = (port) => new Promise((resolve, reject) => {
    const server = app.listen(port, () => resolve(server))
    server.on('error', reject)
})

async function start() {
    await connectDatabase()

    let lastError = null
    for (let i = 0; i < MAX_PORT_RETRIES; i += 1) {
        const port = BASE_PORT + i
        try {
            const server = await listen(port)
            const actualPort = server.address().port
            // eslint-disable-next-line no-console
            console.log(`Ticket booking backend listening on http://localhost:${actualPort}`)
            return
        } catch (error) {
            if (error.code === 'EADDRINUSE') {
                // eslint-disable-next-line no-console
                console.warn(`Port ${port} is already in use. Trying next port...`)
                lastError = error
                continue
            }
            lastError = error
            break
        }
    }

    // eslint-disable-next-line no-console
    console.warn(`All ports ${BASE_PORT}-${BASE_PORT + MAX_PORT_RETRIES - 1} are busy. Trying dynamic port...`)
    try {
        const server = await listen(0)
        const actualPort = server.address().port
        // eslint-disable-next-line no-console
        console.log(`Ticket booking backend listening on http://localhost:${actualPort}`)
        return
    } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Server startup failed:', error)
        process.exit(1)
    }
}

start().catch((error) => {
    // eslint-disable-next-line no-console
    console.error('Server startup failed:', error)
    process.exit(1)
})
