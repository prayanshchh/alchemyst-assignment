import { Agenda, Job } from 'agenda';
import * as dotenv from 'dotenv';
dotenv.config();
import { parseSSEStream, extractFinalResponseFromSSEString } from '../utils/parseSSEStream';
import { runInSpan } from '../utils/runInSpan';

interface PlanJobData {
  jobId: string;
  topic: string;
}

export default function planStep(agenda: Agenda) {
  agenda.define('plan', async (job: Job<PlanJobData>, done) => {
    const { jobId, topic } = job.attrs.data;
    await runInSpan('agenda.plan', { jobId, topic }, async () => {
      try {
        const baseUrl = process.env.ALCHEMYST_BASE;
        const token = process.env.ALCHEMYST_TOKEN;
        const endpoint = `${baseUrl}/api/v1/chat/generate/stream`;
        const body = {
          chat_history: [
            { content: `Plan research for: ${topic}`, role: 'user' }
          ],
          persona: 'maya',
          scope: 'internal'
        };
        console.log('Sending plan request to LLM:', body);
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify(body)
        });
        console.log('Received plan response:', response.status, response.statusText);
        const result = await parseSSEStream(response);
        const extracted = extractFinalResponseFromSSEString(result);
        (job.attrs.data as any).results = { ...(job.attrs.data as any).results, plan: extracted !== '' ? extracted : result };
        await job.save();
        console.log('Plan result saved in job document for jobId:', jobId);
        done();
      } catch (err) {
        console.error('planStep error:', err);
        (job.attrs.data as any).results = { ...(job.attrs.data as any).results, plan: { error: String(err) } };
        await job.save();
        done();
      }
    });
  });
} 