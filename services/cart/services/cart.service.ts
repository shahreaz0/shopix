import { redis } from "@/lib/redis";

export async function clearCart(cartSessionId: string) {
  try {
    await redis.del(`sessions:${cartSessionId}`);

    await redis.del(`cart:${cartSessionId}`);
  } catch (error) {
    throw error;
  }
}
