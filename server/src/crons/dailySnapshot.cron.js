import cron from "node-cron";
import { dailySnapshotQueue } from "../queues/dailySnapshot.queue.js";
import QueueFail from "../models/queueFail.model.js";

export const runDailySnapshotJob = async () => {
  console.log("Scheduling Snapshot Job to Queue");

  try {
    await dailySnapshotQueue.add("daily-snapshot", {
      scheduledAt: new Date(),
    });
    console.log("Snapshot Job added to queue");
  } catch (err) {
    console.error("Failed to add Snapshot Job to queue:", err);
    try {
      await QueueFail.create({
        eventType: "daily-snapshot",
        payload: {
          scheduledAt: new Date(),
        },
        lastError: err.message,
        nextRetryAt: new Date(Date.now() + 10 * 60 * 1000) // Retry in 10 minutes
      });
      console.log("Failed Snapshot Job saved to QueueFail");
    } catch (saveErr) {
      console.error("CRITICAL: Failed to save QueueFail doc:", saveErr);
    }
  }
};

// Schedule to run at 1:00 AM every day
cron.schedule("0 */1 * * *", runDailySnapshotJob, {
  timezone: "Asia/Kolkata"
});

