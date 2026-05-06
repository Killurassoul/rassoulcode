import { X, Loader2, Check, Circle } from "lucide-react";
import { useIDEStore } from "../store/useIDEStore.ts";
import { cn } from "../lib/utils.ts";

export default function TabSystem() {
  const { openFiles, activeFile, setActiveFile, closeFile, fileSaveStatus } = useIDEStore();

  if (openFiles.length === 0) return null;

  return (
    <div className="flex bg-bg-panel/50 border-b border-border overflow-x-auto custom-scrollbar no-scrollbar select-none">
      {openFiles.map((path) => {
        const name = path.split("/").pop();
        const isActive = activeFile === path;
        const status = fileSaveStatus[path] || "saved";

        return (
          <div
            key={path}
            onClick={() => setActiveFile(path)}
            className={cn(
              "group flex items-center gap-2 px-4 py-2 text-xs font-medium cursor-pointer border-r border-border transition-all min-w-[120px] max-w-[200px] relative h-9",
              isActive 
                ? "bg-bg-bright text-brand border-t-2 border-t-brand shadow-[0_-2px_10px_rgba(79,70,229,0.1)]" 
                : "text-text-dim hover:bg-white/5 hover:text-white"
            )}
          >
            <div className="flex items-center gap-2 flex-1 min-w-0">
              {status === "unsaved" && (
                <div className="w-1.5 h-1.5 rounded-full bg-brand animate-pulse shrink-0" />
              )}
              {status === "saving" && (
                <Loader2 size={10} className="animate-spin text-brand shrink-0" />
              )}
              <span className="truncate">{name}</span>
            </div>
            
            <button
              onClick={(e) => {
                e.stopPropagation();
                closeFile(path);
              }}
              className={cn(
                "p-0.5 rounded-md hover:bg-white/10 transition-colors shrink-0",
                isActive ? "opacity-100" : "opacity-0 group-hover:opacity-100"
              )}
            >
              <X size={12} />
            </button>
            {isActive && (
              <div className="absolute bottom-[-1px] left-0 right-0 h-[1px] bg-bg-bright" />
            )}
          </div>
        );
      })}
    </div>
  );
}
