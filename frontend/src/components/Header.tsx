import React from 'react';
import { Settings } from 'lucide-react';

const Header: React.FC = () => {
  return (
    <header className="bg-slate-900/80 backdrop-blur-sm border-b border-slate-700/50 px-4 py-3 flex items-center justify-between sticky top-0 z-10">
      <h1 className="text-xl font-semibold text-white">DeepResearch Chat</h1>
      <button
        className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700/50 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-900"
        aria-label="Settings"
      >
        <Settings size={20} />
      </button>
    </header>
  );
};

export default Header;