import CircuitBreaker from "opossum";


const createBreaker = (action, options = {}) => {
    const breaker = new CircuitBreaker(action, {
        timeout: 3000,                  
        errorThresholdPercentage: 50,   
        resetTimeout: 30000,            
        volumeThreshold: 5,           
        ...options,
    });

    breaker.on("open", () => {
        console.error("[CB] redis-cache circuit OPENED - degrading to fallback behavior");
    });

    breaker.on("halfOpen", () => {
        console.log("[CB] redis-cache circuit HALF-OPEN - testing recovery");
    });

    breaker.on("close", () => {
        console.log("[CB] redis-cache circuit CLOSED - Redis healthy");
    });

    return breaker;
};


export const cacheBreaker = createBreaker(
    async (fn) => {
        return await fn();
    },
    {
        name: "redis-cache",
    }
);
