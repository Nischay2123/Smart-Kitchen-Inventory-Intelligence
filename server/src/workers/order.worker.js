import { Worker } from "bullmq";
import IORedis from "ioredis";
import mongoose from "mongoose";

import { processStockMovement } from "../proccessors/stockMovement.processor.js";
import { processSalesSnapshot } from "../proccessors/salesSnapshot.processor.js";
import { processAlerts } from "../proccessors/proccessAlerts.processor.js";
import { ApiError } from "../utils/apiError.js";
import QueueFail from "../models/queueFail.model.js";



import config from "../utils/config.js";

const connectDB = async () => {
  try {
    await mongoose.connect(config.MONGO_URI, { serverSelectionTimeoutMS: 3000 });
    console.log("MongoDB connected successfully");
  } catch (error) {
    console.error("MongoDB connection failed:", error.message);
    process.exit(1);
  }
};

connectDB();



const connection = new IORedis(config.REDIS_URL, {
  maxRetriesPerRequest: null,
});

connection.on("connect", () => {
  console.log("REDIS CONNECTED");
});

connection.on("error", (err) => {
  console.error("REDIS ERROR:", err);
});



export const orderWorker = new Worker(
  "orders",
  async (job) => {
    console.log(`🚀 Worker ${process.pid} started ${job.name}`);

    const { name, data } = job;

    switch (name) {
      case "sale.confirmed":
        await processStockMovement(data);
        await processSalesSnapshot(data);
        await processAlerts(data);
        break;

      case "sale.failed":
        await processSalesSnapshot(data);
        break;

      default:
        throw new ApiError(404, "UNKNOWN_JOB_TYPE");
    }
  },
  {
    connection,
    concurrency: 5,
  }
);

orderWorker.on("failed", async (job, err) => {
  console.error("Job failed", job?.id, err);

  if (job && job.attemptsMade >= job.opts.attempts) {
    try {
      await QueueFail.create({
        eventType: job.name,
        payload: job.data,
        lastError: `Worker Exhausted: ${err.message}`,
        status: "investigate",
        source: "worker",
      });
      console.log(`💀 Job ${job.id} moved to DLQ (QueueFail)`);
    } catch (dbErr) {
      console.error("CRITICAL: Failed to save DLQ entry:", dbErr);
    }
  }
});
