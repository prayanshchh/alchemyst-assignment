import { Agenda, Job } from 'agenda';
import * as dotenv from 'dotenv';
import { getDb } from '../mongodb';
import { randomUUID } from 'crypto';
dotenv.config();
import { extractFinalResponseFromSSEString, parseSSEStream, ParseSSEStreamResult } from '../utils/parseSSEStream';
import { parseProxyChatCompletionResponse } from '../utils/parseSSEStream';

interface GatherJobData {
  jobId: string;
  topic: string;
}

const ALCHEMYST_BASE = process.env.ALCHEMYST_BASE!;
const ALCHEMYST_TOKEN = process.env.ALCHEMYST_TOKEN!;

async function getPlanFinalResponse(jobId: string): Promise<string | null> {
  const db = await getDb();
  const planDoc = await db.collection('agendaJobs').findOne({ name: 'plan', 'data.jobId': jobId });
  return planDoc?.data?.results?.plan || null;
}

async function getGooglePromptsFromChatAPI(planFinalResponse: string, topic: string): Promise<string> {
  const endpoint = `${ALCHEMYST_BASE}/api/v1/proxy/default/chat/completions`;
  const body = {
    model: 'alchemyst-ai/alchemyst-c1',
    messages: [
      { role: 'system', content: 'You are a helpful assistant.' },
      { role: 'user', content: `Write a research plan for the topic: ${topic}` },
      { role: 'assistant', content: planFinalResponse },
      { role: 'user', content: `For each main point in the above plan, write a Google search prompt that would help gather the most relevant information.\n\nReturn ONLY the prompts as a numbered list, each prompt on a new line, with no extra text before or after.\n\nHere are three examples of how you should format your response don\'t take these responses as context take them as strict guideline on how you should return your answer:\n\nExample 1:\n1. What is Artificial Intelligence? Definition and history\n2. Types of AI: Narrow AI vs General AI vs Superintelligent AI\n3. Key subfields of AI: Machine Learning, NLP, Robotics, Computer Vision, Expert Systems\n\nExample 2:\n1. What are the main causes of climate change?\n2. Effects of climate change on global weather patterns\n3. Solutions to mitigate climate change\n\nExample 3:\n1. History of the Internet: key milestones\n2. How does the Internet work? Basic technologies explained\n3. Major impacts of the Internet on society\n\nNow, generate the prompts for the plan above in the same format.` }
    ]
  };
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${ALCHEMYST_TOKEN}`,
    },
    body: JSON.stringify(body)
  });
  return await parseProxyChatCompletionResponse(response);
}

async function getCombinedGatherResultFromChatAPI(topic: string, promptsText: string, planFinalResponse: string): Promise<string> {
  const endpoint = `${ALCHEMYST_BASE}/api/v1/proxy/default/chat/completions`;
  const body = {
    model: 'alchemyst-ai/alchemyst-c1',
    messages: [
      { role: 'system', content: 'You are a helpful assistant.' },
      { role: 'user', content: `Given this research plan for the topic "${topic}":\n${planFinalResponse}` },
      { role: 'assistant', content: promptsText },
      { role: 'user', content: `For the research topic, use Google search prompts to gather and summarize the most relevant information for each point. Return a well-structured, numbered summary for each prompt.\n\nPrompts:\n` }
    ]
  };
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${ALCHEMYST_TOKEN}`,
    },
    body: JSON.stringify(body)
  });
  return await parseProxyChatCompletionResponse(response);
}

export default function gatherStep(agenda: Agenda) {
  agenda.define('gather', async (job: Job<GatherJobData>, done) => {
    const { jobId, topic } = job.attrs.data;
    try {
      const planFinal = await getPlanFinalResponse(jobId);
      if (!planFinal) throw new Error('No plan final_response found for jobId ' + jobId);
      // Step 1: Get Google prompts
      const promptsResult = await getGooglePromptsFromChatAPI(planFinal, topic);
      if (!promptsResult) throw new Error('No Google prompts returned from Chat API');
      // Step 2: Use prompts to get combined gather result
      const gatherResult = await getCombinedGatherResultFromChatAPI(topic, promptsResult, planFinal);
      console.log("I am result: ", gatherResult);
      (job.attrs.data as any).results = { ...(job.attrs.data as any).results, gather: gatherResult };
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