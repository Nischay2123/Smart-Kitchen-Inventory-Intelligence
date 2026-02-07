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
    }   

  },
  { timestamps: true }
);

export default mongoose.model("QueueFail", QueueFailSchema);
