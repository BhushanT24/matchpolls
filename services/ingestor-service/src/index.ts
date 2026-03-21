import { createClient } from 'redis';
import { MatchUpdateSchema, type MatchUpdate } from '../../../packages/shared/types.js';

const client = createClient({ url: 'redis://infra_redis:6379' });

// Internal state for simulation
let currentRuns = 145;
let currentWickets = 3;
let currentOver = 18;
let currentBall = 5;

async function run(): Promise<void> {
    await client.connect();
    console.log("🚀 [Ingestor] Production-Ready Service Connected");

    setInterval(async () => {
        // 1. Simulate Match Progress
        currentBall++;
        if (currentBall > 6) {
            currentBall = 1;
            currentOver++;
        }

        // Randomly add runs (0-6) or a wicket (1% chance)
        const runScored = Math.floor(Math.random() * 7);
        currentRuns += runScored;
        
        if (Math.random() > 0.98 && currentWickets < 10) {
            currentWickets++;
        }

        const payload: MatchUpdate = {
            matchId: "IPL_2026_FINAL",
            homeTeam: "MI",
            awayTeam: "CSK",
            runs: currentRuns,
            wickets: currentWickets,
            over: currentOver,
            ball_in_over: currentBall,
            isOverComplete: currentBall === 6,
            timestamp: Date.now()
        };

        // 2. Validate with Zod before Publishing
        const validation = MatchUpdateSchema.safeParse(payload);
        
        if (validation.success) {
            await client.publish('MATCH_STREAM', JSON.stringify(validation.data));
            console.log(`📢 Broadcast: ${payload.over}.${payload.ball_in_over} | Score: ${payload.runs}/${payload.wickets}`);
        } else {
            console.error("❌ Validation Failed:", validation.error.format());
        }
    }, 5000);
}

run().catch(err => console.error("Critical Failure:", err));