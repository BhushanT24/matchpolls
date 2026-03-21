import { createClient } from 'redis';
import { MatchUpdateSchema, type MatchUpdate } from '../../packages/shared/types.js';

const REDIS_URL = process.env.REDIS_URL || 'redis://infra_redis:6379';
const publisher = createClient({ url: REDIS_URL });

// Simulation function: In production, this replaces an Axios call to a Sports API
const fetchExternalData = (): Partial<MatchUpdate> => {
  return {
    matchId: "live-001",
    homeTeam: "India",
    awayTeam: "Australia",
    score: `${Math.floor(Math.random() * 300)}/2`,
    event: "Live Coverage",
    timestamp: Date.now(),
  };
};

const startIngestion = async () => {
  await publisher.connect();
  console.log("📥 Ingestor Service connected to Redis");

  // Polling Loop (Production: Use a proper scheduler or webhook)
  setInterval(async () => {
    try {
      const rawData = fetchExternalData();

      // PRODUCTION STEP: Validate data before it touches the rest of your system
      const validation = MatchUpdateSchema.safeParse(rawData);

      if (validation.success) {
        await publisher.publish('MATCH_STREAM', JSON.stringify(validation.data));
        console.log(`✅ Published update for ${validation.data.matchId}`);
      } else {
        console.error("❌ Invalid data received from API:", validation.error.format());
      }
    } catch (error) {
      console.error("⚠️ Ingestion Error:", error);
    }
  }, 5000); // Fetch every 5 seconds
};

// Graceful Shutdown
const handleShutdown = async () => {
  console.log("Shutting down Ingestor...");
  await publisher.quit();
  process.exit(0);
};

process.on('SIGINT', handleShutdown);
process.on('SIGTERM', handleShutdown);

startIngestion();