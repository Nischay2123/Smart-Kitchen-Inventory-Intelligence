
import { Worker } from "bullmq";
import mongoose from "mongoose";
import { processDailySnapshot } from "../proccessors/dailySnapshot.processor.js";
import QueueFail from "../models/queueFail.model.js";
import config from "../utils/config.js";
import { processDailyItemSnapshot } from "../proccessors/dailyItemSnapshot.processor.js";
import { redisManager } from "../utils/redis/redisManager.js";

const connectDB = async () => {
    try {
        await mongoose.connect(config.MONGO_URI, { serverSelectionTimeoutMS: 3000 });
        console.log("MongoDB connected successfully (Snapshot Worker)");
    } catch (error) {
        console.error("MongoDB connection failed:", error.message);
        process.exit(1);
    }
};

connectDB();

const connection = redisManager.getConnection("WORKER");

export const dailySnapshotWorker = new Worker(
    "daily-snapshot",
    async (job) => {
        console.log(
            `🚀 Snapshot Worker ${process.pid} started ${job.name}`
        );

        const results = await Promise.allSettled([
            processDailySnapshot(job),
            processDailyItemSnapshot(job),
        ]);

        results.forEach((result, index) => {
            const name =
                index === 0 ? "OUTLET SNAPSHOT" : "ITEM SNAPSHOT";

            if (result.status === "fulfilled") {
                console.log(`✔ ${name} completed`);
            } else {
                console.error(`❌ ${name} failed:`, result.reason);
            }
        });
    },
    {
        connection,
        concurrency: 1, 
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
            });
            console.log(`💀 Snapshot Job ${job.id} moved to DLQ (QueueFail)`);
        } catch (dbErr) {
            console.error("CRITICAL: Failed to save Snapshot DLQ entry:", dbErr);
        }
    }
});
