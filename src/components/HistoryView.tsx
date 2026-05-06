import { useIDEStore } from "../store/useIDEStore";
import { cn } from "../lib/utils";
import { Clock, FileText, Terminal, GitCommit, Cpu, Trash2, RotateCcw, FolderPlus } from "lucide-react";
import { motion } from "motion/react";

export default function HistoryView() {
  const { history, clearHistory, setFileContent, openFile } = useIDEStore();

  const getIcon = (type: string) => {
    switch (type) {
      case "file_create": return <FolderPlus size={14} className="text-emerald-400" />;
      case "file_edit": return <FileText size={14} className="text-brand" />;
      case "file_delete": return <Trash2 size={14} className="text-red-400" />;
      case "command": return <Terminal size={14} className="text-amber-400" />;
      case "git_commit": return <GitCommit size={14} className="text-purple-400" />;
      case "ai_action": return <Cpu size={14} className="text-cyan-400" />;
      default: return <Clock size={14} className="text-zinc-500" />;
    }
  };

  const handleUndo = (entry: any) => {
    if (entry.reversible && entry.snapshot) {
      setFileContent(entry.snapshot.path, entry.snapshot.content);
      openFile(entry.snapshot.path);
    }
  };

  const formatTime = (ts: string) => {
    const d = new Date(ts);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    if (diff < 60000) return "just now";
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return d.toLocaleDateString();
  };

  return (
    <div className="flex flex-col h-full bg-bg-panel/50">
      <div className="p-4 border-b border-white/5 bg-white/2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock size={14} className="text-zinc-400" />
          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
            Action History
          </span>
          <span className="text-[9px] bg-white/5 px-1.5 py-0.5 rounded text-zinc-500">
            {history.length}
          </span>
        </div>
        {history.length > 0 && (
          <button
            onClick={clearHistory}
            className="text-[10px] text-zinc-500 hover:text-red-400 transition-colors"
          >
            Clear
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto">
        {history.length === 0 ? (
          <div className="p-8 text-center text-zinc-600 text-xs italic">
            No actions recorded yet
          </div>
        ) : (
          <div className="divide-y divide-white/2">
            {history.map((entry, i) => (
              <motion.div
                key={entry.id}
                initial={{ opacity: 0, x: -5 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.02 }}
                className="px-4 py-3 hover:bg-white/5 transition-colors group"
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 shrink-0">{getIcon(entry.type)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs text-zinc-300 truncate">{entry.description}</div>
                    {entry.details && (
                      <div className="text-[10px] text-zinc-600 font-mono truncate mt-0.5">
                        {entry.details.substring(0, 100)}
                      </div>
                    )}
                    <div className="text-[9px] text-zinc-700 mt-1">{formatTime(entry.timestamp)}</div>
                  </div>
                  {entry.reversible && (
                    <button
                      onClick={() => handleUndo(entry)}
                      className="p-1 opacity-0 group-hover:opacity-100 hover:bg-brand/20 rounded text-zinc-500 hover:text-brand transition-all shrink-0"
                      title="Undo this change"
                    >
                      <RotateCcw size={12} />
                    </button>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
