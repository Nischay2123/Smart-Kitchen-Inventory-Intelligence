import cron from "node-cron";
import QueueFail from "../models/queueFail.model.js";
import { orderQueue } from "../queues/order.queue.js";
import SchedulerLog from "../models/schedulerLog.model.js";

let isRunning = false;

const task = cron.schedule(
  "0 */1 * * * *",
  async () => {
    if (isRunning) {
      console.warn("order-queue-retry skipped: previous run still executing");
      return { skipped: true };
    }

    isRunning = true;

    try {
      const events = await QueueFail.find({
        nextRetryAt: { $lte: new Date() },
      })
        .sort({ createdAt: 1 })
        .limit(50);

      let processedCount = 0;
      let failedCount = 0;

      for (const event of events) {
        try {
          await orderQueue.add(event.eventType, event.payload);
          await QueueFail.deleteOne({ _id: event._id });
          processedCount++;
        } catch (err) {
          failedCount++;

          await QueueFail.updateOne(
            { _id: event._id },
            {
              $inc: { retryCount: 1 },
              $set: {
                lastError: err.message,
                nextRetryAt: new Date(Date.now() + 60 * 60 * 1000),
              },
            }
          );
        }
      }

      return { processedCount, failedCount };
    } catch (err) {
      console.error("order-queue-retry fatal error:", err);
      throw err;
    } finally {
      isRunning = false;
    }
  },
  {
    timezone: "Asia/Kolkata",
  }
);

task.on("execution:started", async (ctx) => {
  try {
    await SchedulerLog.updateOne(
      { runId: ctx.execution.id },
      {
        $setOnInsert: {
          eventType: "order-queue-retry",
          status: "started",
          startTime: ctx.date,
        },
      },
      { upsert: true }
    );
  } catch (err) {
    console.error("Failed to log execution:started", err);
  }
});

task.on("execution:finished", async (ctx) => {
  try {
    const endTime = new Date();
    await SchedulerLog.updateOne(
      { runId: ctx.execution.id },
      {
        $set: {
          eventType: "order-queue-retry",
          status: "success",
          endTime,
          duration: endTime - ctx.date,
          details: ctx.execution?.result,
        },
      },
      { upsert: true }
    );
  } catch (err) {
    console.error("Failed to log execution:finished", err);
  }
});

task.on("execution:failed", async (ctx) => {
  try {
    const endTime = new Date();
    await SchedulerLog.updateOne(
      { runId: ctx.execution.id },
      {
        $set: {
          eventType: "order-queue-retry",
          status: "failed",
          endTime,
          duration: endTime - ctx.date,
          error: ctx.execution?.error?.message,
        },
      },
      { upsert: true }
    );
  } catch (err) {
    console.error("Failed to log execution:failed", err);
  }
});
