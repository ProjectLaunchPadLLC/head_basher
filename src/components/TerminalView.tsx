import React, { useEffect, useRef, useState } from 'react';
import { Terminal as XTerm } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { WebLinksAddon } from '@xterm/addon-web-links';
import '@xterm/xterm/css/xterm.css';

import { TerminalSettings, TerminalTab } from '../types';
import { TERMINAL_THEMES } from '../lib/themes';
import { 
  CornerDownLeft, 
  Trash2, 
  RotateCw, 
  Maximize2, 
  Copy, 
  Terminal as TermIcon,
  HelpCircle,
  Sliders
} from 'lucide-react';

interface TerminalViewProps {
  tab: TerminalTab;
  settings: TerminalSettings;
  isActive: boolean;
  onUpdateTabStatus: (id: string, status: 'connecting' | 'connected' | 'disconnected' | 'error') => void;
}

export const TerminalView: React.FC<TerminalViewProps> = ({
  tab,
  settings,
  isActive,
  onUpdateTabStatus,
}) => {
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<XTerm | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const socketRef = useRef<WebSocket | null>(null);

  const [connected, setConnected] = useState(false);
  const [ctrlActive, setCtrlActive] = useState(false);

  // Initialize and connect XTerm
  useEffect(() => {
    if (!terminalRef.current) return;

    // Destroy existing xterm instance if present
    if (xtermRef.current) {
      xtermRef.current.dispose();
      xtermRef.current = null;
    }

    const themeColors = TERMINAL_THEMES[settings.theme] || TERMINAL_THEMES.dracula;

    // Create xterm instance
    const term = new XTerm({
      fontFamily: settings.fontFamily || "'JetBrains Mono', 'Fira Code', monospace",
      fontSize: settings.fontSize || 14,
      lineHeight: settings.lineHeight || 1.2,
      cursorStyle: settings.cursorStyle || 'block',
      cursorBlink: settings.cursorBlink ?? true,
      scrollback: settings.scrollback || 5000,
      theme: {
        background: themeColors.background,
        foreground: themeColors.foreground,
        cursor: themeColors.cursor,
        cursorAccent: themeColors.cursorAccent,
        selectionBackground: themeColors.selectionBackground,
        black: themeColors.black,
        red: themeColors.red,
        green: themeColors.green,
        yellow: themeColors.yellow,
        blue: themeColors.blue,
        magenta: themeColors.magenta,
        cyan: themeColors.cyan,
        white: themeColors.white,
        brightBlack: themeColors.brightBlack,
        brightRed: themeColors.brightRed,
        brightGreen: themeColors.brightGreen,
        brightYellow: themeColors.brightYellow,
        brightBlue: themeColors.brightBlue,
        brightMagenta: themeColors.brightMagenta,
        brightCyan: themeColors.brightCyan,
        brightWhite: themeColors.brightWhite,
      },
      convertEol: true,
      allowProposedApi: true,
    });

    const fitAddon = new FitAddon();
    const webLinksAddon = new WebLinksAddon();

    term.loadAddon(fitAddon);
    term.loadAddon(webLinksAddon);

    term.open(terminalRef.current);
    fitAddon.fit();

    xtermRef.current = term;
    fitAddonRef.current = fitAddon;

    // Build WebSocket protocol string (ws or wss)
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    const wsUrl = `${protocol}//${host}/ws/terminal?id=${tab.id}`;

    onUpdateTabStatus(tab.id, 'connecting');

    const ws = new WebSocket(wsUrl);
    socketRef.current = ws;

    ws.onopen = () => {
      setConnected(true);
      onUpdateTabStatus(tab.id, 'connected');
      term.focus();
      // Send initial dimensions
      ws.send(JSON.stringify({ type: 'resize', cols: term.cols, rows: term.rows }));
    };

    ws.onmessage = (event) => {
      term.write(event.data);
    };

    ws.onerror = () => {
      setConnected(false);
      onUpdateTabStatus(tab.id, 'error');
      term.writeln('\r\n\x1b[31m[WebSocket Connection Error]\x1b[0m');
    };

    ws.onclose = () => {
      setConnected(false);
      onUpdateTabStatus(tab.id, 'disconnected');
      term.writeln('\r\n\x1b[33m[Session Disconnected - Click Reconnect or press Enter]\x1b[0m');
    };

    // Forward user keystrokes from terminal -> WebSocket backend
    term.onData((data) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(data);
      }
    });

    // Handle window resize
    const handleResize = () => {
      if (fitAddonRef.current && xtermRef.current) {
        fitAddonRef.current.fit();
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(
            JSON.stringify({
              type: 'resize',
              cols: xtermRef.current.cols,
              rows: xtermRef.current.rows,
            })
          );
        }
      }
    };

    window.addEventListener('resize', handleResize);
    const observer = new ResizeObserver(() => handleResize());
    if (terminalRef.current) {
      observer.observe(terminalRef.current);
    }

    return () => {
      window.removeEventListener('resize', handleResize);
      observer.disconnect();
      if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
        ws.close();
      }
      term.dispose();
    };
  }, [tab.id]);

  // Update theme & settings dynamically when props change
  useEffect(() => {
    if (!xtermRef.current) return;
    const themeColors = TERMINAL_THEMES[settings.theme] || TERMINAL_THEMES.dracula;

    xtermRef.current.options.theme = {
      background: themeColors.background,
      foreground: themeColors.foreground,
      cursor: themeColors.cursor,
      cursorAccent: themeColors.cursorAccent,
      selectionBackground: themeColors.selectionBackground,
      black: themeColors.black,
      red: themeColors.red,
      green: themeColors.green,
      yellow: themeColors.yellow,
      blue: themeColors.blue,
      magenta: themeColors.magenta,
      cyan: themeColors.cyan,
      white: themeColors.white,
      brightBlack: themeColors.brightBlack,
      brightRed: themeColors.brightRed,
      brightGreen: themeColors.brightGreen,
      brightYellow: themeColors.brightYellow,
      brightBlue: themeColors.brightBlue,
      brightMagenta: themeColors.brightMagenta,
      brightCyan: themeColors.brightCyan,
      brightWhite: themeColors.brightWhite,
    };
    xtermRef.current.options.fontSize = settings.fontSize;
    xtermRef.current.options.fontFamily = settings.fontFamily;
    xtermRef.current.options.cursorStyle = settings.cursorStyle;
    xtermRef.current.options.cursorBlink = settings.cursorBlink;

    if (fitAddonRef.current) {
      fitAddonRef.current.fit();
    }
  }, [settings]);

  // Focus when tab becomes active
  useEffect(() => {
    if (isActive && xtermRef.current) {
      setTimeout(() => {
        fitAddonRef.current?.fit();
        xtermRef.current?.focus();
      }, 50);
    }
  }, [isActive]);

  // Listen for custom execute command events from CheatSheet or FileExplorer
  useEffect(() => {
    const handleCustomCmd = (e: any) => {
      if (e.detail && e.detail.tabId === tab.id && e.detail.cmd) {
        sendKey(`${e.detail.cmd}\r`);
      }
    };
    window.addEventListener('terminal-execute-cmd', handleCustomCmd);
    return () => window.removeEventListener('terminal-execute-cmd', handleCustomCmd);
  }, [tab.id]);

  // Helper send key to terminal
  const sendKey = (keyString: string) => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(keyString);
    }
    xtermRef.current?.focus();
  };

  const handleReconnect = () => {
    // Force re-mount connection
    onUpdateTabStatus(tab.id, 'connecting');
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    const wsUrl = `${protocol}//${host}/ws/terminal?id=${tab.id}&t=${Date.now()}`;

    if (socketRef.current) {
      socketRef.current.close();
    }

    const ws = new WebSocket(wsUrl);
    socketRef.current = ws;

    ws.onopen = () => {
      setConnected(true);
      onUpdateTabStatus(tab.id, 'connected');
      xtermRef.current?.focus();
      if (xtermRef.current) {
        ws.send(JSON.stringify({ type: 'resize', cols: xtermRef.current.cols, rows: xtermRef.current.rows }));
      }
    };

    ws.onmessage = (event) => {
      xtermRef.current?.write(event.data);
    };

    ws.onclose = () => {
      setConnected(false);
      onUpdateTabStatus(tab.id, 'disconnected');
    };
  };

  const handleClear = () => {
    xtermRef.current?.clear();
    sendKey('clear\r');
  };

  const themeColors = TERMINAL_THEMES[settings.theme] || TERMINAL_THEMES.dracula;

  return (
    <div
      id={`terminal-view-${tab.id}`}
      className={`flex-1 flex flex-col h-full w-full relative overflow-hidden grid-pattern ${
        isActive ? 'block' : 'hidden'
      }`}
      style={{ backgroundColor: themeColors.background }}
    >
      {/* Top Session Status / Reconnect Bar if Disconnected */}
      {!connected && (
        <div className="bg-amber-950/90 border-b border-amber-800 text-amber-200 px-4 py-1.5 text-xs flex items-center justify-between z-20 font-mono">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
            <span>Session disconnected or connecting...</span>
          </div>
          <button
            onClick={handleReconnect}
            className="px-2.5 py-0.5 bg-amber-600 hover:bg-amber-500 text-white rounded transition flex items-center gap-1 cursor-pointer font-medium"
          >
            <RotateCw className="w-3 h-3" />
            Reconnect Session
          </button>
        </div>
      )}

      {/* Main Terminal Screen Canvas */}
      <div
        ref={terminalRef}
        className="flex-1 w-full h-full p-2 overflow-hidden cursor-text text-sm select-text"
        onClick={() => xtermRef.current?.focus()}
      />

      {/* Floating Quick Action Overlay Buttons (High Density Theme) */}
      <div className="absolute bottom-12 right-4 hidden sm:flex space-x-2 z-20 pointer-events-auto">
        <button
          onClick={handleClear}
          className="px-3 py-1 bg-[#111111] hover:bg-[#1a1a1a] border border-[#1a1a1a] text-[10px] text-neutral-400 hover:text-white font-mono cursor-pointer transition shadow-lg"
          title="Clear screen buffer"
        >
          CLEAR
        </button>
        <button
          onClick={() => {
            const buffer = xtermRef.current?.getSelection() || 'Terminal buffer copied';
            navigator.clipboard?.writeText(buffer);
          }}
          className="px-3 py-1 bg-[#111111] hover:bg-[#1a1a1a] border border-[#1a1a1a] text-[10px] text-neutral-400 hover:text-white font-mono cursor-pointer transition shadow-lg"
          title="Copy buffer selection"
        >
          COPY ALL
        </button>
        <button
          onClick={() => sendKey('npm run build\r')}
          className="px-3 py-1 bg-green-950/80 hover:bg-green-900/90 border border-emerald-500/80 text-[10px] text-[#00ff41] font-mono cursor-pointer transition shadow-lg font-bold status-glow"
          title="Trigger project build"
        >
          DEPLOY
        </button>
      </div>

      {/* Mobile & Touch Helper Virtual Keyboard Toolbar */}
      <div id="mobile-terminal-keys" className="bg-[#0c0c0c]/90 backdrop-blur-md border-t border-[#1a1a1a] p-1.5 flex items-center gap-1 overflow-x-auto no-scrollbar z-20 shrink-0 font-mono">
        <button
          onClick={() => sendKey('\x1b')}
          className="px-2.5 py-1 rounded bg-[#181818] hover:bg-[#262626] text-neutral-200 text-xs font-mono border border-[#262626] active:bg-neutral-800 transition shrink-0 cursor-pointer"
        >
          ESC
        </button>
        <button
          onClick={() => sendKey('\t')}
          className="px-2.5 py-1 rounded bg-[#181818] hover:bg-[#262626] text-neutral-200 text-xs font-mono border border-[#262626] active:bg-neutral-800 transition shrink-0 cursor-pointer"
        >
          TAB
        </button>
        <button
          onClick={() => sendKey('\x03')}
          className="px-2 py-1 rounded bg-rose-950/80 hover:bg-rose-900 text-rose-200 text-xs font-mono border border-rose-800 active:bg-rose-800 transition shrink-0 flex items-center gap-1 cursor-pointer"
          title="Ctrl+C Interrupt"
        >
          <span className="font-bold">Ctrl+C</span>
        </button>
        <button
          onClick={() => sendKey('\x04')}
          className="px-2.5 py-1 rounded bg-[#181818] hover:bg-[#262626] text-neutral-200 text-xs font-mono border border-[#262626] active:bg-neutral-800 transition shrink-0 cursor-pointer"
          title="Ctrl+D EOF"
        >
          Ctrl+D
        </button>
        <button
          onClick={() => sendKey('\x1b[A')}
          className="px-2 py-1 rounded bg-[#181818] hover:bg-[#262626] text-neutral-200 text-xs font-mono border border-[#262626] active:bg-neutral-800 transition shrink-0 cursor-pointer"
          title="Up Arrow (History)"
        >
          ▲
        </button>
        <button
          onClick={() => sendKey('\x1b[B')}
          className="px-2 py-1 rounded bg-[#181818] hover:bg-[#262626] text-neutral-200 text-xs font-mono border border-[#262626] active:bg-neutral-800 transition shrink-0 cursor-pointer"
          title="Down Arrow (History)"
        >
          ▼
        </button>
        <button
          onClick={() => sendKey('\x1b[D')}
          className="px-2 py-1 rounded bg-[#181818] hover:bg-[#262626] text-neutral-200 text-xs font-mono border border-[#262626] active:bg-neutral-800 transition shrink-0 cursor-pointer"
        >
          ◄
        </button>
        <button
          onClick={() => sendKey('\x1b[C')}
          className="px-2 py-1 rounded bg-[#181818] hover:bg-[#262626] text-neutral-200 text-xs font-mono border border-[#262626] active:bg-neutral-800 transition shrink-0 cursor-pointer"
        >
          ►
        </button>
        <button
          onClick={() => sendKey('|')}
          className="px-2.5 py-1 rounded bg-[#181818] hover:bg-[#262626] text-[#00ff41] text-xs font-mono border border-[#262626] active:bg-neutral-800 transition shrink-0 cursor-pointer"
        >
          |
        </button>
        <button
          onClick={() => sendKey('~')}
          className="px-2.5 py-1 rounded bg-[#181818] hover:bg-[#262626] text-[#00ff41] text-xs font-mono border border-[#262626] active:bg-neutral-800 transition shrink-0 cursor-pointer"
        >
          ~
        </button>
        <button
          onClick={() => sendKey('/')}
          className="px-2.5 py-1 rounded bg-[#181818] hover:bg-[#262626] text-neutral-200 text-xs font-mono border border-[#262626] active:bg-neutral-800 transition shrink-0 cursor-pointer"
        >
          /
        </button>
        <button
          onClick={() => sendKey('-')}
          className="px-2.5 py-1 rounded bg-[#181818] hover:bg-[#262626] text-neutral-200 text-xs font-mono border border-[#262626] active:bg-neutral-800 transition shrink-0 cursor-pointer"
        >
          -
        </button>
        <div className="ml-auto flex items-center gap-1 shrink-0">
          <button
            onClick={handleClear}
            className="px-2 py-1 rounded bg-[#181818] hover:bg-[#262626] text-neutral-300 text-xs font-mono border border-[#262626] transition flex items-center gap-1 cursor-pointer"
            title="Clear terminal screen"
          >
            <Trash2 className="w-3 h-3 text-neutral-400" />
            <span className="hidden sm:inline">Clear</span>
          </button>
        </div>
      </div>
    </div>
  );
};
