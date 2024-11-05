import amqplib from "amqplib";

export async function sendToQueue(queue: string, message: object) {
  try {
    const conn = await amqplib.connect("amqp://localhost");

    const ch = await conn.createChannel();

    const exchange = "order";

    await ch.assertExchange(exchange, "direct");

    const q = await ch.assertQueue(queue);

    await ch.bindQueue(q.queue, exchange, queue);

    await ch.publish(exchange, queue, Buffer.from(JSON.stringify(message)));

    setTimeout(() => conn.close(), 500);
  } catch (error) {
    console.log(error);
  }
}
