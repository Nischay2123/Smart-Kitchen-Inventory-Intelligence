import rateLimit, { ipKeyGenerator } from "express-rate-limit";
import { RedisStore } from "rate-limit-redis";
import redis from "../utils/redis.js";
import { ApiError } from "../utils/apiError.js";
import { MemoryStore } from "express-rate-limit";

const handler = (req, res, next) => {
    const retryAfter = parseInt(res.getHeader("Retry-After") || "60", 10);
    next(
        new ApiError(
            429,
            `Too many requests. Please try again after ${retryAfter} seconds.`,
            [],
            retryAfter
        )
    );
};

class DynamicRateLimitStore {
  constructor(prefix) {
    this.prefix = prefix;

    this.memoryStore = new MemoryStore();
    this.redisStore = null;
    this.options = null;

    this.current = this.memoryStore;
    this.localKeys = false;
  }

  init(options) {
    this.options = options;
    this.memoryStore.init(options);
  }

  async initRedis(redis) {
    try {
      this.redisStore = new RedisStore({
        sendCommand: (...args) => redis.call(...args),
        prefix: this.prefix,
        resetExpiryOnChange: true,
      });

      if (this.options) {
        this.redisStore.init(this.options);
      }

      this.current = this.redisStore;

      console.log(`[RateLimit] Switched to Redis store (${this.prefix})`);
    } catch (err) {
      console.warn(`[RateLimit] Redis init failed (${this.prefix})`);
    }
  }

  fallbackToMemory() {
    this.current = this.memoryStore;
    console.warn(`[RateLimit] Falling back to memory (${this.prefix})`);
  }

  increment(key) {
    return this.current.increment(key);
  }

  decrement(key) {
    return this.current.decrement(key);
  }

  resetKey(key) {
    return this.current.resetKey(key);
  }
}

const generalStore = new DynamicRateLimitStore("rl:general:");
const authStore = new DynamicRateLimitStore("rl:auth:");
const csvStore = new DynamicRateLimitStore("rl:csv:");

redis.on("ready", async () => {
    await generalStore.initRedis(redis);
    await authStore.initRedis(redis);
    await csvStore.initRedis(redis);  
});

redis.on("close", () => {
    generalStore.fallbackToMemory();  
    authStore.fallbackToMemory();           
    csvStore.fallbackToMemory();
});
export const generalRateLimit = rateLimit({
    windowMs: 60 * 1000,
    max: 1000,
    keyGenerator: (req) => ipKeyGenerator(req) ??req.user?._id?.toString() ,
    store: generalStore,
    handler,
    standardHeaders: true,
    legacyHeaders: false,
});

export const authRateLimit = rateLimit({
    windowMs: 10 * 60 * 1000,
    max: 20,
    keyGenerator: (req) => ipKeyGenerator(req),
    store: authStore,
    handler,
    standardHeaders: true,
    legacyHeaders: false,
});

export const csvRateLimit = rateLimit({
    windowMs: 5 * 60 * 1000,
    max: 5,
    keyGenerator: (req) => ipKeyGenerator(req) ??req.user?._id?.toString() ,
    store: csvStore,
    handler,
    standardHeaders: true,
    legacyHeaders: false,
});