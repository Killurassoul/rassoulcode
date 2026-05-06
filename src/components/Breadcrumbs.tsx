import { ChevronRight, FileCode, Folder, Loader2, Save, Cloud } from "lucide-react";
import { useIDEStore } from "../store/useIDEStore.ts";
import { cn } from "../lib/utils.ts";

export default function Breadcrumbs() {
  const { activeFile, fileSaveStatus } = useIDEStore();

  if (!activeFile) return null;

  const status = fileSaveStatus[activeFile] || "saved";

  const parts = activeFile.split("/");

  return (
    <div className="flex items-center gap-1.5 px-4 py-1.5 bg-bg-panel/30 border-b border-border text-[10px] font-medium text-text-dim select-none overflow-x-auto no-scrollbar">
      <div className="flex items-center gap-1 hover:text-white cursor-pointer transition-colors">
        <Folder size={10} className="text-zinc-500" />
        <span>lib</span>
      </div>
      
      {parts.map((part, i) => (
        <div key={i} className="flex items-center gap-1.5">
          <ChevronRight size={10} className="opacity-30" />
          <div className="flex items-center gap-1 hover:text-white cursor-pointer transition-colors last:text-brand last:font-bold">
            {i === parts.length - 1 ? (
              <FileCode size={10} className="text-brand" />
            ) : (
              <Folder size={10} className="text-zinc-500" />
            )}
            <span>{part}</span>
          </div>
        </div>
      ))}
      
      <div className="ml-auto flex items-center gap-4">
        <div className={cn(
          "flex items-center gap-1.5 transition-all duration-300",
          status === "unsaved" ? "text-amber-500 opacity-100" : 
          status === "saving" ? "text-brand opacity-100" :
          "text-emerald-500 opacity-40"
        )}>
          {status === "saving" ? (
            <Loader2 size={10} className="animate-spin" />
          ) : status === "unsaved" ? (
            <Save size={10} />
          ) : (
            <Cloud size={10} />
          )}
          <span className="uppercase tracking-tighter text-[9px] font-bold">
            {status === "unsaved" ? "Modifications non enregistrées" : 
             status === "saving" ? "Enregistrement..." : 
             "Modifications enregistrées"}
          </span>
        </div>

        <div className="flex items-center gap-2 opacity-30">
          <div className="w-1 h-1 rounded-full bg-emerald-500" />
          <span>Lecture seule désactivée</span>
        </div>
      </div>
    </div>
  );
}
