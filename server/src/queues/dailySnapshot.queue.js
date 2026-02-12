import { Queue } from "bullmq";
import IORedis from "ioredis";

const connection = new IORedis({
    maxRetriesPerRequest: null,
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
