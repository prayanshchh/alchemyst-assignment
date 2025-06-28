import { Agenda, Job } from 'agenda';
import * as dotenv from 'dotenv';
dotenv.config();
import { parseProxyChatCompletionResponse } from '../utils/parseSSEStream';

interface ExpandJobData {
  jobId: string;
  topic: string;
}

const ALCHEMYST_BASE  = process.env.ALCHEMYST_BASE!;
const ALCHEMYST_TOKEN = process.env.ALCHEMYST_TOKEN!;

export default function expandStep(agenda: Agenda) {
  agenda.define('expand', async (job: Job<ExpandJobData>, done) => {
    const { jobId, topic } = job.attrs.data;
    console.log('[expand] starting →', jobId);
    
    const gatherResult = (job.attrs.data as any).results?.gather;
    console.log("I am gather: ", gatherResult)
    const planResult = (job.attrs.data as any).results?.plan;
    const planString = typeof planResult === 'string' ? planResult : '';

    const endpoint = `${ALCHEMYST_BASE}/api/v1/proxy/default/chat/completions`;
    const body = {
      model: 'alchemyst-ai/alchemyst-c1',
      messages: [
        { role: 'system', content: 'You are a helpful assistant.' },
        { role: 'user', content: `Write a research plan for: ${topic}` },
        { role: 'assistant', content: planString },
        { role: 'user', content: `Using the following plan, write a detailed, properly-formatted research report` },
      ]
    };

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${ALCHEMYST_TOKEN}`,
        },
        body: JSON.stringify(body)
      });
      const extracted = await parseProxyChatCompletionResponse(response);
      (job.attrs.data as any).results = { ...(job.attrs.data as any).results, expand: extracted };
      await job.save();
      console.log('[expand] finished →', jobId);
      done();
    } catch (err) {
      console.error('[expand] error:', err);
      (job.attrs.data as any).results = { ...(job.attrs.data as any).results, expand: { error: String(err) } };
      await job.save();
      done();
    }
  });
}
