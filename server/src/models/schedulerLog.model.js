import mongoose from "mongoose";

const SchedulerLogSchema = new mongoose.Schema(
    {
        eventType: {
            type: String,
            required: true,
            index: true,
        },
        status: {
            type: String, // "started", "success", "failed", "running"
            required: true,
            enum: ["started", "success", "failed", "running"],
        },
        runId: {
            type: String,
            index: true,
        },
        startTime: {
            type: Date,
            required: true,
            default: Date.now,
        },
        endTime: {
            type: Date,
        },
        duration: {
            type: Number, // in milliseconds
        },
        error: {
            type: String,
        },
        details: {
            type: Object, // Any additional info needed
        },
    },
    { timestamps: true }
);

export default mongoose.model("SchedulerLog", SchedulerLogSchema);
