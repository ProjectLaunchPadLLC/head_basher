import React, { useState, useEffect } from 'react';
import { TerminalTab } from '../types';
import { Terminal, Shield, GitBranch, Clock } from 'lucide-react';

interface FooterProps {
  activeTab?: TerminalTab;
}

export const Footer: React.FC<FooterProps> = ({ activeTab }) => {
  const [timeStr, setTimeStr] = useState('');

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setTimeStr(now.toLocaleTimeString([], { hour12: false }) + ' UTC');
    };
    updateClock();
    const timer = setInterval(updateClock, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <footer id="app-footer" className="h-7 bg-[#0055ff] flex items-center justify-between px-3 text-white text-[11px] font-mono font-bold select-none border-t border-[#1a1a1a] shrink-0 z-30">
      {/* Left side mode & connection metrics */}
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-1.5 bg-black/20 px-2 py-0.5 rounded text-[10px] tracking-wider uppercase">
          <Terminal className="w-3 h-3 text-emerald-300" />
          <span>COMMAND MODE</span>
        </div>
        <div className="hidden sm:inline text-blue-100 opacity-90">UTF-8</div>
        <div className="hidden md:flex items-center gap-1 text-blue-100 opacity-90">
          <Shield className="w-3 h-3 text-emerald-300" />
          <span>SSH: CONNECTED (22/tcp)</span>
        </div>
        <div className="text-blue-100 opacity-80 hidden lg:inline">
          {activeTab ? activeTab.title : 'bash: main_node'}
        </div>
      </div>

      {/* Right side status & live timestamp */}
      <div className="flex items-center space-x-3 text-[11px]">
        <div className="flex items-center space-x-1 bg-black/20 px-2 py-0.5 rounded">
          <GitBranch className="w-3 h-3 text-amber-300" />
          <span className="text-white">main*</span>
        </div>
        <div className="bg-black/30 px-2.5 py-0.5 rounded flex items-center gap-1 text-emerald-300 font-bold border border-emerald-500/30">
          <Clock className="w-3 h-3 text-emerald-400" />
          <span>{timeStr || '12:00:00 UTC'}</span>
        </div>
      </div>
    </footer>
  );
};
