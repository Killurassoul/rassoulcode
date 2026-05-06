import {
  GitBranch,
  Wifi,
  Code2,
  ShieldCheck,
  Zap,
} from "lucide-react";
import { useIDEStore } from "../store/useIDEStore";

export default function StatusBar() {
  const { aiModel, aiProvider, executionMode, activeFile } = useIDEStore();

  return (
    <div className="h-6 bg-brand text-white flex items-center justify-between px-3 text-[10px] font-medium select-none z-[100]">
      <div className="flex items-center gap-4 h-full">
        <div className="flex items-center gap-1.5 opacity-80 hover:opacity-100 hover:bg-white/10 px-1.5 h-full cursor-pointer transition-all">
          <GitBranch size={11} />
          <span>main</span>
        </div>
        {activeFile && (
          <div className="flex items-center gap-1.5 opacity-80">
            <Code2 size={11} />
            <span className="max-w-[200px] truncate">{activeFile}</span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-4 h-full">
        <div className="flex items-center gap-1.5 opacity-80 hover:opacity-100 hover:bg-white/10 px-1.5 h-full cursor-pointer transition-all">
          <ShieldCheck size={11} />
          <span className="uppercase tracking-tighter">
            {executionMode === "safe" ? "Safe Mode" : "Autonomous"}
          </span>
        </div>
        <div className="flex items-center gap-1.5 hover:bg-white/10 px-1.5 h-full cursor-pointer transition-all">
          <Zap size={11} className="animate-pulse" />
          <span>{aiProvider}/{aiModel.split("/").pop()?.substring(0, 20)}</span>
        </div>
        <div className="flex items-center gap-1.5 opacity-60">
          <Wifi size={11} />
          <span>Connected</span>
        </div>
      </div>
    </div>
  );
}
