import env from "dotenv";
env.config();

import mongoose from "mongoose";
import "./crons/dailySnapshot.cron.js";
import "./crons/orderQueue.cron.js";

const MONGO_URI = process.env.MONGO_URI || "mongodb+srv://nischaysharma04:Nischay123@cluster0.vbcoq8e.mongodb.net/SKII";

const connectDB = async () => {
    try {
        await mongoose.connect(MONGO_URI, {
            serverSelectionTimeoutMS: 3000,
        });
        console.log("MongoDB connected successfully (Scheduler)");
    } catch (error) {
        console.error("MongoDB connection failed:", error.message);
        process.exit(1);
    }
};

connectDB();

console.log("🚀 Scheduler Service Started");

// Keep the process alive
process.on("SIGINT", async () => {
    console.log("Scheduler shutting down...");
    await mongoose.connection.close();
    process.exit(0);
});
