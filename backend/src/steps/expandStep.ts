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

    const url = `${ALCHEMYST_BASE}/api/v1/chat/generate/stream`;
    const body = {
      chat_history: [
        { content: `Using all context files for job ${jobId}, write a detailed, properly-formatted research report on: ${topic}`, role: 'user' }
      ],
      persona: 'maya',
      scope  : 'internal'
    };

    let final = '';
    let metadataTitle = '';
    try {
      const resp = await fetch(url, {
        method : 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${ALCHEMYST_TOKEN}` },
        body   : JSON.stringify(body)
      });

      if (!resp.ok || !resp.body) {
        const errorText = await resp.text();
        throw new Error(`[expand] LLM request failed: ${resp.status} ${resp.statusText} ${errorText}`);
      }

      const reader  = resp.body.getReader();
      const decoder = new TextDecoder();
      while (true) {
        const { value, done: doneReading } = await reader.read();
        if (doneReading) break;

        const chunk = decoder.decode(value);
        for (const line of chunk.split('\n')) {
          if (!line.startsWith('data: ')) continue;
          const payload = line.slice(6).trim();
          if (payload === '[DONE]') break;
          try {
            const parsed = JSON.parse(payload);
            switch (parsed.type) {
              case 'thinking_update':
                console.log('[expand] AI thinking:', parsed.content);
                break;
              case 'final_response':
                final += parsed.content;
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
            console.error('[expand] Error parsing stream data:', e, 'Offending data:', payload);
          }
        }
      }
      // Prefer metadataTitle if present
      const resultText = metadataTitle || final;
      console.log("result: ", resultText);
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
