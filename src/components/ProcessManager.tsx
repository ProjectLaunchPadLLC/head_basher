import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  Cpu, 
  HardDrive, 
  RefreshCw, 
  X, 
  Search, 
  AlertTriangle, 
  Power, 
  Clock, 
  Server, 
  ShieldCheck 
} from 'lucide-react';
import { SystemInfo, ProcessInfo } from '../types';

interface ProcessManagerProps {
  onClose: () => void;
  onExecuteInTerminal: (cmd: string) => void;
}

export const ProcessManager: React.FC<ProcessManagerProps> = ({
  onClose,
  onExecuteInTerminal,
}) => {
  const [sysInfo, setSysInfo] = useState<SystemInfo | null>(null);
  const [processes, setProcesses] = useState<ProcessInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [autoRefresh, setAutoRefresh] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [sysRes, procRes] = await Promise.all([
        fetch('/api/system/info'),
        fetch('/api/system/processes'),
      ]);

      if (sysRes.ok) {
        const sysData = await sysRes.json();
        setSysInfo(sysData);
      }
      if (procRes.ok) {
        const procData = await procRes.json();
        setProcesses(procData);
      }
    } catch (err) {
      console.error('Failed to fetch system stats:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    let timer: any = null;
    if (autoRefresh) {
      timer = setInterval(fetchData, 3000);
    }
    return () => clearInterval(timer);
  }, [autoRefresh]);

  const handleKillProcess = async (pid: number) => {
    if (!confirm(`Send SIGKILL to process PID ${pid}?`)) return;
    try {
      const res = await fetch('/api/system/kill', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pid }),
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to kill process');
      }
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Error killing process');
    }
  };

  const filteredProcesses = processes.filter(
    (p) =>
      p.command.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.user.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.pid.toString().includes(searchQuery)
  );

  const formatBytes = (bytes: number) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const formatUptime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    return `${hrs}h ${mins}m`;
  };

  const memPct = sysInfo ? Math.round((sysInfo.usedMemory / sysInfo.totalMemory) * 100) : 0;
  const diskPct = sysInfo && sysInfo.diskTotal ? Math.round((sysInfo.diskUsed / sysInfo.diskTotal) * 100) : 0;

  return (
    <div id="system-monitor-drawer" className="w-64 sm:w-72 bg-[#080808] border-l border-[#1a1a1a] flex flex-col h-full z-20 shrink-0 select-none shadow-2xl font-mono">
      {/* Drawer Header */}
      <div className="p-2.5 bg-[#0c0c0c] border-b border-[#1a1a1a] flex items-center justify-between text-[10px] text-neutral-400 uppercase tracking-widest font-bold shrink-0">
        <div className="flex items-center gap-2">
          <Activity className="w-3.5 h-3.5 text-[#00ff41]" />
          <span>System Monitor</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] text-[#00ff41] font-bold status-glow">LIVE</span>
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`px-1.5 py-0.5 text-[9px] rounded font-mono transition cursor-pointer ${
              autoRefresh
                ? 'bg-emerald-950/80 text-[#00ff41] border border-emerald-800'
                : 'bg-neutral-800 text-neutral-400'
            }`}
          >
            {autoRefresh ? '3s' : 'PAUSED'}
          </button>
          <button
            onClick={fetchData}
            className="p-1 rounded hover:bg-[#1a1a1a] text-neutral-400 hover:text-white cursor-pointer"
            title="Refresh System Stats"
          >
            <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-[#1a1a1a] text-neutral-400 hover:text-white cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Overview Cards */}
      {sysInfo && (
        <div className="p-3 border-b border-[#1a1a1a] bg-[#050505] space-y-3 text-[11px] font-mono">
          {/* OS Info Badge */}
          <div className="flex items-center justify-between text-neutral-200 bg-[#0c0c0c] p-2 rounded border border-[#1a1a1a]">
            <div className="flex items-center gap-2">
              <Server className="w-3.5 h-3.5 text-blue-400" />
              <span className="truncate font-semibold">{sysInfo.osRelease}</span>
            </div>
            <span className="text-[10px] text-neutral-500">{sysInfo.arch}</span>
          </div>

          {/* CPU Meters */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-[10px] text-neutral-400">
              <span>CPU UTILIZATION</span>
              <span className="text-[#00ff41] font-bold">12%</span>
            </div>
            <div className="w-full h-1.5 bg-[#111111] rounded overflow-hidden">
              <div className="h-full bg-[#00ff41] shadow-[0_0_8px_rgba(0,255,65,0.6)]" style={{ width: '12%' }} />
            </div>
          </div>

          {/* Memory Bar */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[10px]">
              <span className="text-neutral-400 flex items-center gap-1">
                <Cpu className="w-3 h-3 text-blue-400" /> RAM MEMORY
              </span>
              <span className="text-neutral-200 font-bold">
                {formatBytes(sysInfo.usedMemory)} / {formatBytes(sysInfo.totalMemory)} ({memPct}%)
              </span>
            </div>
            <div className="w-full bg-[#111111] h-1.5 rounded overflow-hidden">
              <div
                className={`h-full transition-all duration-500 rounded ${
                  memPct > 85 ? 'bg-rose-500' : memPct > 60 ? 'bg-amber-400' : 'bg-blue-500'
                }`}
                style={{ width: `${memPct}%` }}
              />
            </div>
          </div>

          {/* Disk Bar */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[10px]">
              <span className="text-neutral-400 flex items-center gap-1">
                <HardDrive className="w-3 h-3 text-purple-400" /> DISK STORAGE
              </span>
              <span className="text-neutral-200 font-bold">
                {formatBytes(sysInfo.diskUsed)} / {formatBytes(sysInfo.diskTotal)} ({diskPct}%)
              </span>
            </div>
            <div className="w-full bg-[#111111] h-1.5 rounded overflow-hidden">
              <div
                className={`h-full transition-all duration-500 rounded ${
                  diskPct > 85 ? 'bg-rose-500' : 'bg-purple-500'
                }`}
                style={{ width: `${diskPct}%` }}
              />
            </div>
          </div>

          {/* Network Activity Equalizer Graph */}
          <div className="pt-2 border-t border-[#1a1a1a]">
            <div className="text-[10px] text-neutral-500 uppercase tracking-wider mb-1.5">Network Activity</div>
            <div className="h-10 flex items-end justify-between space-x-[2px] bg-[#000000] p-1 border border-[#1a1a1a] rounded">
              <div className="bg-[#00ff41]/30 w-full h-[15%]" />
              <div className="bg-[#00ff41]/40 w-full h-[30%]" />
              <div className="bg-[#00ff41]/60 w-full h-[55%]" />
              <div className="bg-[#00ff41]/40 w-full h-[25%]" />
              <div className="bg-[#00ff41]/80 w-full h-[80%]" />
              <div className="bg-[#00ff41]/60 w-full h-[45%]" />
              <div className="bg-[#00ff41]/90 w-full h-[95%]" />
              <div className="bg-[#00ff41]/50 w-full h-[35%]" />
            </div>
          </div>

          <div className="flex items-center justify-between text-[10px] text-neutral-500 pt-1">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3 text-neutral-600" /> Uptime: {formatUptime(sysInfo.uptime)}
            </span>
            <span>Cores: {sysInfo.cpuCores}</span>
          </div>
        </div>
      )}

      {/* Search Bar */}
      <div className="p-2 border-b border-[#1a1a1a] bg-[#0c0c0c]">
        <div className="relative">
          <Search className="w-3 h-3 text-neutral-500 absolute left-2.5 top-2.5" />
          <input
            type="text"
            placeholder="Search active processes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#050505] border border-[#1a1a1a] rounded pl-8 pr-3 py-1 text-[11px] text-neutral-200 focus:outline-none focus:border-[#00ff41] font-mono"
          />
        </div>
      </div>

      {/* Process Table */}
      <div className="flex-1 overflow-y-auto">
        <div className="text-[10px] text-neutral-500 uppercase tracking-wider font-bold px-3 py-1.5 bg-[#050505] border-b border-[#1a1a1a]">
          Active Processes
        </div>
        <table className="w-full text-left text-[11px] font-mono border-collapse">
          <thead className="bg-[#0c0c0c] text-neutral-400 sticky top-0 border-b border-[#1a1a1a]">
            <tr>
              <th className="p-1.5 font-normal">PID</th>
              <th className="p-1.5 font-normal">Command</th>
              <th className="p-1.5 font-normal">CPU</th>
              <th className="p-1.5 font-normal text-right">Kill</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#141414]">
            {filteredProcesses.map((proc) => (
              <tr key={proc.pid} className="hover:bg-[#121212] transition">
                <td className="p-1.5 font-bold text-neutral-400 text-[10px]">{proc.pid}</td>
                <td className="p-1.5 text-neutral-200 max-w-[100px] truncate" title={proc.command}>
                  {proc.command}
                </td>
                <td className="p-1.5 text-[#00ff41] text-[10px]">{proc.cpu}%</td>
                <td className="p-1.5 text-right">
                  <button
                    onClick={() => handleKillProcess(proc.pid)}
                    className="p-1 rounded bg-rose-950/60 hover:bg-rose-900 border border-rose-900/80 text-rose-300 hover:text-white transition cursor-pointer"
                    title={`Kill PID ${proc.pid}`}
                  >
                    <Power className="w-3 h-3" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
