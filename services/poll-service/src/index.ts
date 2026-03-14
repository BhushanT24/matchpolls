import { createClient } from 'redis';
import { MatchUpdate } from '../../../packages/shared/types.js';

const subscriber = createClient({ url: 'redis://infra_redis:6379' });

async function init() {
    await subscriber.connect();
    console.log("🧠 [Poll-Service] TS Listening...");

    await subscriber.subscribe('MATCH_STREAM', (message: string) => {
        const data: MatchUpdate = JSON.parse(message);
        
        // Type-safe logic: No more guessing what's in the JSON
        if (data.over.endsWith('.6') || data.isOverComplete) {
            handleOverEnd(data);
        }
    });
}

function handleOverEnd(data: MatchUpdate): void {
    console.log(`🔥 Logic Triggered for Over ${data.over}. Initializing Poll State.`);
}

init();