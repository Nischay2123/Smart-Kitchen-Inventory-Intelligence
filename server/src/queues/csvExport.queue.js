import { Queue } from "bullmq";
import IORedis from "ioredis";
import config from "../utils/config.js";

const connection = new IORedis(config.REDIS_URL, {
    maxRetriesPerRequest: null,
    enableOfflineQueue: false,
    retryStrategy(times) {
        const delay = Math.min(times * 50, 2000);
        return delay;
    },
});

export const csvExportQueue = new Queue("csv-export", {
    connection,
    defaultJobOptions: {
        attempts: 3,
        backoff: {
            type: "exponential",
            delay: 2000,
        },
        removeOnComplete: 50,
        removeOnFail: 200,
    },
});

connection.on("error", (err) => {
    console.error("Redis connection error in CSV Export Queue");
});