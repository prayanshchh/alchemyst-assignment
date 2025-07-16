import React, { useState, useCallback, useRef } from 'react';
import api from './api';
import { FaRobot } from 'react-icons/fa';
import Header from './components/Header';
import ConversationPane from './components/ConversationPane';
import InputBar from './components/InputBar';
import TypingIndicator from './components/TypingIndicator';
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
  const lastStatusRef = useRef<{ [k in Step]?: string }>({});

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
        faded: true,
      },
    ]);
  }, []);

  // Helper to replace a loading message with the result (faded for plan/gather, normal for expand)
  const replaceStepMessage = useCallback((step: Step, result: string, faded: boolean) => {
    setMessages(prev => {
      // Remove the loading message for this step
      const filtered = prev.filter(m => m.id !== `loading-${step}` && m.id !== `result-${step}`);
      return [
        ...filtered,
        {
          id: `result-${step}`,
          content: result,
          sender: 'assistant',
          timestamp: new Date(),
          faded,
        },
      ];
    });
  }, []);

  // Helper to replace all assistant messages with expand result
  const replaceAllWithExpand = useCallback((expandResult: string) => {
    setMessages(prev => {
      // Keep only user messages
      const userMessages = prev.filter(m => m.sender === 'user');
      return [
        ...userMessages,
        {
          id: `result-expand`,
          content: expandResult,
          sender: 'assistant',
          timestamp: new Date(),
          faded: false,
        },
      ];
    });
  }, []);

  // Poll job status and update messages
  const pollJobStatus = useCallback((jobId: string) => {
    lastStatusRef.current = {};
    setStepLoading('plan');
    setStepLoading('gather');
    setStepLoading('expand');
    pollingRef.current = setInterval(async () => {
      try {
        const res = await api.get(`/status/${jobId}`);
        const { plan, gather, expand } = res.data;
        // If expand is available, show only expand and stop polling
        if (expand && expand.data && expand.data.results && expand.data.results.expand) {
          const expandResult = typeof expand.data.results.expand === 'string'
            ? expand.data.results.expand
            : (expand.data.results.expand.final_response || 'Expansion complete.');
          replaceAllWithExpand(expandResult);
          setIsTyping(false);
          if (pollingRef.current) clearInterval(pollingRef.current);
          return;
        }
        // For each step, if result is available and not already shown, show result
        if (plan && plan.data && plan.data.results && plan.data.results.plan && lastStatusRef.current.plan !== 'done') {
          replaceStepMessage('plan', plan.data.results.plan.final_response || 'Plan complete.', true);
          lastStatusRef.current.plan = 'done';
        }
        if (gather && gather.data && gather.data.results && gather.data.results.gather && lastStatusRef.current.gather !== 'done') {
          replaceStepMessage('gather', typeof gather.data.results.gather === 'string'
            ? gather.data.results.gather
            : (gather.data.results.gather.final_response || 'Gathering complete.'), true);
          lastStatusRef.current.gather = 'done';
        }
      } catch (err) {
        // Optionally handle error
      }
    }, 5000); // 5 seconds
  }, [replaceStepMessage, setStepLoading, replaceAllWithExpand]);

  // Handle user sending a message
  const handleSendMessage = useCallback(async (content: string) => {
    addMessage(content, 'user');
    setIsTyping(true);
    try {
      const res = await api.post('/research', { topic: content });
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
    <div className="min-h-screen w-full bg-gradient-to-br from-indigo-900 via-slate-900 to-indigo-800 flex items-center justify-center">
      <div className="w-full max-w-6xl h-[80vh] flex flex-col bg-white/10 backdrop-blur-md rounded-3xl shadow-2xl border border-white/20 overflow-hidden">
        <Header />
        <div className="flex-1 min-h-0 flex flex-col">
          <ConversationPane messages={messages} isTyping={isTyping} />
        </div>
        <div className="border-t border-white/10 bg-white/5 px-4 py-3">
          <InputBar onSendMessage={handleSendMessage} disabled={isTyping} />
        </div>
      </div>
      <div className="absolute bottom-2 left-0 right-0 text-center text-slate-400 text-xs">
        <span>Powered by Alchemyst AI</span>
      </div>
    </div>
  );
}

export default App;