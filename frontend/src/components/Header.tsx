import React from 'react';
import { FaRobot } from 'react-icons/fa';
import { Settings } from 'lucide-react';

const Header: React.FC = () => {
  return (
    <header className="sticky top-0 z-10 bg-gradient-to-r from-indigo-800 to-indigo-900 shadow-lg py-4 px-6 flex items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        <FaRobot className="text-2xl text-indigo-300" />
        <span className="text-xl font-bold text-white tracking-wide">Alchemyst Chat</span>
      </div>
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