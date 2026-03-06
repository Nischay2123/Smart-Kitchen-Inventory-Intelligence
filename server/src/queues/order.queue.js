import { Queue } from "bullmq";
import IORedis from "ioredis";

import config from "../utils/config.js";
import { sendRedisDownAlertEmail } from "../utils/emailAlert.js";

let redisDownEmailSent = false;

const connection = new IORedis(config.REDIS_URL, {
  maxRetriesPerRequest: 0,
  enableOfflineQueue: false, 
  retryStrategy: () => null,
  connectTimeout: 2000
});

connection.on("connect", () => {
  console.log("[orderQueue] REDIS CONNECTED");
  redisDownEmailSent = false; 
});

connection.on("error", (err) => {
  console.error("[orderQueue] REDIS ERROR:", err.message, redisDownEmailSent ? "(Alert already sent)" : "(Sending alert)");
  
  if (!redisDownEmailSent) {
    redisDownEmailSent = true;
    
    sendRedisDownAlertEmail(err)
      .then(() => {
        console.log("📧 [orderQueue] Redis down notification email sent");
      })
      .catch((emailErr) => {
        console.error("[orderQueue] Failed to send Redis down email:", emailErr.message);
        console.error("[orderQueue] Full error:", emailErr);
      });
  }
});

connection.on("end", () => {
  console.warn("[orderQueue] Redis connection ended.");
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
