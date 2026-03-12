import { Queue } from "bullmq";
import { redisManager } from "../utils/redis/redisManager.js";

const connection = redisManager.getConnection("QUEUE_PRODUCER");

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