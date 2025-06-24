import React from 'react';
import { Bot } from 'lucide-react';

const TypingIndicator: React.FC = () => {
  return (
    <div className="flex gap-3 mb-6 animate-fade-in">
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-slate-700 text-slate-300 flex items-center justify-center">
        <Bot size={16} />
      </div>
      
      <div className="max-w-[80%] sm:max-w-[70%]">
        <div className="inline-block px-4 py-3 bg-slate-700 text-slate-100 rounded-2xl rounded-tl-md">
          <div className="flex items-center gap-1">
            <div className="flex gap-1">
              <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
              <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
              <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TypingIndicator;