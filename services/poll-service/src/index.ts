import { createClient } from 'redis';
import { PrismaClient } from '@prisma/client';
import { MatchUpdateSchema, type MatchUpdate } from '../../../packages/shared/types.js';

// 1. Initialize Clients
const prisma = new PrismaClient();
const subscriber = createClient({ url: 'redis://infra_redis:6379' });

async function startPersistence() {
    try {
        // Connect to Redis
        await subscriber.connect();
        console.log("💾 [Persistence] Poll Service linked to Redis");

        // Connect to Postgres
        await prisma.$connect();
        console.log("🐘 [Persistence] Database connection established");

        // 2. Subscribe to the Match Stream
        await subscriber.subscribe('MATCH_STREAM', async (message) => {
            try {
                // Validate incoming data using our shared Zod schema
                const rawData = JSON.parse(message);
                const data: MatchUpdate = MatchUpdateSchema.parse(rawData);

                // 3. PRODUCTION LOGIC: Atomic Upsert
                // We use upsert to prevent primary key conflicts and keep data fresh
                const savedMatch = await prisma.match.upsert({
                    where: { id: data.matchId },
                    update: {
                        runs: data.runs,
                        wickets: data.wickets,
                        over: data.over,
                        ball_in_over: data.ball_in_over,
                        isOverComplete: data.isOverComplete,
                        timestamp: BigInt(data.timestamp), // BigInt for high-precision timestamps
                    },
                    create: {
                        id: data.matchId,
                        homeTeam: data.homeTeam || "Unknown",
                        awayTeam: data.awayTeam || "Unknown",
                        runs: data.runs,
                        wickets: data.wickets,
                        over: data.over,
                        ball_in_over: data.ball_in_over,
                        isOverComplete: data.isOverComplete,
                        timestamp: BigInt(data.timestamp),
                    },
                });

                console.log(`✅ [DB Saved] ${savedMatch.id} | ${data.runs}/${data.wickets} (${data.over}.${data.ball_in_over})`);

                // 4. Trigger Poll Resolution if over is complete
                if (data.isOverComplete) {
                    await resolveActivePolls(data.matchId, data.over, data.runs);
                }

            } catch (err) {
                console.error("❌ [Validation/DB Error] Failed to persist update:", err);
            }
        });

    } catch (err) {
        console.error("🚨 [Critical] Persistence Service failed to start:", err);
        process.exit(1);
    }
}

// Placeholder for the resolution logic we'll build next
async function resolveActivePolls(matchId: string, overNumber: number, currentTotalRuns: number) {
    console.log(`🧐 [Poll Resolver] Over ${overNumber} finished. Logic for calculating winners goes here.`);
}

// 5. Graceful Shutdown
const shutdown = async () => {
    console.log("\nStopping Persistence Service...");
    await subscriber.quit();
    await prisma.$disconnect();
    process.exit(0);
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

startPersistence();