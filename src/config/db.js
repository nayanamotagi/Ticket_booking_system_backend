import dns from 'dns'
import mongoose from 'mongoose'

const connectDatabase = async () => {
    const uri = process.env.MONGO_URI
    if (!uri) {
        throw new Error('MONGO_URI is required in environment variables')
    }

    if (uri.startsWith('mongodb+srv://')) {
        dns.setServers(['8.8.8.8', '1.1.1.1'])
    }

    await mongoose.connect(uri, {
        autoIndex: true,
        serverSelectionTimeoutMS: 5000,
        connectTimeoutMS: 10000,
    })
}

export default connectDatabase
