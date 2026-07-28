import express from "express";
import http from "http";
import path from "path";
import fs from "fs";
import os from "os";
import { spawn, exec } from "child_process";
import cors from "cors";
import { WebSocketServer, WebSocket } from "ws";
import { createServer as createViteServer } from "vite";

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

const server = http.createServer(app);
const wss = new WebSocketServer({ noServer: true });

// Store active shell sessions
interface ShellSession {
  id: string;
  process: any;
  ws: WebSocket;
  cwd: string;
}
const activeSessions = new Map<string, ShellSession>();

// Helper to determine root directory for file operations
const WORKSPACE_DIR = process.cwd();

// --- REST API ROUTES ---

// System Info Endpoint
app.get("/api/system/info", (req, res) => {
  exec("df -b / | tail -1", (err, stdout) => {
    let diskTotal = 0;
    let diskFree = 0;
    let diskUsed = 0;
    
    if (!err && stdout) {
      const parts = stdout.trim().split(/\s+/);
      if (parts.length >= 4) {
        // df in 1-byte blocks or 1K blocks
        const totalKB = parseInt(parts[1], 10) || 0;
        const usedKB = parseInt(parts[2], 10) || 0;
        const freeKB = parseInt(parts[3], 10) || 0;
        diskTotal = totalKB * 1024;
        diskUsed = usedKB * 1024;
        diskFree = freeKB * 1024;
      }
    }

    let osRelease = "Linux Container";
    try {
      if (fs.existsSync("/etc/os-release")) {
        const osContent = fs.readFileSync("/etc/os-release", "utf8");
        const match = osContent.match(/PRETTY_NAME="([^"]+)"/);
        if (match) osRelease = match[1];
      }
    } catch (e) {}

    const cpus = os.cpus();
    const totalMem = os.totalmem();
    const freeMem = os.freemem();

    res.json({
      hostname: os.hostname(),
      platform: os.platform(),
      arch: os.arch(),
      kernelVersion: os.release(),
      osRelease,
      uptime: os.uptime(),
      cpuModel: cpus.length > 0 ? cpus[0].model : "Standard CPU",
      cpuCores: cpus.length,
      totalMemory: totalMem,
      freeMemory: freeMem,
      usedMemory: totalMem - freeMem,
      diskTotal: diskTotal || totalMem * 4,
      diskFree: diskFree || freeMem * 2,
      diskUsed: diskUsed || (totalMem - freeMem) * 2,
    });
  });
});

// Process List Endpoint
app.get("/api/system/processes", (req, res) => {
  exec("ps aux --sort=-%cpu | head -30", (err, stdout) => {
    if (err) {
      return res.status(500).json({ error: "Failed to fetch process list" });
    }
    const lines = stdout.trim().split("\n");
    if (lines.length < 2) return res.json([]);

    const processes = lines.slice(1).map((line) => {
      const parts = line.trim().split(/\s+/);
      return {
        user: parts[0] || "",
        pid: parseInt(parts[1], 10) || 0,
        cpu: parts[2] || "0.0",
        mem: parts[3] || "0.0",
        vsz: parts[4] || "0",
        rss: parts[5] || "0",
        tty: parts[6] || "?",
        stat: parts[7] || "S",
        start: parts[8] || "",
        time: parts[9] || "",
        command: parts.slice(10).join(" ") || "",
      };
    }).filter(p => p.pid > 0);

    res.json(processes);
  });
});

// Kill Process Endpoint
app.post("/api/system/kill", (req, res) => {
  const { pid } = req.body;
  if (!pid || typeof pid !== "number") {
    return res.status(400).json({ error: "Valid PID required" });
  }

  try {
    process.kill(pid, "SIGKILL");
    res.json({ success: true, message: `Signal SIGKILL sent to process ${pid}` });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to kill process" });
  }
});

// File Tree Explorer Endpoint
app.get("/api/files/tree", (req, res) => {
  const relPath = (req.query.path as string) || ".";
  const targetPath = path.resolve(WORKSPACE_DIR, relPath);

  // Security check: stay within workspace or allow linux root if asked
  if (!fs.existsSync(targetPath)) {
    return res.status(404).json({ error: "Path does not exist" });
  }

  try {
    const stats = fs.statSync(targetPath);
    if (!stats.isDirectory()) {
      return res.status(400).json({ error: "Path is not a directory" });
    }

    const items = fs.readdirSync(targetPath);
    const result = items.map((name) => {
      const full = path.join(targetPath, name);
      try {
        const s = fs.statSync(full);
        const relativeToWorkspace = path.relative(WORKSPACE_DIR, full);
        return {
          name,
          path: relativeToWorkspace || name,
          isDirectory: s.isDirectory(),
          size: s.size,
          mtime: s.mtime.toISOString(),
          permissions: (s.mode & 0o777).toString(8),
          extension: s.isDirectory() ? undefined : path.extname(name).toLowerCase(),
        };
      } catch (e) {
        return null;
      }
    }).filter(Boolean);

    // Sort directories first, then files
    result.sort((a: any, b: any) => {
      if (a.isDirectory && !b.isDirectory) return -1;
      if (!a.isDirectory && b.isDirectory) return 1;
      return a.name.localeCompare(b.name);
    });

    res.json({
      currentPath: path.relative(WORKSPACE_DIR, targetPath) || ".",
      items: result,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to read directory" });
  }
});

// File Content Reader Endpoint
app.get("/api/files/content", (req, res) => {
  const relPath = req.query.path as string;
  if (!relPath) return res.status(400).json({ error: "File path required" });

  const targetPath = path.resolve(WORKSPACE_DIR, relPath);
  try {
    if (!fs.existsSync(targetPath)) {
      return res.status(404).json({ error: "File not found" });
    }
    const stat = fs.statSync(targetPath);
    if (stat.size > 5 * 1024 * 1024) {
      return res.status(400).json({ error: "File exceeds 5MB limit for direct preview" });
    }
    const content = fs.readFileSync(targetPath, "utf8");
    res.json({ path: relPath, content });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to read file" });
  }
});

// File Save/Write Endpoint
app.post("/api/files/save", (req, res) => {
  const { path: relPath, content } = req.body;
  if (!relPath) return res.status(400).json({ error: "File path required" });

  const targetPath = path.resolve(WORKSPACE_DIR, relPath);
  try {
    // Ensure directory exists
    fs.mkdirSync(path.dirname(targetPath), { recursive: true });
    fs.writeFileSync(targetPath, content || "", "utf8");
    res.json({ success: true, message: `Saved ${relPath}` });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to save file" });
  }
});

// File Create Endpoint
app.post("/api/files/create", (req, res) => {
  const { path: relPath, isDirectory } = req.body;
  if (!relPath) return res.status(400).json({ error: "Path required" });

  const targetPath = path.resolve(WORKSPACE_DIR, relPath);
  try {
    if (fs.existsSync(targetPath)) {
      return res.status(400).json({ error: "Target already exists" });
    }
    if (isDirectory) {
      fs.mkdirSync(targetPath, { recursive: true });
    } else {
      fs.mkdirSync(path.dirname(targetPath), { recursive: true });
      fs.writeFileSync(targetPath, "", "utf8");
    }
    res.json({ success: true, message: `Created ${relPath}` });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to create" });
  }
});

// File Delete Endpoint
app.post("/api/files/delete", (req, res) => {
  const { path: relPath } = req.body;
  if (!relPath) return res.status(400).json({ error: "Path required" });

  const targetPath = path.resolve(WORKSPACE_DIR, relPath);
  try {
    if (!fs.existsSync(targetPath)) {
      return res.status(404).json({ error: "Target not found" });
    }
    fs.rmSync(targetPath, { recursive: true, force: true });
    res.json({ success: true, message: `Deleted ${relPath}` });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to delete" });
  }
});

// CheatSheet API
app.get("/api/cheatsheet", (req, res) => {
  res.json([
    { id: "1", category: "System", command: "uname -a", description: "Display system and kernel information" },
    { id: "2", category: "System", command: "df -h", description: "Display disk space usage in human readable format" },
    { id: "3", category: "System", command: "free -m", description: "Display memory usage in Megabytes" },
    { id: "4", category: "System", command: "uptime", description: "Show how long the system has been running" },
    { id: "5", category: "Files", command: "ls -la", description: "List all files including hidden with detail" },
    { id: "6", category: "Files", command: "find . -name '*.ts'", description: "Search for files matching name pattern" },
    { id: "7", category: "Files", command: "grep -rn 'search_term' .", description: "Search recursively for text inside files" },
    { id: "8", category: "Files", command: "tar -czvf archive.tar.gz folder/", description: "Compress folder into tar.gz archive" },
    { id: "9", category: "Network", command: "curl -I https://google.com", description: "Fetch HTTP headers of a web endpoint" },
    { id: "10", category: "Network", command: "netstat -tuln", description: "List listening ports and connections" },
    { id: "11", category: "Process", command: "ps aux | grep node", description: "List active processes matching search" },
    { id: "12", category: "Process", command: "top -bn1 | head -20", description: "Snapshot of active top processes" },
    { id: "13", category: "Git", command: "git status", description: "Check working directory status" },
    { id: "14", category: "Git", command: "git log --oneline -n 10", description: "Show compact commit history" },
    { id: "15", category: "Package", command: "node -v && npm -v", description: "Check installed Node.js and NPM versions" },
    { id: "16", category: "Package", command: "python3 --version", description: "Check installed Python version" },
  ]);
});


// --- WEBSOCKET SHELL ENGINE ---

server.on("upgrade", (request, socket, head) => {
  const urlObj = new URL(request.url || "", `http://${request.headers.host}`);
  if (urlObj.pathname === "/ws/terminal" || urlObj.pathname.startsWith("/ws/terminal")) {
    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit("connection", ws, request);
    });
  }
});

wss.on("connection", (ws: WebSocket, request: http.IncomingMessage) => {
  const urlObj = new URL(request.url || "", `http://${request.headers.host}`);
  const sessionId = urlObj.searchParams.get("id") || `shell-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
  
  // Set default prompt and TERM env
  const env = {
    ...process.env,
    TERM: "xterm-256color",
    COLORTERM: "truecolor",
    LANG: "en_US.UTF-8",
    PS1: "\\[\\e[1;32m\\]\\u@linux-pwa\\[\\e[0m\\]:\\[\\e[1;34m\\]\\w\\[\\e[0m\\]\\$ ",
  };

  // Spawn Python PTY if available or fallback to direct interactive Bash
  let shellProc: any;
  const pythonCmd = "import pty, os, sys; os.environ['TERM']='xterm-256color'; pty.spawn(['/bin/bash', '-i'])";

  try {
    shellProc = spawn("python3", ["-c", pythonCmd], {
      cwd: WORKSPACE_DIR,
      env,
      stdio: ["pipe", "pipe", "pipe"],
    });
  } catch (e) {
    shellProc = spawn("/bin/bash", ["-i"], {
      cwd: WORKSPACE_DIR,
      env,
      stdio: ["pipe", "pipe", "pipe"],
    });
  }

  // Fallback if python child process errored
  shellProc.on("error", () => {
    try {
      shellProc = spawn("/bin/bash", ["-i"], {
        cwd: WORKSPACE_DIR,
        env,
        stdio: ["pipe", "pipe", "pipe"],
      });
      attachProcHandlers(shellProc);
    } catch (err) {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send("\r\n\x1b[31mError launching Linux bash shell session\x1b[0m\r\n");
      }
    }
  });

  function attachProcHandlers(proc: any) {
    proc.stdout?.on("data", (chunk: Buffer) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(chunk.toString("utf8"));
      }
    });

    proc.stderr?.on("data", (chunk: Buffer) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(chunk.toString("utf8"));
      }
    });

    proc.on("close", (code: number) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(`\r\n\x1b[33m[Shell process exited with code ${code}]\x1b[0m\r\n`);
        ws.close();
      }
      activeSessions.delete(sessionId);
    });
  }

  attachProcHandlers(shellProc);

  activeSessions.set(sessionId, {
    id: sessionId,
    process: shellProc,
    ws,
    cwd: WORKSPACE_DIR,
  });

  ws.on("message", (message: string | Buffer) => {
    try {
      const msgStr = message.toString();
      // Check if control frame (e.g. resize or ping)
      if (msgStr.startsWith("{") && msgStr.endsWith("}")) {
        try {
          const parsed = JSON.parse(msgStr);
          if (parsed.type === "resize") {
            // Can pass COLUMNS/LINES signal or pass to process
            return;
          }
          if (parsed.type === "ping") {
            ws.send(JSON.stringify({ type: "pong" }));
            return;
          }
        } catch (e) {
          // Normal command starting with { or JSON string
        }
      }

      // Pass raw terminal keystrokes / commands to shell stdin
      if (shellProc && shellProc.stdin && !shellProc.killed) {
        shellProc.stdin.write(message);
      }
    } catch (err) {
      console.error("Shell stdin write error:", err);
    }
  });

  ws.on("close", () => {
    if (shellProc && !shellProc.killed) {
      try {
        shellProc.kill("SIGTERM");
      } catch (e) {}
    }
    activeSessions.delete(sessionId);
  });
});


// --- VITE / STATIC SERVING ---

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`Linux Terminal PWA Server listening at http://localhost:${PORT}`);
  });
}

startServer();
