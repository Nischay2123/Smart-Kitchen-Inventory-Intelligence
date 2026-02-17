import cron from "node-cron";
import { dailySnapshotQueue } from "../queues/dailySnapshot.queue.js";
import QueueFail from "../models/queueFail.model.js";
import SchedulerLog from "../models/schedulerLog.model.js";

const task = cron.schedule(
  "0 1 * * *",
  async () => {
    try {
      await dailySnapshotQueue.add("daily-snapshot", {
        scheduledAt: new Date(),
      });

      return { status: "success" };
    } catch (err) {
      try {
        await QueueFail.create({
          eventType: "daily-snapshot",
          payload: {
            scheduledAt: new Date(),
          },
          lastError: err.message,
          nextRetryAt: new Date(Date.now() + 10 * 60 * 1000),
        });
      } catch (saveErr) {
        console.error("CRITICAL: Failed to save QueueFail doc:", saveErr);
      }

      throw err;
    }
  },
  {
    timezone: "Asia/Kolkata",
  }
);

task.on("execution:started", async (ctx) => {
  await SchedulerLog.updateOne(
    { runId: ctx.execution.id },
    {
      $setOnInsert: {
        eventType: "daily-snapshot",
        status: "started",
        startTime: ctx.date,
      },
    },
    { upsert: true }
  );
});

task.on("execution:finished", async (ctx) => {
  await SchedulerLog.updateOne(
    { runId: ctx.execution.id },
    {
      $set: {
        eventType: "daily-snapshot",
        status: "success",
        endTime: new Date(),
        duration: new Date() - ctx.date,
        details: ctx.execution?.result,
      },
    },
    { upsert: true }
  );
});

task.on("execution:failed", async (ctx) => {
  await SchedulerLog.updateOne(
    { runId: ctx.execution.id },
    {
      $set: {
        eventType: "daily-snapshot",
        status: "failed",
        endTime: new Date(),
        duration: new Date() - ctx.date,
        error: ctx.execution?.error?.message,
      },
    },
    { upsert: true }
  );
});
