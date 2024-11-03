import { env } from "@/lib/env";
import { redis } from "@/lib/redis";
import { parseCartItems } from "@/lib/utils";
import { Redis } from "ioredis";
import xior from "xior";

const pubsub = new Redis({
  host: env.get("REDIS_HOST"),
  port: parseInt(env.get("REDIS_PORT")),
  password: env.get("REDIS_PASSWORD"),
});

pubsub.config("SET", "notify-keyspace-events", "Ex");

const CHANNEL_KEY = "__keyevent@0__:expired";

pubsub.subscribe(CHANNEL_KEY);

pubsub.on("message", async (ch, message) => {
  console.log({ ch });

  if (ch === CHANNEL_KEY) {
    try {
      console.log("key expired", message);
      const cartSessionId = message.split(":")[1];

      const resp = await redis.hgetall(`cart:${cartSessionId}`);

      const data = parseCartItems(resp);

      const payload = data.map((e) => {
        return {
          actionType: "IN",
          quantity: e.quantity,
          id: e.inventoryId,
        };
      });

      console.log(payload);

      await xior.put(`${env.get("INVENTORY_BASE_URL")}/inventories/bulk`, { payload });

      await redis.del(`cart:${cartSessionId}`);
    } catch (error) {
      console.log({ errorFromPubSub: error });
    }
  }
});
