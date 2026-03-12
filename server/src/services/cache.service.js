import { redisManager } from "../utils/redis/redisManager.js";
import { cacheBreaker } from "../utils/circuitBreaker.js";

const redis = redisManager.getConnection("CACHE");

const DEFAULT_TTL = 60 * 60 * 24; 

export const cacheService = {
    generateKey: (type, tenantId, id) => {
        return `tenant:${tenantId}:${type}:${id}`;
    },

    get: async (key) => {
        try {
            return await cacheBreaker.fire(async () => {
                const data = await redis.get(key);
                return data ? JSON.parse(data) : null;
            });
        } catch (err) {
            return null;
        }
    },

    set: async (key, value, ttl = DEFAULT_TTL) => {
        try {
            return await cacheBreaker.fire(async () => {
                await redis.set(key, JSON.stringify(value), "EX", ttl);
            });
        } catch (err) {
            return undefined;
        }
    },

    del: async (key) => {
        try {
            return await cacheBreaker.fire(async () => {
                await redis.del(key);
            });
        } catch (err) {
            return undefined;
        }
    },

    mget: async (keys) => {
        if (!keys || keys.length === 0) return [];
        
        try {
            return await cacheBreaker.fire(async () => {
                const data = await redis.mget(keys);
                return data.map(item => item ? JSON.parse(item) : null);
            });
        } catch (err) {
            return new Array(keys.length).fill(null);
        }
    },

    delByPattern: async (pattern) => {
        try {
            return await cacheBreaker.fire(async () => {
                const stream = redis.scanStream({
                    match: pattern,
                    count: 100
                });

                for await (const keys of stream) {
                    if (keys.length) {
                        const pipeline = redis.pipeline();
                        keys.forEach(key => pipeline.del(key));
                        await pipeline.exec();
                    }
                }
            });
        } catch (err) {
            return undefined;
        }
    }

};
