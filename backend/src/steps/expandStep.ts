import { Agenda, Job } from 'agenda';
import * as dotenv from 'dotenv';
dotenv.config();

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

    const endpoint = `${ALCHEMYST_BASE}/api/v1/chat/generate/stream`;
    const body = {
      chat_history: [
        { content: `Using all context files for job ${jobId}, write a detailed, properly-formatted research report on: ${topic}`, role: 'user' }
      ],
      persona: 'maya',
      scope  : 'internal'
    };

    let combinedResult = '';
    let metadataTitle = '';
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${ALCHEMYST_TOKEN}`,
        },
        body: JSON.stringify(body)
      });

      if (!response.ok || !response.body) {
        const errorText = await response.text();
        throw new Error(`[expand] LLM request failed: ${response.status} ${response.statusText} ${errorText}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6).trim();
            if (data === '[DONE]') break;
            try {
              const parsed = JSON.parse(data);
              switch (parsed.type) {
                case 'thinking_update':
                  console.log('[expand] AI thinking:', parsed.content);
                  break;
                case 'final_response':
                  combinedResult += parsed.content;
                  break;
                case 'metadata':
                  if (parsed.content && parsed.content.title) {
                    metadataTitle = parsed.content.title;
                  }
                  break;
                default:
                  break;
              }
            } catch (e) {
              console.error('[expand] Error parsing stream data:', e, 'Offending data:', data);
            }
          }
        }
      }
      // Prefer metadataTitle if present
      const resultText = metadataTitle || combinedResult;
      console.log('[expand] result:', resultText);
      (job.attrs.data as any).results = { ...(job.attrs.data as any).results, expand: resultText };
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
