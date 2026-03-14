import express, { Request, Response } from 'express';
import { createClient } from 'redis';
import cors from 'cors';
import { MatchUpdate } from '../../packages/shared/types.js';

const app = express();
const PORT = 8080;

app.use(cors());
app.use(express.json());

const subscriber = createClient({ url: 'redis://infra_redis:6379' });

// --- SSE Endpoint ---
// This is what the frontend connects to: new EventSource('/stream')
app.get('/stream', async (req: Request, res: Response) => {
    // 1. Set Headers for SSE
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    console.log("🔌 Client connected to SSE stream");

    // 2. Subscribe to internal Redis events
    const localSubscriber = subscriber.duplicate();
    await localSubscriber.connect();

    await localSubscriber.subscribe('MATCH_STREAM', (message) => {
        // 3. Push data to the client
        res.write(`data: ${message}\n\n`);
    });

    // 4. Clean up when client disconnects
    req.on('close', () => {
        console.log("❌ Client disconnected");
        localSubscriber.quit();
    });
});

app.listen(PORT, async () => {
    await subscriber.connect();
    console.log(`🚀 Gateway running on http://localhost:${PORT}`);
});