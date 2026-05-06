import React, { useState, useEffect, useRef } from "react";
import { Search, Command, File, Settings, GitBranch, Cpu, Zap, X } from "lucide-react";
import { useIDEStore, FileNode } from "../store/useIDEStore.ts";
import { cn } from "../lib/utils.ts";

interface PaletteItem {
  id: string;
  name: string;
  type: "file" | "action";
  icon?: React.ReactNode;
  cmd?: () => void;
}

export default function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const { fileTree, openFile, setActiveSidebarTab } = useIDEStore();
  const inputRef = useRef<HTMLInputElement>(null);

  // Flatten file tree for searching
  const getAllFiles = (nodes: FileNode[]): string[] => {
    let files: string[] = [];
    nodes.forEach(node => {
      if (node.type === "file") {
        files.push(node.path);
      } else if (node.children) {
        files = [...files, ...getAllFiles(node.children)];
      }
    });
    return files;
  };

  const allFiles = getAllFiles(fileTree);
  
  const actions = [
    { id: "goto_explorer", name: "Aller à l'Explorateur", icon: <File size={14} />, cmd: () => setActiveSidebarTab("explorer") },
    { id: "goto_git", name: "Aller au Git", icon: <GitBranch size={14} />, cmd: () => setActiveSidebarTab("git") },
    { id: "goto_ai", name: "Aller au Chat IA", icon: <Cpu size={14} />, cmd: () => setActiveSidebarTab("ai") },
    { id: "goto_settings", name: "Paramètres", icon: <Settings size={14} />, cmd: () => setActiveSidebarTab("settings") },
  ];

  const filteredFiles = allFiles.filter(f => f.toLowerCase().includes(query.toLowerCase())).slice(0, 5);
  const filteredActions = actions.filter(a => a.name.toLowerCase().includes(query.toLowerCase()));
  
  const results: PaletteItem[] = [
    ...filteredActions.map(a => ({ ...a, type: "action" as const })),
    ...filteredFiles.map(f => ({ id: f, name: f, type: "file" as const }))
  ];

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsOpen(prev => !prev);
      }
      if (e.key === "Escape") setIsOpen(false);
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  const handleSelect = (item: any) => {
    if (item.type === "file") {
      openFile(item.id);
    } else if (item.cmd) {
      item.cmd();
    }
    setIsOpen(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] px-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsOpen(false)} />
      
      <div className="w-full max-w-xl bg-bg-panel border border-brand/30 shadow-2xl shadow-brand/20 rounded-xl overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="flex items-center gap-3 px-4 py-3 border-b border-white/5">
          <Search size={18} className="text-brand animate-pulse" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher un fichier ou une commande..."
            className="flex-1 bg-transparent border-none outline-none text-sm text-white placeholder:text-zinc-500"
          />
          <div className="flex items-center gap-1.5 px-1.5 py-0.5 rounded border border-white/10 bg-white/5 text-[10px] text-zinc-400">
            <span className="font-mono">ESC</span>
          </div>
        </div>

        <div className="max-h-[400px] overflow-y-auto custom-scrollbar p-2">
          {results.length > 0 ? (
            results.map((item, index) => (
              <div
                key={item.id}
                onClick={() => handleSelect(item)}
                onMouseEnter={() => setSelectedIndex(index)}
                className={cn(
                  "flex items-center justify-between px-3 py-2.5 rounded-lg cursor-pointer transition-all",
                  selectedIndex === index ? "bg-brand/10 text-white" : "text-zinc-400 hover:bg-white/5"
                )}
              >
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "p-1.5 rounded-md",
                    item.type === "action" ? "bg-brand/20 text-brand" : "bg-white/5 text-zinc-500"
                  )}>
                    {item.type === "action" ? item.icon : <File size={14} />}
                  </div>
                  <div>
                    <div className="text-xs font-medium">{item.name}</div>
                    {item.type === "file" && (
                      <div className="text-[10px] opacity-40 truncate max-w-[300px]">{item.id}</div>
                    )}
                  </div>
                </div>
                {selectedIndex === index && (
                  <Zap size={12} className="text-brand animate-bounce" />
                )}
              </div>
            ))
          ) : (
            <div className="p-8 text-center text-zinc-500 text-xs italic">
              Aucun résultat pour "{query}"
            </div>
          )}
        </div>

        <div className="px-4 py-2 bg-white/2 border-t border-white/5 flex items-center justify-between text-[10px] text-zinc-500 uppercase tracking-widest font-bold">
          <div className="flex items-center gap-4">
             <div className="flex items-center gap-1"><Command size={10} /><span>Sélect</span></div>
             <div className="flex items-center gap-1"><span>↑↓</span><span>Naviguer</span></div>
          </div>
          <div className="text-brand/60">rassoul code command engine</div>
        </div>
      </div>
    </div>
  );
}
