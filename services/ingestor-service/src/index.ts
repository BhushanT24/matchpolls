import { createClient } from 'redis';
import { MatchUpdate } from '../../../packages/shared/types.js';

const client = createClient({ url: 'redis://infra_redis:6379' });

async function run(): Promise<void> {
    await client.connect();
    console.log("🚀 [Ingestor] TS Service Connected");

    setInterval(async () => {
        const payload: MatchUpdate = {
            matchId: "IPL_2026_FINAL",
            score: "145/3",
            over: "18.5", // Let's simulate near end of over
            ball_in_over: 5,
            isOverComplete: false,
            timestamp: Date.now()
        };

        await client.publish('MATCH_STREAM', JSON.stringify(payload));
        console.log(`📢 Broadcasted Over: ${payload.over}`);
    }, 5000);
}

run().catch(err => console.error("Critical Failure:", err));