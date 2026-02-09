import redis from "../utils/redis.js";

const DEFAULT_TTL = 60 * 60 * 24; 

export const cacheService = {
    generateKey: (type, tenantId, id) => {
        return `tenant:${tenantId}:${type}:${id}`;
    },

    get: async (key) => {
        const data = await redis.get(key);
        return data ? JSON.parse(data) : null;
    },

    set: async (key, value, ttl = DEFAULT_TTL) => {
        await redis.set(key, JSON.stringify(value), "EX", ttl);
    },

    del: async (key) => {
        await redis.del(key);
    },

    mget: async (keys) => {
        if (!keys || keys.length === 0) return [];
        const data = await redis.mget(keys);
        return data.map(item => item ? JSON.parse(item) : null);
    },

    delByPattern: async (pattern) => {
        const stream = redis.scanStream({
            match: pattern,
            count: 100
        });

        stream.on("data", async (keys) => {
            if (keys.length) {
                const pipeline = redis.pipeline();
                keys.forEach(key => pipeline.del(key));
                await pipeline.exec();
            }
        });

        return new Promise((resolve, reject) => {
            stream.on("end", resolve);
            stream.on("error", reject);
        });
    }

};
