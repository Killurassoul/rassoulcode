import { useEffect, useRef } from "react";
import { Terminal as XTerminal } from "xterm";
import { FitAddon } from "xterm-addon-fit";
import "xterm/css/xterm.css";
import { Terminal as TerminalIcon, Plus, X, Maximize2 } from "lucide-react";
import { useIDEStore } from "../store/useIDEStore.ts";

export default function Terminal() {
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<XTerminal | null>(null);
  const { terminalCommands, executionMode } = useIDEStore();
  const lastCommandIndex = useRef(0);
  const lastMode = useRef(executionMode);

  useEffect(() => {
    if (xtermRef.current && lastMode.current !== executionMode) {
      const isSafe = executionMode === "safe";
      xtermRef.current.writeln(`\r\n\x1b[33m[SÉCURITÉ]: Mode ${isSafe ? "SÉCURISÉ (SANDBOX ACTIF)" : "AUTONOME (ACCÈS TOTAL)"} activé.\x1b[0m`);
      lastMode.current = executionMode;
    }
  }, [executionMode]);

  useEffect(() => {
    // Listen for broadcasted commands
    if (xtermRef.current && terminalCommands.length > lastCommandIndex.current) {
      const newCommands = terminalCommands.slice(lastCommandIndex.current);
      newCommands.forEach(cmd => {
        xtermRef.current?.writeln(`\r\n\x1b[36m[AI Command]: ${cmd}\x1b[0m`);
        // We don't actually trigger it here because AIChat already triggered the API
        // This just mirrors the visual state as requested
      });
      lastCommandIndex.current = terminalCommands.length;
    }
  }, [terminalCommands]);

  useEffect(() => {
    if (!terminalRef.current) return;

    const term = new XTerminal({
      cursorBlink: true,
      theme: {
        background: "#111113",
        foreground: "#A1A1AA",
        cursor: "#4F46E5",
        selectionBackground: "rgba(79, 70, 229, 0.3)",
      },
      fontSize: 12,
      fontFamily: "JetBrains Mono",
      allowTransparency: true,
    });

    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);
    
    term.open(terminalRef.current);
    
    // Delay initial fit to ensure container is ready
    const timeoutId = setTimeout(() => {
      if (!term || !terminalRef.current || !term.element || !term.element.isConnected) return;
      try {
        const core = (term as any)._core;
        if (core?._renderService?.dimensions) {
          fitAddon.fit();
        }
      } catch (e) {
        // Silently fail
      }
    }, 200);

    xtermRef.current = term;

    term.writeln("\x1b[35mCodeForge AI Shell v1.0.0\x1b[0m");
    term.writeln("Prêt pour les commandes...\n");
    term.write("\x1b[32m$ \x1b[0m");

    let currentCommand = "";

    term.onData(async (data) => {
      const code = data.charCodeAt(0);
      
      if (code === 13) { // Enter
        term.writeln("");
        if (currentCommand.trim()) {
           try {
             // Link to real backend command API
             const res = await fetch("/api/command", {
               method: "POST",
               headers: { "Content-Type": "application/json" },
               body: JSON.stringify({ 
                 command: currentCommand,
                 mode: useIDEStore.getState().executionMode 
               })
             });
             const result = await res.json();
             
             if (result.output) term.write(result.output.replace(/\n/g, "\r\n"));
             if (result.error) term.write(`\x1b[31m${result.error}\x1b[0m\r\n`);
             
             // Refresh file tree
             useIDEStore.getState().refreshFileTree();
           } catch (e: any) {
             term.writeln(`\x1b[31mErreur d'exécution : ${e.message}\x1b[0m`);
           }
        }
        term.write("\x1b[32m$ \x1b[0m");
        currentCommand = "";
      } else if (code === 127) { // Backspace
        if (currentCommand.length > 0) {
          currentCommand = currentCommand.slice(0, -1);
          term.write("\b \b");
        }
      } else {
        currentCommand += data;
        term.write(data);
      }
    });

    const handleResize = () => {
      // Use the term closure variable but double check it's still the active ref one
      if (!term || !terminalRef.current || !term.element || !term.element.isConnected) return;
      
      const { offsetWidth, offsetHeight } = terminalRef.current;
      if (offsetWidth <= 0 || offsetHeight <= 0) return;

      try {
        // xterm-addon-fit 0.8.0 sometimes accesses internal dimensions too early
        // We check if the terminal has a renderer and dimensions before fitting
        const core = (term as any)._core;
        if (core?._renderService?.dimensions) {
          fitAddon.fit();
        }
      } catch (e) {
        console.warn("Terminal resize failed", e);
      }
    };

    let resizeTimeout: ReturnType<typeof setTimeout>;
    const resizeObserver = new ResizeObserver((entries) => {
      // Only resize if the element has actual size and is connected
      for (const entry of entries) {
        if (entry.contentRect.width > 0 && entry.contentRect.height > 0) {
          clearTimeout(resizeTimeout);
          resizeTimeout = setTimeout(handleResize, 100); // Increased debounce
          break;
        }
      }
    });

    if (terminalRef.current) {
      resizeObserver.observe(terminalRef.current);
    }

    return () => {
      clearTimeout(timeoutId);
      clearTimeout(resizeTimeout);
      resizeObserver.disconnect();
      try {
        term.dispose();
      } catch (e) {
        // Ignore dispose errors
      }
      if (xtermRef.current === term) {
        xtermRef.current = null;
      }
    };
  }, []);

  return (
    <div className="flex flex-col h-full bg-[#111113]">
      {/* Terminal Tabs */}
      <div className="flex items-center justify-between px-4 h-9 border-b border-white/5 bg-white/2">
        <div className="flex items-center gap-4 h-full">
          <div className="flex items-center gap-2 h-full px-2 border-b-2 border-brand text-[11px] font-medium text-white transition-all select-none">
            <TerminalIcon size={12} className="text-emerald-400" />
            <span>Bash</span>
            {executionMode === "safe" && (
              <span className="ml-2 px-1.5 py-0.5 bg-amber-500/10 text-amber-500 text-[9px] font-bold rounded uppercase tracking-tighter border border-amber-500/20">
                Sandbox
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 h-full px-2 text-[11px] font-medium text-text-dim hover:text-white transition-all cursor-pointer select-none">
            <span>Journaux</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button className="p-1 hover:bg-white/5 rounded text-text-dim transition-colors"><Plus size={14}/></button>
          <button className="p-1 hover:bg-white/5 rounded text-text-dim transition-colors"><Maximize2 size={14}/></button>
          <button className="p-1 hover:bg-white/5 rounded text-text-dim transition-colors"><X size={14}/></button>
        </div>
      </div>
      
      {/* Terminal View */}
      <div className="flex-1 p-2 overflow-hidden">
        <div ref={terminalRef} className="h-full w-full" />
      </div>
    </div>
  );
}
