import { saveEmail, sendEmail } from "@/services/email.service";
import amqplib from "amqplib";

const EXCHANGE = "order";
const QUEUE = "send-email";

export type Order = {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  tax: number;
  subTotal: number;
  grandTotal: number;
  status: string;
  createdAt: Date;
  updatedAt: Date;
};

export async function emailReciever() {
  const conn = await amqplib.connect("amqp://localhost");

  const ch = await conn.createChannel();

  await ch.assertExchange(EXCHANGE, "direct");

  const q = await ch.assertQueue(QUEUE);

  await ch.bindQueue(q.queue, EXCHANGE, QUEUE);

  ch.consume(
    q.queue,
    async (msg) => {
      const orderData: Order = JSON.parse(msg?.content.toString() || "{}");

      await sendEmail({
        to: orderData.userEmail,
        subject: "Order Confirmed",
        text: `Hello ${orderData.userName}. Thank you for your order. The order ID is ${orderData.id}. Total: ${orderData.grandTotal}`,
      });

      await saveEmail({
        recipient: orderData.userEmail,
        subject: "Order Confirmed",
        body: `Hello ${orderData.userName}. Thank you for your order. The order ID is ${orderData.id}. Total: ${orderData.grandTotal}`,
        source: "checkout",
      });
    },
    {
      noAck: true,
    }
  );
}
