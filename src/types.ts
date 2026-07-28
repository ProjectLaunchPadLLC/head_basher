export type TerminalThemeName = 
  | 'highDensity'
  | 'dracula' 
  | 'oneDark' 
  | 'matrix' 
  | 'cyberpunk' 
  | 'solarizedDark' 
  | 'retroGreen' 
  | 'monokai' 
  | 'nord';

export interface TerminalThemeColors {
  name: string;
  background: string;
  foreground: string;
  cursor: string;
  cursorAccent: string;
  selectionBackground: string;
  black: string;
  red: string;
  green: string;
  yellow: string;
  blue: string;
  magenta: string;
  cyan: string;
  white: string;
  brightBlack: string;
  brightRed: string;
  brightGreen: string;
  brightYellow: string;
  brightBlue: string;
  brightMagenta: string;
  brightCyan: string;
  brightWhite: string;
}

export interface TerminalTab {
  id: string;
  title: string;
  cwd: string;
  status: 'connecting' | 'connected' | 'disconnected' | 'error';
  lastActive: number;
}

export interface TerminalSettings {
  fontFamily: string;
  fontSize: number;
  lineHeight: number;
  cursorStyle: 'block' | 'underline' | 'bar';
  cursorBlink: boolean;
  theme: TerminalThemeName;
  scrollback: number;
  bell: boolean;
}

export interface SystemInfo {
  hostname: string;
  platform: string;
  arch: string;
  kernelVersion: string;
  osRelease: string;
  uptime: number;
  cpuModel: string;
  cpuCores: number;
  cpuUsagePct: number;
  totalMemory: number;
  freeMemory: number;
  usedMemory: number;
  diskTotal: number;
  diskFree: number;
  diskUsed: number;
}

export interface ProcessInfo {
  pid: number;
  user: string;
  cpu: string;
  mem: string;
  vsz: string;
  rss: string;
  tty: string;
  stat: string;
  start: string;
  time: string;
  command: string;
}

export interface FileItem {
  name: string;
  path: string;
  isDirectory: boolean;
  size: number;
  mtime: string;
  permissions: string;
  extension?: string;
}

export interface CheatCommand {
  id: string;
  category: 'System' | 'Files' | 'Network' | 'Git' | 'Process' | 'Search' | 'Package';
  command: string;
  description: string;
  example?: string;
}
