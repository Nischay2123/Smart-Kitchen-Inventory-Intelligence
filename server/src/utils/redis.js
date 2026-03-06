import IORedis from "ioredis";

import config from "./config.js";

const REDIS_URL = config.REDIS_URL;

const redis = new IORedis(REDIS_URL, {
    maxRetriesPerRequest: 0,           
    enableOfflineQueue: false,        
    retryStrategy: () => null,         
    connectTimeout: 2000,              
    commandTimeout: 1000,              
});

redis.on("connect", () => {
    console.log("Redis connected successfully");
});

redis.on("error", (err) => {
    console.error("Redis connection error:", err);
});

export default redis;
