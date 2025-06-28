import mqPublisher from './queue';
import agenda from './agenda';
import planStep from './steps/planStep';
import gatherStep from './steps/gatherStep';
import expandStep from './steps/expandStep';

import { ConfirmChannel, ConsumeMessage } from 'amqplib';

const QUEUE = 'deep-research';

// Helper to atomically enqueue a job with deduplication
function enqueue(name: string, data: any) {
  return agenda
    .create(name, data)
    .unique({ name, 'data.jobId': data.jobId }, { insertOnly: true })
    .schedule(new Date())          // <-- keep a nextRunAt
    .save();
}

class RabbitMQWorker {
  private channel: ConfirmChannel | null = null;

  constructor() {
    planStep(agenda);
    gatherStep(agenda);
    expandStep(agenda);

    agenda.on('success:plan', ({ attrs: { data } }) => enqueue('gather', data));
    agenda.on('success:gather', ({ attrs: { data } }) => enqueue('expand', data));

    agenda.on('success:expand', (job) => {
      const { jobId } = job.attrs.data;
      console.log(`Job flow complete for jobId=${jobId}`);
    });

    agenda.on('fail', (err, job) => {
      const { jobId } = job.attrs.data || {};
      console.error(`Agenda job failed for jobId=${jobId}:`, err);
    });
  }

  async connect() {
    await agenda.start()
    await mqPublisher.connect();
    this.channel = (mqPublisher as any).channel;
  }

  async start() {
    await this.connect();
    if (!this.channel) throw new Error('Channel not initialized');
    await this.channel.prefetch(1);
    this.channel.consume(QUEUE, async (msg: ConsumeMessage | null) => {
      if (!msg) return;
      try {
        const { jobId, topic } = JSON.parse(msg.content.toString());
        await enqueue('plan', { jobId, topic });
        this.channel?.ack(msg)
        console.log(`Scheduled persistent Agenda job for jobId=${jobId}`);
      } catch (err) {
        console.error('Worker error:', err);
        this.channel!.nack(msg, false, false);
      }
    });
  }
}

const worker = new RabbitMQWorker();
worker.start();