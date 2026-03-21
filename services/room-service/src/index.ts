import express from 'express';
import { PrismaClient } from '@prisma/client';
import { createClient } from 'redis';

const app = express();
const prisma = new PrismaClient();
const redisClient = createClient({ url: 'redis://infra_redis:6379' });

app.use(express.json());

// --- 1. Create a New Room ---
app.post('/rooms', async (req, res) => {
    const { name, matchId, userId } = req.body;

    try {
        const room = await prisma.room.create({
            data: {
                name,
                matchId,
                createdBy: userId
            }
        });

        // Notify the system that a new room exists
        await redisClient.publish('ROOM_EVENTS', JSON.stringify({
            type: 'ROOM_CREATED',
            room
        }));

        res.status(201).json(room);
    } catch (err) {
        res.status(500).json({ error: "Failed to create room" });
    }
});

// --- 2. Get All Active Rooms ---
app.get('/rooms', async (req, res) => {
    try {
        const rooms = await prisma.room.findMany({
            orderBy: { createdAt: 'desc' }
        });
        res.json(rooms);
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch rooms" });
    }
});

// --- 3. Get Specific Room Details ---
app.get('/rooms/:id', async (req, res) => {
    try {
        const room = await prisma.room.findUnique({
            where: { id: req.params.id }
        });
        if (!room) return res.status(404).json({ error: "Room not found" });
        res.json(room);
    } catch (err) {
        res.status(500).json({ error: "Error fetching room" });
    }
});

// --- Start Service ---
app.listen(3001, async () => {
    await redisClient.connect();
    console.log("🏠 Room Service running on http://0.0.0.0:3001");
});