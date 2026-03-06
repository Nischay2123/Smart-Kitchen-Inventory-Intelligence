import { Queue } from "bullmq";
import IORedis from "ioredis";

import config from "../utils/config.js";

const connection = new IORedis(config.REDIS_URL, {
    maxRetriesPerRequest: null,
    enableOfflineQueue: false,
    retryStrategy(times) {
        if (times > 5) {
            console.error("[dailySnapshotQueue] Max reconnection attempts (5) reached. Stopping retries.");
            return null;
        }
        const delay = Math.min(1000 * Math.pow(2, times - 1), 30000);
        console.warn(`[dailySnapshotQueue] Reconnect attempt #${times}/5, retrying in ${delay}ms`);
        return delay;
    },
});

connection.on("error", (err) => {
    console.warn("[dailySnapshotQueue] Redis error:", err.message);
});

connection.on("end", () => {
    console.warn("[dailySnapshotQueue] Redis connection ended.");
});

export const dailySnapshotQueue = new Queue("daily-snapshot", {
    connection,
    defaultJobOptions: {
        attempts: 3,
        backoff: {
            type: "exponential",
            delay: 5000,
        },
        removeOnComplete: 100,
        removeOnFail: 500,
    },
});
