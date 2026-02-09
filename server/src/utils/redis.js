import IORedis from "ioredis";

const REDIS_URL = process.env.REDIS_URI || "redis://localhost:6379";

const redis = new IORedis(REDIS_URL, {
    maxRetriesPerRequest: null,
    retryStrategy(times) {
        const delay = Math.min(times * 50, 2000);
        return delay;
    },
});

redis.on("connect", () => {
    console.log("Redis connected successfully");
});

redis.on("error", (err) => {
    console.error("Redis connection error:", err);
});

export default redis;
