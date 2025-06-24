import React, { useEffect, useRef } from 'react';
import Message from './Message';
import type {MessageProps} from './Message'
import TypingIndicator from './TypingIndicator';

interface ConversationPaneProps {
  messages: MessageProps[];
  isTyping: boolean;
}

const ConversationPane: React.FC<ConversationPaneProps> = ({ messages, isTyping }) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  return (
    <div className="flex-1 overflow-y-auto px-4 py-6 space-y-0">
      <div className="max-w-4xl mx-auto">
        {messages.length === 0 && !isTyping && (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">🔬</span>
            </div>
            <h2 className="text-xl font-semibold text-white mb-2">Welcome to DeepResearch Chat</h2>
            <p className="text-slate-400 max-w-md mx-auto">Start a conversation to dive deep into any topic. Ask questions, explore ideas, and discover insights.</p>
          </div>
        )}
        
        {messages.map((message) => (
          <Message key={message.id} {...message} />
        ))}
        
        {isTyping && <TypingIndicator />}
        
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
};

export default ConversationPane;