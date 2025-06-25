import { Agenda, Job } from 'agenda';
import * as dotenv from 'dotenv';
dotenv.config();
import { parseSSEStream, extractFinalResponseFromSSEString } from '../utils/parseSSEStream';

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
    const contextString = typeof gatherResult === 'string' ? gatherResult : '';

    const endpoint = `${ALCHEMYST_BASE}/api/v1/chat/generate/stream`;
    const body = {
      chat_history: [
        { content: `Using the following context, write a detailed, properly-formatted research report on: ${topic}\n\nContext:\n${contextString}`, role: 'user' }
      ],
      persona: 'maya',
      scope  : 'internal'
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
      const result = await parseSSEStream(response);
      const extracted = extractFinalResponseFromSSEString(result);
      (job.attrs.data as any).results = { ...(job.attrs.data as any).results, expand: extracted !== '' ? extracted : result };
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
