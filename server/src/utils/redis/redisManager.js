import IORedis from "ioredis";
import config from "../config.js";
import { sendRedisDownAlertEmail } from "../emailAlert.js";
import { PROFILES } from "./redisProfiles.js";

class RedisManager {
  constructor() {
    this.singletonConnections = {};
    
    this.healthStatus = {};
    
    this.alertsSent = {};

    this.allConnections = new Set();
  }


  getConnection(role) {
    if (!PROFILES[role]) {
      throw new Error(`Unknown Redis role: ${role}`);
    }

    if (role === "CACHE" || role === "RATE_LIMIT") {
      if (!this.singletonConnections[role]) {
        this.singletonConnections[role] = this._createConnection(role);
      }
      return this.singletonConnections[role];
    }

    return this._createConnection(role);
  }


  _createConnection(role) {
    const profile = PROFILES[role];
    const connection = new IORedis(config.REDIS_URL, profile);

    this.allConnections.add(connection);

    this.healthStatus[role] = false;
    this.alertsSent[role] = false;

    connection.on("connect", () => {
      this.healthStatus[role] = true;
      this.alertsSent[role] = false;
      console.log(`✅ [Redis ${role}] connected`);
    });

    connection.on("ready", () => {
      this.healthStatus[role] = true;
      console.log(`✅ [Redis ${role}] ready`);
    });

    connection.on("error", (err) => {
      this.healthStatus[role] = false;
      const alertStatus = this.alertsSent[role] ? "(Alert already sent)" : "(Sending alert)";
      console.error(`❌ [Redis ${role}] error: ${err.message} ${alertStatus}`);

      if (!this.alertsSent[role]) {
        this.alertsSent[role] = true;
        this._sendAlert(role, err);
      }
    });

    connection.on("close", () => {
      this.healthStatus[role] = false;
      console.warn(`⚠️  [Redis ${role}] connection closed`);
    });

    connection.on("end", () => {
      this.healthStatus[role] = false;
      console.warn(`⚠️  [Redis ${role}] connection ended`);
    });

    connection.on("reconnecting", (delay) => {
      console.log(`🔄 [Redis ${role}] reconnecting in ${delay}ms...`);
    });

    return connection;
  }


  async _sendAlert(role, err) {
    try {
      await sendRedisDownAlertEmail({
        role,
        error: err.message,
        timestamp: new Date().toISOString(),
      });
      console.log(`📧 [Redis ${role}] Alert email sent`);
    } catch (emailErr) {
      console.error(`❌ [Redis ${role}] Failed to send alert email:`, emailErr.message);
    }
  }

  isHealthy(role) {
    return this.healthStatus[role] || false;
  }

  status(role) {
    return {
      role,
      healthy: this.isHealthy(role),
      alertSent: this.alertsSent[role] || false,
    };
  }

  getAllStatuses() {
    return Object.keys(PROFILES).reduce((acc, role) => {
      acc[role] = this.status(role);
      return acc;
    }, {});
  }

  
  async shutdown() {
    console.log("[Redis Manager] Shutting down all connections...");
    const closePromises = Array.from(this.allConnections).map((conn) =>
      conn.quit().catch((err) => {
        console.error("[Redis Manager] Error closing connection:", err.message);
        return conn.disconnect();
      })
    );
    await Promise.allSettled(closePromises);
    console.log("[Redis Manager] All connections closed");
  }
}


export const redisManager = new RedisManager();
