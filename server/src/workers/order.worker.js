import { Worker } from "bullmq";
import IORedis from "ioredis";
import { processStockMovement } from "../proccessors/stockMovement.processor.js";
import { processSalesSnapshot } from "../proccessors/salesSnapshot.processor.js";
import { ApiError } from "../utils/apiError.js";
import mongoose from "mongoose";
import { processAlerts } from "../proccessors/proccessAlerts.processor.js";



const connectDB = async () => {
  try {
    await mongoose.connect("mongodb+srv://nischaysharma04:Nischay123@cluster0.vbcoq8e.mongodb.net/SKII",{
      serverSelectionTimeoutMS: 3000,
    });
    console.log("MongoDB connected successfully");
  } catch (error) {
    console.error("MongoDB connection failed:", error.message);
    process.exit(1);
  }
};

connectDB();
console.log(process.env.SMTP_HOST,process.env.SMTP_PORT,process.env.SMTP_USER,process.env.SMTP_PASS );

const connection = new IORedis(
   { maxRetriesPerRequest: null,}
);

export const orderWorker = new Worker(
  "orders",
  async (job) => {
    console.log("🚀 ORDER WORKER STARTED");
    console.log();
    
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
        throw new ApiError(404,"UNKNOWN_JOB_TYPE");
    }
    connection.on("connect", () => {
    console.log("REDIS CONNECTED");
});


  },
  
  { connection }
);

orderWorker.on("failed", (job, err) => {
  console.error("Job failed", job?.id, err);
});
