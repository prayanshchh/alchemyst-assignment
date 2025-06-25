export interface ParseSSEStreamResult {
  thinking_updates: string[];
  final_response: string | null;
  metadata: any;
}

export async function parseSSEStream(response: Response): Promise<string> {
  let result = '';
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
          result += data + '\n';
          console.log('rfr: ', data);
        }
      }
    }
    console.log('Plan post-processing complete:', result);
  } else {
    const errorText = await response.text();
    console.error('Chat API error:', response.status, response.statusText, errorText);
  }
  return result.trim();
}

export function extractFinalResponseFromSSEString(sseString: string): string {
  const matches = sseString.match(/{[^}]+}/g);
  if (!matches) return '';
  const lines = sseString.split('\n');
  for (const line of lines) {
    try {
      const obj = JSON.parse(line);
      if (obj.type === 'final_response' && typeof obj.content === 'string') {
        return obj.content;
      }
    } catch (e) {
      // Ignore lines that are not valid JSON
      continue;
    }
  }
  return '';
} 