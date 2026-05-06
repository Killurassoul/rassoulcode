import { useEffect, useRef, useState } from "react";
import { Terminal as XTerminal } from "xterm";
import { WebglAddon } from "xterm-addon-webgl";
import "xterm/css/xterm.css";
import { Terminal as TerminalIcon, Plus, X, Maximize2 } from "lucide-react";
import { useIDEStore } from "../store/useIDEStore";
import { cn } from "../lib/utils";

export default function Terminal() {
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<XTerminal | null>(null);
  const { terminalCommands, executionMode, workspaceRoot } = useIDEStore();
  const lastCommandIndex = useRef(0);
  const lastMode = useRef(executionMode);
  const [activeTab, setActiveTab] = useState<"bash" | "logs">("bash");

  useEffect(() => {
    if (xtermRef.current && lastMode.current !== executionMode) {
      const isSafe = executionMode === "safe";
      xtermRef.current.writeln(`\r\n\x1b[33m[SECURITY]: ${isSafe ? "SAFE MODE (SANDBOX ACTIVE)" : "AUTONOMOUS MODE (FULL ACCESS)"} enabled.\x1b[0m`);
      lastMode.current = executionMode;
    }
  }, [executionMode]);

  useEffect(() => {
    if (xtermRef.current && terminalCommands.length > lastCommandIndex.current) {
      const newCommands = terminalCommands.slice(lastCommandIndex.current);
      newCommands.forEach((cmd) => {
        xtermRef.current?.writeln(`\r\n\x1b[36m[AI Command]: ${cmd}\x1b[0m`);
      });
      lastCommandIndex.current = terminalCommands.length;
    }
  }, [terminalCommands]);

  useEffect(() => {
    if (!terminalRef.current) return;

    const term = new XTerminal({
      cursorBlink: true,
      scrollback: 20000,
      theme: {
        background: "#111113",
        foreground: "#A1A1AA",
        cursor: "#4F46E5",
        selectionBackground: "rgba(79, 70, 229, 0.3)",
        black: "#111113",
        red: "#ef4444",
        green: "#22c55e",
        yellow: "#eab308",
        blue: "#3b82f6",
        magenta: "#a855f7",
        cyan: "#06b6d4",
        white: "#d4d4d8",
      },
      fontSize: 12,
      fontFamily: "JetBrains Mono, monospace",
      allowTransparency: true,
      allowProposedApi: true,
    });

    let webglAddon: WebglAddon | null = null;
    try {
      webglAddon = new WebglAddon();
      term.loadAddon(webglAddon);
    } catch (e) {
      console.warn("WebGL failure", e);
    }

    term.open(terminalRef.current);

    const performManualFit = () => {
      if (!term || (term as any)._disposed || !terminalRef.current || !term.element || !term.element.isConnected) return false;
      try {
        const core = (term as any)._core;
        const renderService = core?._renderService;
        const dims = renderService?.dimensions;
        if (dims && terminalRef.current) {
          const cellWidth = dims.actualCellWidth || dims.device?.cell?.width;
          const cellHeight = dims.actualCellHeight || dims.device?.cell?.height;
          if (cellWidth > 0 && cellHeight > 0) {
            const cols = Math.floor(terminalRef.current.clientWidth / cellWidth);
            const rows = Math.floor(terminalRef.current.clientHeight / cellHeight);
            if (cols > 0 && rows > 0 && (term.cols !== cols || term.rows !== rows)) {
              term.resize(cols, rows);
            }
            return true;
          }
        }
      } catch {}
      return false;
    };

    let initialFitTimeout: ReturnType<typeof setTimeout>;
    const tryInitialFit = (attempts = 0) => {
      if (attempts > 30) return;
      if (performManualFit()) return;
      initialFitTimeout = setTimeout(() => tryInitialFit(attempts + 1), 100);
    };
    tryInitialFit();

    xtermRef.current = term;

    term.writeln("\x1b[35mCodeForge AI Terminal v2.0.0\x1b[0m");
    term.writeln("\x1b[38;5;244mHardware acceleration: WebGL\x1b[0m");
    term.writeln("Ready for commands...\n");
    term.write("\x1b[32m$ \x1b[0m");

    let currentCommand = "";

    term.onData(async (data) => {
      const code = data.charCodeAt(0);

      if (code === 13) {
        term.writeln("");
        if (currentCommand.trim()) {
          try {
            const state = useIDEStore.getState();
            const cwd = state.workspaceRoot || ".";
            let result;
            if (window.electronAPI) {
              result = await window.electronAPI.execute(currentCommand, cwd, state.executionMode);
            } else {
              const res = await fetch("/api/command", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ command: currentCommand, mode: state.executionMode }),
              });
              result = await res.json();
            }
            if (result.output) term.write(result.output.replace(/\n/g, "\r\n"));
            if (result.error) term.write(`\x1b[31m${result.error}\x1b[0m\r\n`);
            state.refreshFileTree();
          } catch (e: any) {
            term.writeln(`\x1b[31mExecution error: ${e.message}\x1b[0m`);
          }
        }
        term.write("\x1b[32m$ \x1b[0m");
        currentCommand = "";
      } else if (code === 127) {
        if (currentCommand.length > 0) {
          currentCommand = currentCommand.slice(0, -1);
          term.write("\b \b");
        }
      } else {
        currentCommand += data;
        term.write(data);
      }
    });

    let resizeTimeout: ReturnType<typeof setTimeout>;
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.contentRect.width > 0 && entry.contentRect.height > 0) {
          clearTimeout(resizeTimeout);
          resizeTimeout = setTimeout(() => {
            if (!term || (term as any)._disposed || !terminalRef.current) return;
            if (!terminalRef.current.offsetParent) return;
            performManualFit();
          }, 100);
          break;
        }
      }
    });

    if (terminalRef.current) resizeObserver.observe(terminalRef.current);

    return () => {
      clearTimeout(initialFitTimeout);
      clearTimeout(resizeTimeout);
      resizeObserver.disconnect();
      if (webglAddon) {
        try { webglAddon.dispose(); } catch {}
      }
      try { term.dispose(); } catch {}
    };
  }, []);

  return (
    <div className="flex flex-col h-full bg-[#111113]">
      <div className="flex items-center justify-between bg-bg-panel border-b border-white/5 px-4 h-8 shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveTab("bash")}
            className={cn("flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider py-1 border-b-2 transition-all",
              activeTab === "bash" ? "text-white border-brand" : "text-text-dim border-transparent hover:text-white"
            )}
          >
            <TerminalIcon size={10} />
            Terminal
          </button>
          <button
            onClick={() => setActiveTab("logs")}
            className={cn("flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider py-1 border-b-2 transition-all",
              activeTab === "logs" ? "text-white border-brand" : "text-text-dim border-transparent hover:text-white"
            )}
          >
            Output
          </button>
        </div>
        <div className="flex items-center gap-2">
          <button className="p-1 hover:bg-white/5 rounded text-text-dim hover:text-white transition-colors">
            <Plus size={12} />
          </button>
          <button className="p-1 hover:bg-white/5 rounded text-text-dim hover:text-white transition-colors">
            <Maximize2 size={12} />
          </button>
        </div>
      </div>

      <div ref={terminalRef} className="flex-1 overflow-hidden" style={{ display: activeTab === "bash" ? "block" : "none" }} />

      {activeTab === "logs" && (
        <div className="flex-1 overflow-y-auto p-4 text-xs font-mono text-zinc-500">
          <p>[CodeForge AI] Terminal initialized</p>
          <p>[CodeForge AI] Workspace: {workspaceRoot || "Not set"}</p>
          <p>[CodeForge AI] Mode: {executionMode}</p>
          {terminalCommands.map((cmd, i) => (
            <p key={i} className="text-cyan-400">[AI] {cmd}</p>
          ))}
        </div>
      )}
    </div>
  );
}
