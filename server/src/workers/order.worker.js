import { Worker } from "bullmq";
import IORedis from "ioredis";
import mongoose from "mongoose";

import { processStockMovement } from "../proccessors/stockMovement.processor.js";
import { processSalesSnapshot } from "../proccessors/salesSnapshot.processor.js";
import { processAlerts } from "../proccessors/proccessAlerts.processor.js";
import { ApiError } from "../utils/apiError.js";



const connectDB = async () => {
  try {
    await mongoose.connect(
      "mongodb+srv://nischaysharma04:Nischay123@cluster0.vbcoq8e.mongodb.net/SKII",
      { serverSelectionTimeoutMS: 3000 }
    );
    console.log("MongoDB connected successfully");
  } catch (error) {
    console.error("MongoDB connection failed:", error.message);
    process.exit(1);
  }
};

connectDB();



const connection = new IORedis({
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
    connection ,
    concurrency: 5,
  }
);

orderWorker.on("failed", (job, err) => {
  console.error("Job failed", job?.id, err);
});
