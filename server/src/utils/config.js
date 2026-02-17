import dotenv from "dotenv";

dotenv.config();

function requireEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`❌ Missing required environment variable: ${name}`);
  }
  return value;
}

const config = {
  PORT: process.env.PORT || 8000,
  NODE_ENV: process.env.NODE_ENV || "development",

  MONGO_URI: requireEnv("MONGO_URI"),
  ACCESS_TOKEN_SECRET: requireEnv("ACCESS_TOKEN_SECRET"),
  ACCESS_TOKEN_EXPIRY: requireEnv("ACCESS_TOKEN_EXPIRY"),

  SMTP: {
    HOST: requireEnv("SMTP_HOST"),
    PORT: requireEnv("SMTP_PORT"),
    USER: requireEnv("SMTP_USER"),
    PASS: requireEnv("SMTP_PASS"),
  },

  REDIS_URL: requireEnv("REDIS_URI"),
};

export default config;
