import React from 'react';
import { User, Bot } from 'lucide-react';

export interface MessageProps {
  id: string;
  content: string;
  sender: 'user' | 'assistant';
  timestamp: Date;
}

const Message: React.FC<MessageProps> = ({ content, sender }) => {
  const isUser = sender === 'user';

  return (
    <div 
      className={`flex gap-3 mb-6 animate-fade-in ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
    >
      <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
        isUser 
          ? 'bg-blue-600 text-white' 
          : 'bg-slate-700 text-slate-300'
      }`}>
        {isUser ? <User size={16} /> : <Bot size={16} />}
      </div>
      
      <div className={`max-w-[80%] sm:max-w-[70%] ${isUser ? 'text-right' : 'text-left'}`}>
        <div className={`inline-block px-4 py-3 rounded-2xl text-sm leading-relaxed ${
          isUser
            ? 'bg-blue-600 text-white rounded-tr-md'
            : 'bg-slate-700 text-slate-100 rounded-tl-md'
        }`}>
          <p className="whitespace-pre-wrap break-words">{content}</p>
        </div>
      </div>
    </div>
  );
};

export default Message;