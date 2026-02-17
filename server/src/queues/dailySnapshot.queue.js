import { Queue } from "bullmq";
import IORedis from "ioredis";

import config from "../utils/config.js";

const connection = new IORedis(config.REDIS_URL, {
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
