import { Queue } from "bullmq";
import IORedis from "ioredis";

import config from "../utils/config.js";

const connection = new IORedis(config.REDIS_URL, {
  maxRetriesPerRequest: null,
});

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
