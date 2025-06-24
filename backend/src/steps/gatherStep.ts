import { Agenda, Job } from 'agenda';
import * as dotenv from 'dotenv';
import { getDb } from '../mongodb';
import { randomUUID } from 'crypto';
dotenv.config();

interface GatherJobData {
  jobId: string;
  topic: string;
}

const ALCHEMYST_BASE = process.env.ALCHEMYST_BASE!;
const ALCHEMYST_TOKEN = process.env.ALCHEMYST_TOKEN!;

async function getPlanFinalResponse(jobId: string): Promise<string | null> {
  const db = await getDb();
  const planDoc = await db.collection('agendaJobs').findOne({ name: 'plan', 'data.jobId': jobId });
  return planDoc?.data?.results?.plan?.final_response || null;
}

async function getGooglePromptsFromChatAPI(planFinalResponse: string, topic: string): Promise<string[]> {
  const endpoint = `${ALCHEMYST_BASE}/api/v1/chat/generate/stream`;
  const body = {
    chat_history: [
      { content:
        `Given this research plan for the topic "${topic}":\n${planFinalResponse}\n\nFor each main point, write a Google search prompt that would help gather the most relevant information.\n\nReturn ONLY the prompts as a numbered list, each prompt on a new line, with no extra text before or after.\n\nHere are three examples of how you should format your response don't take these responses as context take them as strict guideline on how you should return your answer:\n\nExample 1:\n1. What is Artificial Intelligence? Definition and history\n2. Types of AI: Narrow AI vs General AI vs Superintelligent AI\n3. Key subfields of AI: Machine Learning, NLP, Robotics, Computer Vision, Expert Systems\n\nExample 2:\n1. What are the main causes of climate change?\n2. Effects of climate change on global weather patterns\n3. Solutions to mitigate climate change\n\nExample 3:\n1. History of the Internet: key milestones\n2. How does the Internet work? Basic technologies explained\n3. Major impacts of the Internet on society\n\nNow, generate the prompts for the plan above in the same format.`, role: 'user' }
    ],
    persona: 'maya',
    scope: 'internal'
  };
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${ALCHEMYST_TOKEN}`,
    },
    body: JSON.stringify(body)
  });
  let promptsText = '';
  let metadataTitle = '';
  if (response.ok && response.body) {
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
          if (data.startsWith('{') && data.endsWith('}')) {
            try {
              const parsed = JSON.parse(data);
              if (parsed.type === 'final_response') {
                promptsText += parsed.content;
              } else if (parsed.type === 'metadata' && parsed.content && parsed.content.title) {
                metadataTitle = parsed.content.title;
              }
            } catch (e) {
              console.error('Error parsing stream data:', e, 'Offending data:', data);
            }
          }
        }
      }
    }
  } else {
    const errorText = await response.text();
    throw new Error(`Chat API error: ${response.status} ${response.statusText} ${errorText}`);
  }
  let numberedListText = metadataTitle || promptsText;
  numberedListText = numberedListText.replace(/\r/g, '').trim();
  let prompts: string[] = [];
  if (/\n/.test(numberedListText)) {
    prompts = numberedListText.split(/\n/)
      .map(line => line.trim())
      .filter(line => /^\d+\.\s+/.test(line))
      .map(line => line.replace(/^\d+\.\s+/, ''));
  } else {
    const matches = numberedListText.match(/\d+\.\s+[^\d]+/g);
    if (matches) {
      prompts = matches.map(line => line.replace(/^\d+\.\s+/, '').trim());
    }
  }
  return prompts;
}

async function getCombinedGatherResultFromChatAPI(topic: string, prompts: string[]): Promise<string> {
  const endpoint = `${ALCHEMYST_BASE}/api/v1/chat/generate/stream`;
  const allPromptsText = prompts.map((p, i) => `${i + 1}. ${p}`).join('\n');
  const combinedPrompt = `For the research topic: "${topic}", use the following Google search prompts to gather and summarize the most relevant information for each point. Return a well-structured, numbered summary for each prompt.\n\nPrompts:\n${allPromptsText}`;
  const body = {
    chat_history: [
      { content: combinedPrompt, role: 'user' }
    ],
    persona: 'maya',
    scope: 'internal'
  };

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${ALCHEMYST_TOKEN}`,
    },
    body: JSON.stringify(body)
  });

  let combinedResult = '';
  if (response.ok && response.body) {
    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

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
            // Handle different event types
            switch (parsed.type) {
              case 'thinking_update':
                console.log('AI thinking:', parsed.content);
                break;
              case 'final_response':
                combinedResult += parsed.content;
                console.log('Final response:', parsed.content);
                break;
              case 'metadata':
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
  } else {
    const errorText = await response.text();
    throw new Error(`Chat API error: ${response.status} ${response.statusText} ${errorText}`);
  }
  return combinedResult;
}

export default function gatherStep(agenda: Agenda) {
  agenda.define('gather', async (job: Job<GatherJobData>, done) => {
    const { jobId, topic } = job.attrs.data;
    try {
      const planFinal = await getPlanFinalResponse(jobId);
      if (!planFinal) throw new Error('No plan final_response found for jobId ' + jobId);
      const prompts = await getGooglePromptsFromChatAPI(planFinal, topic);
      if (!prompts.length) throw new Error('No Google prompts returned from Chat API');
      const combinedResult = await getCombinedGatherResultFromChatAPI(topic, prompts);
      console.log("cobine: ", combinedResult);
      (job.attrs.data as any).results = { ...(job.attrs.data as any).results, gather: combinedResult };
      await job.save();
      console.log('Gather result saved in job document for jobId:', jobId);
      done();
    } catch (err) {
      console.error('gatherStep error:', err);
      (job.attrs.data as any).results = { ...(job.attrs.data as any).results, gather: { error: String(err) } };
      await job.save();
      done();
    }
  });
} 