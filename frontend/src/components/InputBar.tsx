import React, { useState } from 'react';
import { FaPaperPlane } from 'react-icons/fa';

interface InputBarProps {
  onSendMessage: (message: string) => void;
  disabled?: boolean;
}

const InputBar: React.FC<InputBarProps> = ({ onSendMessage, disabled = false }) => {
  const [value, setValue] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (value.trim() && !disabled) {
      onSendMessage(value.trim());
      setValue('');
    }
  };

  const canSend = value.trim().length > 0 && !disabled;

  return (
    <form
      className="flex items-center gap-2"
      onSubmit={handleSubmit}
    >
      <input
        className="flex-1 bg-transparent border border-white/30 rounded-full px-4 py-2 text-white placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-400 shadow"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        disabled={disabled}
        placeholder="Type your research topic..."
      />
      <button
        type="submit"
        disabled={!canSend}
        className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-full p-2 transition-colors duration-200 shadow"
      >
        <FaPaperPlane />
      </button>
    </form>
  );
};

export default InputBar;