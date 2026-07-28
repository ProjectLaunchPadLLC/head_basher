import React from 'react';
import { Settings, X, Type, Palette, Sliders, Check } from 'lucide-react';
import { TerminalSettings, TerminalThemeName } from '../types';
import { TERMINAL_THEMES } from '../lib/themes';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: TerminalSettings;
  onUpdateSettings: (newSettings: Partial<TerminalSettings>) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
}) => {
  if (!isOpen) return null;

  const fontFamilies = [
    { label: 'JetBrains Mono', value: "'JetBrains Mono', monospace" },
    { label: 'Fira Code', value: "'Fira Code', monospace" },
    { label: 'System Monospace', value: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace" },
  ];

  const themesList = Object.entries(TERMINAL_THEMES) as [TerminalThemeName, any][];

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fadeIn">
      <div className="bg-[#080808] border border-[#1a1a1a] rounded-none w-full max-w-xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden font-mono">
        {/* Modal Header */}
        <div className="p-3 bg-[#0c0c0c] border-b border-[#1a1a1a] px-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <Settings className="w-4 h-4 text-[#00ff41]" />
            <span className="font-bold text-xs uppercase tracking-widest text-neutral-200">
              Terminal Preferences
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-white p-1 rounded hover:bg-[#1a1a1a] cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-5 text-xs font-mono">
          {/* Theme Selector */}
          <div className="space-y-2">
            <label className="text-neutral-300 font-bold uppercase tracking-wider flex items-center gap-1.5">
              <Palette className="w-4 h-4 text-purple-400" /> Color Scheme Theme
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {themesList.map(([key, t]) => {
                const isSelected = settings.theme === key;
                return (
                  <button
                    key={key}
                    onClick={() => onUpdateSettings({ theme: key })}
                    className={`p-2 border text-left transition flex flex-col justify-between h-16 cursor-pointer ${
                      isSelected
                        ? 'border-[#00ff41] bg-emerald-950/40 shadow-md ring-1 ring-[#00ff41]'
                        : 'border-[#1a1a1a] bg-[#050505] hover:border-[#262626]'
                    }`}
                    style={{ backgroundColor: t.background }}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="font-bold truncate text-[11px]" style={{ color: t.foreground }}>
                        {t.name}
                      </span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-[#00ff41]" />}
                    </div>
                    {/* Color Swatch Row */}
                    <div className="flex items-center gap-1">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: t.red }} />
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: t.green }} />
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: t.yellow }} />
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: t.blue }} />
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: t.cyan }} />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Typography Settings */}
          <div className="space-y-3 bg-[#050505] p-3 border border-[#1a1a1a]">
            <label className="text-neutral-300 font-bold uppercase tracking-wider flex items-center gap-1.5">
              <Type className="w-4 h-4 text-[#00ff41]" /> Typography
            </label>

            {/* Font Family */}
            <div className="space-y-1">
              <span className="text-neutral-400 text-[11px]">Font Family</span>
              <select
                value={settings.fontFamily}
                onChange={(e) => onUpdateSettings({ fontFamily: e.target.value })}
                className="w-full bg-[#0c0c0c] border border-[#1a1a1a] rounded px-3 py-1.5 text-neutral-100 focus:outline-none focus:border-[#00ff41] cursor-pointer"
              >
                {fontFamilies.map((f) => (
                  <option key={f.value} value={f.value}>
                    {f.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Font Size */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-neutral-400 text-[11px]">
                <span>Font Size</span>
                <span className="text-neutral-200 font-bold">{settings.fontSize}px</span>
              </div>
              <input
                type="range"
                min={11}
                max={22}
                step={1}
                value={settings.fontSize}
                onChange={(e) => onUpdateSettings({ fontSize: parseInt(e.target.value, 10) })}
                className="w-full accent-[#00ff41] cursor-pointer"
              />
            </div>
          </div>

          {/* Cursor Settings */}
          <div className="space-y-3 bg-slate-950 p-3 rounded-lg border border-slate-800">
            <label className="text-slate-300 font-bold uppercase tracking-wider flex items-center gap-1.5">
              <Sliders className="w-4 h-4 text-amber-400" /> Cursor & Behavior
            </label>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <span className="text-slate-400 text-[11px] block mb-1">Cursor Style</span>
                <select
                  value={settings.cursorStyle}
                  onChange={(e) =>
                    onUpdateSettings({ cursorStyle: e.target.value as any })
                  }
                  className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-slate-100 focus:outline-none focus:border-amber-500 cursor-pointer"
                >
                  <option value="block">Block █</option>
                  <option value="underline">Underline _</option>
                  <option value="bar">Bar |</option>
                </select>
              </div>

              <div className="flex flex-col justify-end">
                <label className="flex items-center gap-2 text-slate-300 cursor-pointer py-1.5">
                  <input
                    type="checkbox"
                    checked={settings.cursorBlink}
                    onChange={(e) => onUpdateSettings({ cursorBlink: e.target.checked })}
                    className="accent-amber-500 w-4 h-4 rounded cursor-pointer"
                  />
                  <span>Cursor Blinking</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="h-12 bg-slate-950 border-t border-slate-800 px-4 flex items-center justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs font-medium cursor-pointer shadow"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
