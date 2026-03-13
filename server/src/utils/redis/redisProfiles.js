

export const PROFILES = {

  CACHE: {
    maxRetriesPerRequest: 0,
    retryStrategy: () => null,
    connectTimeout: 2000,
    commandTimeout: 1000,
    enableOfflineQueue: false,
  },

  RATE_LIMIT: {
    maxRetriesPerRequest: null,
    enableOfflineQueue: false,
    retryStrategy(times) {
      return Math.min(times * 100, 2000);
    },
    connectTimeout: 2000,
    commandTimeout: 1000,
  },

  QUEUE_PRODUCER: {
    maxRetriesPerRequest: 0,
    enableOfflineQueue: false,
    connectTimeout: 1000,
    commandTimeout: 1000,
    retryStrategy(times) {
      return Math.min(times * 200, 5000);
    },
  },


  WORKER: {
    maxRetriesPerRequest: null,
    enableOfflineQueue: true,
    retryStrategy(times) {
      const delay = Math.min(times * 50, 2000);
      return delay;
    },
    connectTimeout: 2000,
  },


  ORDER_WORKER: {
    maxRetriesPerRequest: null,
    retryStrategy(times) {
      const delay = Math.min(times * 50, 2000);
      return delay;
    },
    enableOfflineQueue: true,
    connectTimeout: 2000,
  },
};

export const SINGLETON_ROLES = ['CACHE', 'RATE_LIMIT'];
