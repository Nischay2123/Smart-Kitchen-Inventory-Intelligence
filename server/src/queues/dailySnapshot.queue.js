import { Queue } from "bullmq";
import { redisManager } from "../utils/redis/redisManager.js";

const connection = redisManager.getConnection("QUEUE_PRODUCER");

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
