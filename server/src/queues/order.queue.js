import { Queue } from "bullmq";
import { redisManager } from "../utils/redis/redisManager.js";

const connection = redisManager.getConnection("QUEUE_PRODUCER");

export const orderQueue = new Queue("orders", {
  connection,
  defaultJobOptions: {
    attempts: 5,
    backoff: {
      type: "exponential",
      delay: 1000,
    },
    removeOnComplete: 100,
    removeOnFail: 1000,
  },
});
