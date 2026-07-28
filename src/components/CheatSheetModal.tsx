import React, { useState, useEffect } from 'react';
import { BookOpen, Search, Copy, Play, X, Check, Terminal } from 'lucide-react';
import { CheatCommand } from '../types';

interface CheatSheetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRunCommand: (cmd: string) => void;
}

export const CheatSheetModal: React.FC<CheatSheetModalProps> = ({
  isOpen,
  onClose,
  onRunCommand,
}) => {
  const [commands, setCommands] = useState<CheatCommand[]>([]);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetch('/api/cheatsheet')
        .then((res) => res.json())
        .then((data) => setCommands(data))
        .catch(() => {});
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const categories = ['All', 'System', 'Files', 'Network', 'Git', 'Process', 'Package'];

  const filteredCommands = commands.filter((cmd) => {
    const matchesCategory = selectedCategory === 'All' || cmd.category === selectedCategory;
    const matchesSearch =
      cmd.command.toLowerCase().includes(search.toLowerCase()) ||
      cmd.description.toLowerCase().includes(search.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleCopy = (cmd: CheatCommand) => {
    navigator.clipboard.writeText(cmd.command);
    setCopiedId(cmd.id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fadeIn">
      <div className="bg-[#080808] border border-[#1a1a1a] rounded-none w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden font-mono">
        {/* Modal Header */}
        <div className="p-3 bg-[#0c0c0c] border-b border-[#1a1a1a] px-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-[#00ff41]" />
            <span className="font-bold text-xs uppercase tracking-widest text-neutral-200">
              Linux Bash Cheat Sheet
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-white p-1 rounded hover:bg-[#1a1a1a] cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search & Category Filter */}
        <div className="p-3 bg-[#050505] border-b border-[#1a1a1a] space-y-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-neutral-500 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search Linux commands or descriptions..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-[#0c0c0c] border border-[#1a1a1a] rounded pl-9 pr-3 py-1.5 text-xs text-neutral-200 focus:outline-none focus:border-[#00ff41] font-mono"
            />
          </div>

          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar pb-1">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-2.5 py-1 rounded-none text-xs font-mono transition cursor-pointer shrink-0 ${
                  selectedCategory === cat
                    ? 'bg-emerald-950/80 text-[#00ff41] border border-emerald-500/80 font-semibold'
                    : 'bg-[#121212] text-neutral-400 hover:text-neutral-200 border border-[#1a1a1a]'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Commands List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {filteredCommands.length === 0 && (
            <div className="text-center py-12 text-neutral-500 text-xs font-mono">
              No matching Linux commands found.
            </div>
          )}

          {filteredCommands.map((cmd) => (
            <div
              key={cmd.id}
              className="bg-[#050505] border border-[#1a1a1a] hover:border-[#262626] p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 transition"
            >
              <div className="space-y-1 font-mono">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-[#00ff41] bg-[#000000] px-2 py-0.5 border border-[#1a1a1a]">
                    $ {cmd.command}
                  </span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#181818] text-neutral-400 border border-[#222]">
                    {cmd.category}
                  </span>
                </div>
                <p className="text-xs text-neutral-400 font-sans">{cmd.description}</p>
              </div>

              <div className="flex items-center gap-1 shrink-0 self-end sm:self-center">
                <button
                  onClick={() => handleCopy(cmd)}
                  className="px-2.5 py-1 bg-[#181818] hover:bg-[#262626] text-neutral-300 rounded text-xs font-mono flex items-center gap-1 transition cursor-pointer border border-[#1a1a1a]"
                  title="Copy command"
                >
                  {copiedId === cmd.id ? (
                    <Check className="w-3.5 h-3.5 text-[#00ff41]" />
                  ) : (
                    <Copy className="w-3.5 h-3.5 text-neutral-400" />
                  )}
                  <span>{copiedId === cmd.id ? 'Copied' : 'Copy'}</span>
                </button>
                <button
                  onClick={() => {
                    onRunCommand(cmd.command);
                    onClose();
                  }}
                  className="px-2.5 py-1 bg-[#00ff41]/20 hover:bg-[#00ff41]/30 border border-[#00ff41]/80 text-[#00ff41] font-bold rounded text-xs font-mono flex items-center gap-1 transition cursor-pointer shadow"
                  title="Run in active terminal tab"
                >
                  <Play className="w-3.5 h-3.5 fill-[#00ff41]" />
                  <span>Run</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
