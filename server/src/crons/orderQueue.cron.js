import cron from "node-cron";
import QueueFail from "../models/queueFail.model.js";
import { orderQueue } from "../queues/order.queue.js";

cron.schedule("0 */1 * * * *", async () => {
  console.log("order queue cron started");

  const events = await QueueFail.find({
    nextRetryAt: { $lte: new Date() },
    status: "pending_retry"
  })
    .sort({ createdAt: 1 })
    .limit(50);

  for (const event of events) {
    try {
      await orderQueue.add(event.eventType, event.payload);

      await QueueFail.deleteOne({ _id: event._id });
    } catch (err) {
      await QueueFail.updateOne(
        { _id: event._id },
        {
          $inc: { retryCount: 1 },
          $set: {
            lastError: err.message,
            nextRetryAt: new Date(Date.now() + 60 * 60 * 1000)
          },

        }
      );
    }
  }
});
