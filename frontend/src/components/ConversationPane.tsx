import React, { useEffect, useRef } from 'react';
import Message from './Message';
import type { MessageProps as _MessageProps } from './Message';
import TypingIndicator from './TypingIndicator';
import { FaUser, FaRobot } from 'react-icons/fa';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface MessageProps extends _MessageProps {
  faded?: boolean;
}

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
        
        <div className="flex flex-col gap-4">
          {messages.map((msg, idx) => (
            <div
              key={msg.id}
              className={`flex items-end ${msg.sender === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}
            >
              {msg.sender === 'assistant' && (
                <FaRobot className="text-indigo-400 mr-2 mb-1" />
              )}
              <div
                className={`px-4 py-2 rounded-2xl shadow max-w-[75%] whitespace-pre-line ${
                  msg.sender === 'user'
                    ? 'bg-indigo-600 text-white rounded-br-none'
                    : 'bg-white/80 text-slate-900 rounded-bl-none'
                } ${msg.faded ? 'opacity-60' : ''}`}
              >
                {msg.sender === 'assistant' ? (
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      h1: ({node, ...props}) => <h1 className="text-2xl font-bold mt-4 mb-2" {...props} />,
                      h2: ({node, ...props}) => <h2 className="text-xl font-bold mt-3 mb-1" {...props} />,
                      h3: ({node, ...props}) => <h3 className="text-lg font-semibold mt-2 mb-1" {...props} />,
                      ul: ({node, ...props}) => <ul className="list-disc ml-6 mb-2" {...props} />,
                      ol: ({node, ...props}) => <ol className="list-decimal ml-6 mb-2" {...props} />,
                      li: ({node, ...props}) => <li className="mb-1" {...props} />,
                      a: ({node, ...props}) => <a className="text-indigo-600 underline" target="_blank" rel="noopener noreferrer" {...props} />,
                      strong: ({node, ...props}) => <strong className="font-bold" {...props} />,
                      em: ({node, ...props}) => <em className="italic" {...props} />,
                      hr: () => <hr className="my-4 border-slate-300" />,
                      blockquote: ({node, ...props}) => <blockquote className="border-l-4 border-indigo-400 pl-4 italic text-slate-600 my-2" {...props} />,
                      code: ({node, ...props}) => <code className="bg-slate-200 text-slate-800 px-1 rounded" {...props} />,
                      pre: ({node, ...props}) => <pre className="bg-slate-800 text-white p-2 rounded my-2 overflow-x-auto" {...props} />,
                      p: ({node, ...props}) => <p className="mb-2" {...props} />,
                    }}
                  >
                    {msg.content}
                  </ReactMarkdown>
                ) : (
                  msg.content
                )}
              </div>
              {msg.sender === 'user' && (
                <FaUser className="text-indigo-200 ml-2 mb-1" />
              )}
            </div>
          ))}
        </div>
        
        {isTyping && <TypingIndicator />}
        
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
};

export default ConversationPane;