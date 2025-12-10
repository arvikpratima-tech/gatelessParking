// https://github.com/vercel/next.js/blob/canary/examples/with-mongodb/lib/mongodb.ts
import { MongoClient } from "mongodb"
import mongoose, { Mongoose } from 'mongoose'

if (!process.env.MONGODB_URI) {
  throw new Error('Invalid/Missing environment variable: "MONGODB_URI"')
}

const uri = process.env.MONGODB_URI
type MongoClientType = MongoClient | mongoose.mongo.MongoClient
let client: MongoClientType

let globalWithMongo = global as typeof globalThis & {
    _mongooseClient?: Mongoose
}

const MAX_RETRIES = 3
const RETRY_DELAY = 1000 // 1 second

async function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms))
}

export const clientPromise = async () => {
    await connectToDB()
    return Promise.resolve<MongoClientType>(client)
}

export const connectToDB = async (retries = MAX_RETRIES): Promise<void> => {
    try {
        if (process.env.NODE_ENV === 'development') {
            if (!globalWithMongo._mongooseClient) {
                // Check if already connected
                if (mongoose.connection.readyState === 1) {
                    client = mongoose.connection.getClient()
                    return
                }
                
                globalWithMongo._mongooseClient = await mongoose.connect(uri, {
                    serverSelectionTimeoutMS: 5000,
                    socketTimeoutMS: 45000,
                })
            }

            client = globalWithMongo._mongooseClient.connection.getClient()
            
            // Ensure connection is ready
            if (mongoose.connection.readyState !== 1) {
                await mongoose.connection.asPromise()
            }
        } else {
            // Production: check if already connected
            if (mongoose.connection.readyState === 1) {
                client = mongoose.connection.getClient()
                return
            }
            
            let _client = await mongoose.connect(uri, {
                serverSelectionTimeoutMS: 5000,
                socketTimeoutMS: 45000,
            })
            client = _client.connection.getClient()
        }
        
        // Create indexes on first connection
        await ensureIndexes()
    } catch (error) {
        console.error('MongoDB connection error:', error)
        
        if (retries > 0) {
            console.log(`Retrying connection... (${MAX_RETRIES - retries + 1}/${MAX_RETRIES})`)
            await sleep(RETRY_DELAY)
            return connectToDB(retries - 1)
        }
        
        throw error
    }
}

async function ensureIndexes() {
    try {
        // Ensure geospatial index for parking locations
        const { ParkingLocationModel } = await import('@/schemas/parking-locations')
        await ParkingLocationModel.collection.createIndex(
            { location: '2dsphere' },
            { background: true }
        ).catch(() => {
            // Index might already exist, that's fine
        })
    } catch (error) {
        // Non-fatal - indexes will be created eventually
        console.warn('Index creation warning (non-fatal):', error)
    }
}