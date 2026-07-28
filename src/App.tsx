import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { TerminalView } from './components/TerminalView';
import { FileExplorer } from './components/FileExplorer';
import { ProcessManager } from './components/ProcessManager';
import { CheatSheetModal } from './components/CheatSheetModal';
import { SettingsModal } from './components/SettingsModal';
import { PwaInstallBanner } from './components/PwaInstallBanner';

import { TerminalTab, TerminalSettings, TerminalThemeName } from './types';

const DEFAULT_SETTINGS: TerminalSettings = {
  fontFamily: "'Courier New', Courier, 'JetBrains Mono', monospace",
  fontSize: 13,
  lineHeight: 1.2,
  cursorStyle: 'block',
  cursorBlink: true,
  theme: 'highDensity',
  scrollback: 5000,
  bell: false,
};

export default function App() {
  const [tabs, setTabs] = useState<TerminalTab[]>([
    {
      id: 'tab-1',
      title: 'Bash Shell #1',
      cwd: '~',
      status: 'connecting',
      lastActive: Date.now(),
    },
  ]);

  const [activeTabId, setActiveTabId] = useState<string>('tab-1');
  const [activePanel, setActivePanel] = useState<'file' | 'sys' | null>(null);

  const [isCheatSheetOpen, setIsCheatSheetOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Settings state with LocalStorage persistence
  const [settings, setSettings] = useState<TerminalSettings>(() => {
    try {
      const saved = localStorage.getItem('linux_term_settings');
      return saved ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) } : DEFAULT_SETTINGS;
    } catch (e) {
      return DEFAULT_SETTINGS;
    }
  });

  const handleUpdateSettings = (newSettings: Partial<TerminalSettings>) => {
    setSettings((prev) => {
      const updated = { ...prev, ...newSettings };
      try {
        localStorage.setItem('linux_term_settings', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
  };

  const handleNewTab = () => {
    const newId = `tab-${Date.now().toString(36)}`;
    const newTab: TerminalTab = {
      id: newId,
      title: `Bash Shell #${tabs.length + 1}`,
      cwd: '~',
      status: 'connecting',
      lastActive: Date.now(),
    };
    setTabs((prev) => [...prev, newTab]);
    setActiveTabId(newId);
  };

  const handleCloseTab = (id: string) => {
    if (tabs.length <= 1) return; // Keep at least 1 tab
    const nextTabs = tabs.filter((t) => t.id !== id);
    setTabs(nextTabs);

    if (activeTabId === id) {
      setActiveTabId(nextTabs[nextTabs.length - 1].id);
    }
  };

  const handleUpdateTabStatus = (
    id: string,
    status: 'connecting' | 'connected' | 'disconnected' | 'error'
  ) => {
    setTabs((prev) =>
      prev.map((t) => (t.id === id ? { ...t, status } : t))
    );
  };

  const handleTogglePanel = (panel: 'file' | 'sys') => {
    setActivePanel((prev) => (prev === panel ? null : panel));
  };

  // Helper to send command string to active terminal tab
  const handleExecuteInTerminal = (cmd: string) => {
    // We dispatch custom event or keyboard signal to active tab
    const event = new CustomEvent('terminal-execute-cmd', { detail: { cmd, tabId: activeTabId } });
    window.dispatchEvent(event);
  };

  return (
    <div id="app-root" className="h-screen w-screen flex flex-col bg-[#050505] text-neutral-200 overflow-hidden select-none font-mono">
      {/* PWA Install Notification Banner */}
      <PwaInstallBanner />

      {/* App Top Navigation & Session Tabs */}
      <Header
        tabs={tabs}
        activeTabId={activeTabId}
        onSelectTab={setActiveTabId}
        onNewTab={handleNewTab}
        onCloseTab={handleCloseTab}
        activePanel={activePanel}
        onTogglePanel={handleTogglePanel}
        onOpenCheatSheet={() => setIsCheatSheetOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        currentTheme={settings.theme}
      />

      {/* Main Workspace Body */}
      <main className="flex-1 flex overflow-hidden relative">
        {/* Terminal Instances (Keep alive in background when switching tabs) */}
        <div className="flex-1 flex flex-col h-full overflow-hidden relative">
          {tabs.map((tab) => (
            <TerminalView
              key={tab.id}
              tab={tab}
              settings={settings}
              isActive={tab.id === activeTabId}
              onUpdateTabStatus={handleUpdateTabStatus}
            />
          ))}
        </div>

        {/* Side Drawers */}
        {activePanel === 'file' && (
          <FileExplorer
            onClose={() => setActivePanel(null)}
            onExecuteInTerminal={handleExecuteInTerminal}
          />
        )}

        {activePanel === 'sys' && (
          <ProcessManager
            onClose={() => setActivePanel(null)}
            onExecuteInTerminal={handleExecuteInTerminal}
          />
        )}
      </main>

      {/* Status Bar Footer */}
      <Footer />

      {/* Modals */}
      <CheatSheetModal
        isOpen={isCheatSheetOpen}
        onClose={() => setIsCheatSheetOpen(false)}
        onRunCommand={handleExecuteInTerminal}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onUpdateSettings={handleUpdateSettings}
      />
    </div>
  );
}
