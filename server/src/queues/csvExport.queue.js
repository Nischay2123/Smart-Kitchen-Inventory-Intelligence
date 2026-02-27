import { Queue } from "bullmq";
import IORedis from "ioredis";
import config from "../utils/config.js";

const connection = new IORedis(config.REDIS_URL, {
    maxRetriesPerRequest: null,
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
