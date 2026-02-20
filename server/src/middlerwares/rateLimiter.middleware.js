import rateLimit,{ ipKeyGenerator } from "express-rate-limit";
import { RedisStore } from "rate-limit-redis";
import redis from "../utils/redis.js";
import { ApiError } from "../utils/apiError.js";

const handler = (req, res, next) =>
    next(new ApiError(429, "Too many requests. Please slow down."));

const makeStore = (prefix) =>
    new RedisStore({
        sendCommand: (...args) => redis.call(...args),
        prefix,
        resetExpiryOnChange: true,
    });

export const generalRateLimit = rateLimit({
    windowMs: 60 * 1000,
    max: 100,
    keyGenerator: (req) => req.user?._id?.toString() ?? ipKeyGenerator(req),
    store: makeStore("rl:general:"),
    handler,
    standardHeaders: true,  
    legacyHeaders: false,
});

export const authRateLimit = rateLimit({
    windowMs: 10 * 60 * 1000,
    max: 20,
    keyGenerator: (req) => ipKeyGenerator(req),
    store: makeStore("rl:auth:"),
    handler,
    standardHeaders: true,
    legacyHeaders: false,
});

export const csvRateLimit = rateLimit({
    windowMs: 5 * 60 * 1000,
    max: 5,
    keyGenerator: (req) => req.user?._id?.toString() ?? ipKeyGenerator(req),
    store: makeStore("rl:csv:"),
    handler,
    standardHeaders: true,
    legacyHeaders: false,
});
