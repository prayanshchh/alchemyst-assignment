import amqplib, { ConfirmChannel } from 'amqplib';
import dotenv from 'dotenv';
dotenv.config();

const URL   = process.env.RABBITMQ_URL!;
const QUEUE = 'deep-research';

class RabbitMQPublisher {
  private channel: ConfirmChannel | null = null;

  async connect() {
    if (this.channel) return;
    const conn = await amqplib.connect(URL);
    this.channel = await conn.createConfirmChannel();

    await this.channel.assertQueue(QUEUE, { durable: true });
    console.log(`[AMQP] Connected and queue asserted: ${QUEUE}`);
  }

  async send(message: unknown) {
    if (!this.channel) await this.connect();

    const payload = Buffer.from(JSON.stringify(message));
    const published = this.channel!.publish(
      '', // default exchange
      QUEUE,
      payload,
      { persistent: true, mandatory: true }
    );
    console.log(`[AMQP] Published:`, message, 'published:', published);

    const waiting = await this.channel!.waitForConfirms();
    console.log("waiting: ", waiting)
  }

  async close() {
    if (this.channel) await this.channel.close();
    this.channel = null;
  }
}

const mqPublisher = new RabbitMQPublisher();
export default mqPublisher; 