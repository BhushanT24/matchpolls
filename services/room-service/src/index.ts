import express, { Request, Response } from 'express';
import { createClient } from 'redis';
import mongoose from 'mongoose';

// 1. CONFIGURATION
const PORT = process.env.PORT || 3000;
const REDIS_URL = process.env.REDIS_URL || 'redis://infra_redis:6379';
const MONGO_URI = process.env.MONGO_URI || 'mongodb://infra_mongo:27017/app_database';

const app = express();
app.use(express.json());

// 2. REDIS & MONGO SETUP
const redisClient = createClient({ url: REDIS_URL });

async function initialize() {
    try {
        // Connect to MongoDB
        await mongoose.connect(MONGO_URI);
        console.log('🍃 [Service-C] Successfully connected to MongoDB');

        // Connect to Redis
        await redisClient.connect();
        console.log('🚀 [Service-C] Successfully connected to Redis');

        // 3. EVENT SUBSCRIBER
        // We create a duplicate client specifically for subscribing to events
        const subscriber = redisClient.duplicate();
        await subscriber.connect();

        await subscriber.subscribe('INTERNAL_STREAM', (message) => {
            const eventData = JSON.parse(message);
            console.log('📥 [Service-C] Processing event:', eventData);
            
            // Logic to persist eventData to MongoDB would go here
        });

        // 4. HEALTH CHECK (Critical for Docker/K8s)
        app.get('/health', (req: Request, res: Response) => {
            const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
            res.status(200).json({
                status: 'UP',
                database: dbStatus,
                service: 'service-c',
                timestamp: new Date().toISOString()
            });
        });

        // 5. GENERIC API ROUTE
        app.get('/data', async (req: Request, res: Response) => {
            res.json({ message: "Service-C Data Endpoint Active" });
        });

        app.listen(PORT, () => {
            console.log(`✅ [Service-C] Server running on port ${PORT}`);
        });

    } catch (error) {
        console.error('❌ [Service-C] Failed to initialize:', error);
        process.exit(1);
    }
}

// 6. GRACEFUL SHUTDOWN
// This tells the service to close connections before the container stops
const gracefulShutdown = async () => {
    console.log('🛑 [Service-C] Shutting down gracefully...');
    await mongoose.connection.close();
    await redisClient.quit();
    process.exit(0);
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

initialize();