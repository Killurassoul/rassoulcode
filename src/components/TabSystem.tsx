import { X } from "lucide-react";
import { useIDEStore } from "../store/useIDEStore.ts";
import { cn } from "../lib/utils.ts";

export default function TabSystem() {
  const { openFiles, activeFile, setActiveFile, closeFile } = useIDEStore();

  if (openFiles.length === 0) return null;

  return (
    <div className="flex bg-bg-panel/50 border-b border-border overflow-x-auto custom-scrollbar no-scrollbar select-none">
      {openFiles.map((path) => {
        const name = path.split("/").pop();
        const isActive = activeFile === path;

        return (
          <div
            key={path}
            onClick={() => setActiveFile(path)}
            className={cn(
              "group flex items-center gap-2 px-4 py-2 text-xs font-medium cursor-pointer border-r border-border transition-all min-w-[120px] max-w-[200px] relative",
              isActive 
                ? "bg-bg-bright text-brand border-t-2 border-t-brand" 
                : "text-text-dim hover:bg-white/5 hover:text-white"
            )}
          >
            <span className="truncate">{name}</span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                closeFile(path);
              }}
              className={cn(
                "p-0.5 rounded-md hover:bg-white/10 transition-colors opacity-0 group-hover:opacity-100",
                isActive && "opacity-100"
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
