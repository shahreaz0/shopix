import Redis from "ioredis";
import { env } from "./env";

export const redis = new Redis({
  host: env.get("REDIS_HOST") || "localhost",
  port: parseInt(env.get("REDIS_PORT") || "6379"),
  password: env.get("REDIS_PASSWORD"),
});
