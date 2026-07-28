import React from 'react';
import { 
  Terminal, 
  Plus, 
  X, 
  FolderTree, 
  Activity, 
  BookOpen, 
  Settings,
  Cpu,
  HardDrive,
  Activity as PulseIcon
} from 'lucide-react';
import { TerminalTab, TerminalThemeName } from '../types';

interface HeaderProps {
  tabs: TerminalTab[];
  activeTabId: string;
  onSelectTab: (id: string) => void;
  onNewTab: () => void;
  onCloseTab: (id: string) => void;
  activePanel: 'file' | 'sys' | null;
  onTogglePanel: (panel: 'file' | 'sys') => void;
  onOpenCheatSheet: () => void;
  onOpenSettings: () => void;
  currentTheme: TerminalThemeName;
}

export const Header: React.FC<HeaderProps> = ({
  tabs,
  activeTabId,
  onSelectTab,
  onNewTab,
  onCloseTab,
  activePanel,
  onTogglePanel,
  onOpenCheatSheet,
  onOpenSettings,
  currentTheme,
}) => {
  return (
    <header id="app-header" className="h-10 bg-[#0c0c0c] border-b border-[#1a1a1a] flex items-center justify-between px-3 select-none z-30 shrink-0 font-mono">
      {/* Window Controls & Brand & Tabs Section */}
      <div className="flex items-center space-x-3 overflow-x-auto no-scrollbar max-w-[65%]">
        {/* macOS / Window control dots */}
        <div className="hidden sm:flex space-x-1.5 items-center mr-1 shrink-0">
          <div className="w-2.5 h-2.5 rounded-full bg-red-500/30 border border-red-500" />
          <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/30 border border-yellow-500" />
          <div className="w-2.5 h-2.5 rounded-full bg-green-500/30 border border-green-500" />
        </div>

        {/* Brand OS Title */}
        <div className="flex items-center space-x-2 border-r border-[#1a1a1a] pr-3 shrink-0">
          <Terminal className="w-3.5 h-3.5 text-emerald-400" />
          <span className="text-xs font-bold text-slate-200 tracking-tighter uppercase hidden md:inline">TermOS v4.2</span>
        </div>

        {/* Tab Navigation Items */}
        <nav className="flex space-x-1 items-center">
          {tabs.map((tab, idx) => {
            const isActive = tab.id === activeTabId;
            return (
              <div
                key={tab.id}
                id={`tab-${tab.id}`}
                onClick={() => onSelectTab(tab.id)}
                className={`group relative flex items-center gap-2 px-3 py-1 text-[11px] font-mono transition cursor-pointer border-x border-t border-b-0 ${
                  isActive
                    ? 'bg-[#1a1a1a] border-[#262626] text-white font-semibold'
                    : 'bg-[#080808] hover:bg-[#111111] border-[#1a1a1a] text-neutral-400 hover:text-slate-200'
                }`}
              >
                {/* Connection Status Indicator */}
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    tab.status === 'connected'
                      ? 'bg-[#00ff41] shadow-[0_0_6px_rgba(0,255,65,0.8)]'
                      : tab.status === 'connecting'
                      ? 'bg-amber-400 animate-pulse'
                      : 'bg-rose-500'
                  }`}
                  title={`Status: ${tab.status}`}
                />

                <span className="truncate max-w-[100px] sm:max-w-[140px]">
                  {tab.title || `bash: node_${idx + 1}`}
                </span>

                {tabs.length > 1 && (
                  <button
                    id={`btn-close-tab-${tab.id}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      onCloseTab(tab.id);
                    }}
                    className="p-0.5 rounded hover:bg-neutral-800 text-neutral-400 hover:text-white transition opacity-70 group-hover:opacity-100 cursor-pointer"
                    title="Close tab"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            );
          })}

          {/* Add Tab Button */}
          <button
            id="btn-add-tab"
            onClick={onNewTab}
            className="px-2 py-0.5 text-[11px] text-neutral-400 hover:text-white hover:bg-[#111] border border-[#1a1a1a] transition cursor-pointer"
            title="Open new shell session"
          >
            +
          </button>
        </nav>
      </div>

      {/* Top Header Live Telemetry Metrics & Quick Tools */}
      <div className="flex items-center space-x-4 shrink-0 text-[11px]">
        <div className="hidden lg:flex items-center space-x-4 opacity-80 text-neutral-300">
          <span className="status-glow text-[#00ff41] flex items-center gap-1 font-bold">
            <Cpu className="w-3 h-3 text-[#00ff41]" />
            CPU: 12.4%
          </span>
          <span className="flex items-center gap-1">
            <HardDrive className="w-3 h-3 text-blue-400" />
            MEM: 2.1GB / 8GB
          </span>
          <span className="text-neutral-400">UP: 14d 02h</span>
          <span className="text-white bg-green-950/60 border border-green-800/80 px-2 py-0.5 rounded text-[10px] tracking-wider">
            SSH: CONNECTED
          </span>
        </div>

        {/* Toolbar Buttons */}
        <div className="flex items-center gap-1">
          <button
            id="btn-toggle-file-explorer"
            onClick={() => onTogglePanel('file')}
            className={`px-2 py-0.5 text-[11px] font-mono border transition cursor-pointer flex items-center gap-1 ${
              activePanel === 'file'
                ? 'bg-blue-950/80 text-blue-400 border-blue-600/80'
                : 'bg-[#111111] hover:bg-[#1a1a1a] text-neutral-300 border-[#1a1a1a]'
            }`}
            title="Toggle Project Files Explorer"
          >
            <FolderTree className="w-3 h-3 text-blue-400" />
            <span className="hidden md:inline">Files</span>
          </button>

          <button
            id="btn-toggle-system-monitor"
            onClick={() => onTogglePanel('sys')}
            className={`px-2 py-0.5 text-[11px] font-mono border transition cursor-pointer flex items-center gap-1 ${
              activePanel === 'sys'
                ? 'bg-emerald-950/80 text-[#00ff41] border-emerald-600/80'
                : 'bg-[#111111] hover:bg-[#1a1a1a] text-neutral-300 border-[#1a1a1a]'
            }`}
            title="Toggle System Monitor"
          >
            <PulseIcon className="w-3 h-3 text-[#00ff41]" />
            <span className="hidden md:inline">System</span>
          </button>

          <button
            id="btn-open-cheatsheet"
            onClick={onOpenCheatSheet}
            className="px-2 py-0.5 text-[11px] font-mono bg-[#111111] hover:bg-[#1a1a1a] text-neutral-300 border border-[#1a1a1a] transition cursor-pointer flex items-center gap-1"
            title="Open Linux Command Cheat Sheet"
          >
            <BookOpen className="w-3 h-3 text-amber-400" />
            <span className="hidden lg:inline">Cheat Sheet</span>
          </button>

          <button
            id="btn-open-settings"
            onClick={onOpenSettings}
            className="p-1 bg-[#111111] hover:bg-[#1a1a1a] text-neutral-400 hover:text-white border border-[#1a1a1a] transition cursor-pointer"
            title="Preferences & Themes"
          >
            <Settings className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </header>
  );
};

