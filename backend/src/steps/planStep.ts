import { Agenda, Job } from 'agenda';
import * as dotenv from 'dotenv';
dotenv.config();

interface PlanJobData {
  jobId: string;
  topic: string;
}

export default function planStep(agenda: Agenda) {
  agenda.define('plan', async (job: Job<PlanJobData>, done) => {
    const { jobId, topic } = job.attrs.data;
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
      let planResult: any = {
        thinking_updates: [],
        final_response: null,
        metadata: null
      };
      if (response.ok && response.body) {
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        while (true) {
          const { value, done: doneReading } = await reader.read();
          if (doneReading) break;
          const chunk = decoder.decode(value);
          const lines = chunk.split('\n');
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              if (data === '[DONE]') {
                console.log('Stream completed');
                break;
              }
              try {
                const parsed = JSON.parse(data);
                console.log('Received:', parsed);
                switch(parsed.type) {
                  case 'thinking_update':
                    planResult.thinking_updates.push(parsed.content);
                    console.log('AI thinking:', parsed.content);
                    break;
                  case 'final_response':
                    planResult.final_response = parsed.content;
                    console.log('Final response:', parsed.content);
                    break;
                  case 'metadata':
                    planResult.metadata = parsed.content;
                    console.log('Session info:', parsed.content);
                    break;
                  default:
                    break;
                }
              } catch (e) {
                console.error('Error parsing stream data:', e, 'Offending data:', data);
              }
            }
          }
        }
        console.log('Plan post-processing complete:', planResult);
      } else {
        // Log the error response for debugging
        const errorText = await response.text();
        console.error('Chat API error:', response.status, response.statusText, errorText);
        planResult = { error: `Chat API error: ${response.status} ${response.statusText}`, details: errorText };
      }
      (job.attrs.data as any).results = { ...(job.attrs.data as any).results, plan: planResult };
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
} 