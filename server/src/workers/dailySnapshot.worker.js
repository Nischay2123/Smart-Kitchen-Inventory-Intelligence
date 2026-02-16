
import { Worker } from "bullmq";
import IORedis from "ioredis";
import mongoose from "mongoose";
import { processDailySnapshot } from "../proccessors/dailySnapshot.processor.js";
import QueueFail from "../models/queueFail.model.js";

const connectDB = async () => {
    try {
        // Ideally use env var, but matching existing hardcoded pattern in order.worker.js for now or use the one from env if available
        const mongoUri = process.env.MONGO_URI || "mongodb+srv://nischaysharma04:Nischay123@cluster0.vbcoq8e.mongodb.net/SKII";
        await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 3000 });
        console.log("MongoDB connected successfully (Snapshot Worker)");
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
    console.log("REDIS CONNECTED (Snapshot Worker)");
});

connection.on("error", (err) => {
    console.error("REDIS ERROR (Snapshot Worker):", err);
});

export const dailySnapshotWorker = new Worker(
    "daily-snapshot",
    async (job) => {
        console.log(`🚀 Snapshot Worker ${process.pid} started ${job.name}`);
        await processDailySnapshot(job);
    },
    {
        connection,
        concurrency: 1, // Sequential processing is fine for this daily job
    }
);

dailySnapshotWorker.on("failed", async (job, err) => {
    console.error("Snapshot Job failed", job?.id, err);

    if (job && job.attemptsMade >= job.opts.attempts) {
        try {
            await QueueFail.create({
                eventType: "daily-snapshot",
                payload: job.data,
                lastError: `Worker Exhausted: ${err.message}`, 
                status: "investigate",
                source: "worker",
                nextRetryAt: null
            });
            console.log(`💀 Snapshot Job ${job.id} moved to DLQ (QueueFail)`);
        } catch (dbErr) {
            console.error("CRITICAL: Failed to save Snapshot DLQ entry:", dbErr);
        }
    }
});
