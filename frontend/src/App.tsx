import React, { useState, useCallback, useRef } from 'react';
import axios from 'axios';
import Header from './components/Header';
import ConversationPane from './components/ConversationPane';
import InputBar from './components/InputBar';
import type { MessageProps } from './components/Message';

const STEP_LABELS = {
  plan: 'Planning',
  gather: 'Gathering',
  expand: 'Expanding',
};

type Step = 'plan' | 'gather' | 'expand';

function App() {
  const [messages, setMessages] = useState<MessageProps[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  // Helper to add a message
  const addMessage = useCallback((content: string, sender: 'user' | 'assistant') => {
    setMessages(prev => [
      ...prev,
      {
        id: Date.now().toString() + '-' + sender,
        content,
        sender,
        timestamp: new Date(),
      },
    ]);
  }, []);

  // Helper to add/update a loading message for a step
  const setStepLoading = useCallback((step: Step) => {
    setMessages(prev => [
      ...prev,
      {
        id: `loading-${step}`,
        content: `${STEP_LABELS[step]}...`,
        sender: 'assistant',
        timestamp: new Date(),
      },
    ]);
  }, []);

  // Helper to replace a loading message with the result
  const replaceStepMessage = useCallback((step: Step, result: string) => {
    setMessages(prev => {
      // Remove the loading message for this step
      const filtered = prev.filter(m => m.id !== `loading-${step}`);
      return [
        ...filtered,
        {
          id: `result-${step}`,
          content: result,
          sender: 'assistant',
          timestamp: new Date(),
        },
      ];
    });
  }, []);

  // Poll job status and update messages
  const pollJobStatus = useCallback((jobId: string) => {
    let lastStatus: { [k in Step]?: string } = {};
    setStepLoading('plan');
    setStepLoading('gather');
    setStepLoading('expand');
    pollingRef.current = setInterval(async () => {
      try {
        const res = await axios.get(`/status/${jobId}`);
        const { plan, gather, expand } = res.data;
        // For each step, if status is done and not already shown, show result
        if (plan?.status === 'done' && lastStatus.plan !== 'done') {
          replaceStepMessage('plan', plan.result || 'Plan complete.');
          lastStatus.plan = 'done';
        }
        if (gather?.status === 'done' && lastStatus.gather !== 'done') {
          replaceStepMessage('gather', gather.result || 'Gathering complete.');
          lastStatus.gather = 'done';
        }
        if (expand?.status === 'done' && lastStatus.expand !== 'done') {
          replaceStepMessage('expand', expand.result || 'Expansion complete.');
          lastStatus.expand = 'done';
        }
        // Stop polling if all done
        if (
          plan?.status === 'done' &&
          gather?.status === 'done' &&
          expand?.status === 'done'
        ) {
          setIsTyping(false);
          if (pollingRef.current) clearInterval(pollingRef.current);
        }
      } catch (err) {
        // Optionally handle error
      }
    }, 2000);
  }, [replaceStepMessage, setStepLoading]);

  // Handle user sending a message
  const handleSendMessage = useCallback(async (content: string) => {
    addMessage(content, 'user');
    setIsTyping(true);
    try {
      const res = await axios.post('/research', { topic: content });
      const { jobId } = res.data;
      pollJobStatus(jobId);
    } catch (err) {
      setIsTyping(false);
      addMessage('Sorry, there was an error submitting your research request.', 'assistant');
    }
  }, [addMessage, pollJobStatus]);

  // Cleanup polling on unmount
  React.useEffect(() => {
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white flex flex-col">
      <Header />
      <ConversationPane messages={messages} isTyping={isTyping} />
      <InputBar onSendMessage={handleSendMessage} disabled={isTyping} />
    </div>
  );
}

export default App;