import { 
  GitBranch, 
  RotateCw, 
  Wifi, 
  CheckCircle2, 
  Bell, 
  Code2, 
  Clock,
  ShieldCheck
} from "lucide-react";
import { useIDEStore } from "../store/useIDEStore.ts";

export default function StatusBar() {
  const { aiModel, executionMode, activeFile } = useIDEStore();

  return (
    <div className="h-6 bg-brand text-white flex items-center justify-between px-3 text-[10px] font-medium select-none z-[100]">
      <div className="flex items-center gap-4 h-full">
        <div className="flex items-center gap-1.5 opacity-80 hover:opacity-100 hover:bg-white/10 px-1.5 h-full cursor-pointer transition-all">
          <GitBranch size={11} />
          <span>(main)</span>
        </div>
        <div className="flex items-center gap-1.5 opacity-80 hover:opacity-100 hover:bg-white/10 px-1.5 h-full cursor-pointer transition-all">
          <span>Git: [4f2a8d1]</span>
        </div>
        {activeFile && (
           <div className="flex items-center gap-1.5 opacity-80">
             <Code2 size={11} />
             <span>{activeFile}</span>
           </div>
        )}
      </div>

      <div className="flex items-center gap-4 h-full">
        <span className="opacity-80">TypeScript React</span>
        <div className="flex items-center gap-1.5 opacity-80 hover:opacity-100 hover:bg-white/10 px-1.5 h-full cursor-pointer transition-all">
          <ShieldCheck size={11} />
          <span className="uppercase tracking-tighter">Mode Autonome Actif</span>
        </div>
        <div className="flex items-center gap-1.5 hover:bg-white/10 px-1.5 h-full cursor-pointer transition-all">
          <Sparkles size={11} className="text-white animate-pulse" />
          <span>{aiModel}</span>
        </div>
      </div>
    </div>
  );
}

function Sparkles({ size, className }: { size: number, className?: string }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/>
      <path d="M5 3v4"/><path d="M19 17v4"/><path d="M3 5h4"/><path d="M17 19h4"/>
    </svg>
  );
}
