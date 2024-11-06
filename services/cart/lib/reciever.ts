import { clearCart } from "@/services/cart.service";
import amqplib from "amqplib";

const EXCHANGE = "order";
const QUEUE = "clear-cart";

export type CartSession = {
  cartSessionId: string;
};

export async function cartClearReciever() {
  const conn = await amqplib.connect("amqp://localhost");

  const ch = await conn.createChannel();

  await ch.assertExchange(EXCHANGE, "direct");

  const q = await ch.assertQueue(QUEUE);

  await ch.bindQueue(q.queue, EXCHANGE, QUEUE);

  ch.consume(
    q.queue,
    async (msg) => {
      const { cartSessionId }: CartSession = JSON.parse(msg?.content.toString() || "{}");

      await clearCart(cartSessionId);

      console.log(`[x] cart cleared: ${cartSessionId}`);
    },
    {
      noAck: true,
    }
  );
}
