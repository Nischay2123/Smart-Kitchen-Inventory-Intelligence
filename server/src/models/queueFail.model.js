import mongoose from "mongoose";

const QueueFailSchema = new mongoose.Schema(
  {
    eventType: {
      type: String,
      required: true,
      index: true,
    },

    payload: {
      type: Object,
      required: true,
    },

    retryCount: {
      type: Number,
      default: 0,
    },

    lastError: {
      type: String,
    },

    nextRetryAt: {
      type: Date,
      required: true,
      default: Date.now
    },

    status: {
      type: String,
      enum: ["pending_retry", "investigate"],
      default: "pending_retry",
    },

    source: {
      type: String,
      enum: ["scheduler", "worker"],
      default: "worker"
    }

  },
  { timestamps: true }
);

export default mongoose.model("QueueFail", QueueFailSchema);
