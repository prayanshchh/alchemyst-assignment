import React, { useState, useRef, useEffect } from 'react';
import { Send } from 'lucide-react';

interface InputBarProps {
  onSendMessage: (message: string) => void;
  disabled?: boolean;
}

const InputBar: React.FC<InputBarProps> = ({ onSendMessage, disabled = false }) => {
  const [message, setMessage] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && !disabled) {
      onSendMessage(message.trim());
      setMessage('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      // Reset height to auto to get the correct scrollHeight
      textarea.style.height = 'auto';
      
      // Calculate the new height based on content, with min and max constraints
      const minHeight = 52; // Minimum height for single line
      const maxHeight = 160; // Maximum height (about 8 lines)
      const scrollHeight = textarea.scrollHeight;
      
      // Set the height to fit content, within our constraints
      const newHeight = Math.min(Math.max(scrollHeight, minHeight), maxHeight);
      textarea.style.height = `${newHeight}px`;
      
      // If content exceeds max height, enable scrolling
      if (scrollHeight > maxHeight) {
        textarea.style.overflowY = 'auto';
      } else {
        textarea.style.overflowY = 'hidden';
      }
    }
  };

  useEffect(() => {
    adjustTextareaHeight();
  }, [message]);

  // Reset height when message is cleared
  useEffect(() => {
    if (message === '') {
      const textarea = textareaRef.current;
      if (textarea) {
        textarea.style.height = '52px';
        textarea.style.overflowY = 'hidden';
      }
    }
  }, [message]);

  const canSend = message.trim().length > 0 && !disabled;

  return (
    <div className="border-t border-slate-700/50 bg-slate-900/90 backdrop-blur-sm px-4 py-4">
      <form onSubmit={handleSubmit} className="max-w-4xl mx-auto">
        <div className="relative flex items-end gap-3">
          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your message..."
              disabled={disabled}
              rows={1}
              className="w-full bg-slate-800/80 text-white placeholder-slate-400 border border-slate-600/50 rounded-2xl px-5 py-3.5 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg backdrop-blur-sm hover:bg-slate-800/90 hover:border-slate-500/50"
              style={{ 
                minHeight: '52px',
                maxHeight: '160px',
                lineHeight: '1.5',
                overflowY: 'hidden'
              }}
            />
            
            {/* Character count indicator for long messages */}
            {message.length > 500 && (
              <div className="absolute -top-6 right-2 text-xs text-slate-400">
                {message.length}/2000
              </div>
            )}
          </div>
          
          <button
            type="submit"
            disabled={!canSend}
            className={`flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:ring-offset-2 focus:ring-offset-slate-900 shadow-lg ${
              canSend
                ? 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white transform hover:scale-105 active:scale-95 shadow-blue-500/25'
                : 'bg-slate-700/50 text-slate-500 cursor-not-allowed'
            }`}
            aria-label="Send message"
          >
            <Send size={18} className={canSend ? 'transform transition-transform duration-200' : ''} />
          </button>
        </div>
        
        {/* Subtle hint text */}
        <div className="mt-2 text-xs text-slate-500 text-center">
          Press Enter to send • Shift + Enter for new line
        </div>
      </form>
    </div>
  );
};

export default InputBar;