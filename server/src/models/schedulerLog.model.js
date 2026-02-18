import mongoose from "mongoose";

const SchedulerLogSchema = new mongoose.Schema(
    {
        eventType: {
            type: String,
            required: true,
            index: true,
        },
        status: {
            type: String, 
            required: true,
            enum: ["started", "success", "failed"],
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
            type: Number, 
        },
        error: {
            type: String,
        },
        details: {
            type: Object, 
        },
    },
    { timestamps: true }
);

export default mongoose.model("SchedulerLog", SchedulerLogSchema);
