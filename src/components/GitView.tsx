import { GitCommit, GitPullRequest, GitBranch, Share2, Plus, Check, Minus, Sparkles, ArrowUp, ArrowDown, History, RefreshCw } from "lucide-react";
import { useIDEStore } from "../store/useIDEStore.ts";
import { useState } from "react";
import { cn } from "../lib/utils.ts";

export default function GitView() {
  const { 
    stagedChanges, 
    unstagedChanges, 
    gitCommits, 
    stageFile, 
    unstageFile, 
    commitChanges, 
    pushChanges, 
    pullChanges,
    generateCommitMessage
  } = useIDEStore();

  const [message, setMessage] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isCommiting, setIsCommiting] = useState(false);
  const [actionStatus, setActionStatus] = useState<string | null>(null);

  const handleCommit = async () => {
    if (!message.trim() || stagedChanges.length === 0) return;
    setIsCommiting(true);
    await commitChanges(message);
    setMessage("");
    setIsCommiting(false);
    setActionStatus("Committé avec succès");
    setTimeout(() => setActionStatus(null), 3000);
  };

  const handleAICommit = async () => {
    if (stagedChanges.length === 0) return;
    setIsGenerating(true);
    const msg = await generateCommitMessage();
    setMessage(msg);
    setIsGenerating(false);
  };

  const handlePush = async () => {
    setActionStatus("Push en cours...");
    await pushChanges();
    setActionStatus("Poussé sur main");
    setTimeout(() => setActionStatus(null), 3000);
  };

  const handlePull = async () => {
    setActionStatus("Pull en cours...");
    await pullChanges();
    setActionStatus("À jour avec main");
    setTimeout(() => setActionStatus(null), 3000);
  };

  return (
    <div className="flex flex-col h-full bg-bg-panel/50">
      <div className="p-4 border-b border-white/5 bg-white/2 space-y-4">
        <div className="flex items-center justify-between">
           <div className="flex items-center gap-2">
             <GitBranch size={16} className="text-brand" />
             <span className="text-xs font-bold text-white">main</span>
           </div>
           <div className="flex gap-2">
             <button 
               onClick={handlePull}
               className="p-1.5 hover:bg-white/5 rounded text-text-dim hover:text-white transition-colors"
               title="Pull"
             >
               <ArrowDown size={14} />
             </button>
             <button 
               onClick={handlePush}
               className="p-1.5 hover:bg-white/5 rounded text-text-dim hover:text-white transition-colors"
               title="Push"
             >
               <ArrowUp size={14} />
             </button>
           </div>
        </div>

        {actionStatus && (
          <div className="py-1 px-3 bg-brand/10 border border-brand/20 rounded text-[10px] text-brand animate-pulse text-center font-medium">
            {actionStatus}
          </div>
        )}

        <div className="flex flex-col gap-2">
          <div className="flex justify-between items-center">
            <label className="text-[10px] font-bold text-text-dim uppercase tracking-widest">Message de commit</label>
            <button 
              onClick={handleAICommit}
              disabled={isGenerating || stagedChanges.length === 0}
              className="flex items-center gap-1 text-[10px] text-brand hover:text-brand-hover disabled:opacity-50 transition-colors"
            >
              {isGenerating ? <RefreshCw size={10} className="animate-spin" /> : <Sparkles size={10} />}
              <span>IA Message</span>
            </button>
          </div>
          <div className="relative">
            <textarea 
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Qu'avez-vous changé ?"
              className="w-full bg-[#0A0A0B] border border-white/10 rounded-lg p-2 text-xs h-20 outline-none focus:border-brand transition-all resize-none"
            />
            {message && (
              <button 
                onClick={handleCommit}
                disabled={isCommiting}
                className="absolute bottom-2 right-2 p-1.5 bg-brand text-white rounded-md hover:bg-brand-hover transition-colors shadow-lg"
              >
                <Check size={14} />
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {/* Staged Changes */}
        {stagedChanges.length > 0 && (
          <div className="mb-4">
            <div className="p-4 flex items-center justify-between bg-white/2 border-y border-white/5">
              <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">Indexés</span>
              <span className="text-[10px] bg-emerald-500/10 px-1.5 py-0.5 rounded text-emerald-400">{stagedChanges.length}</span>
            </div>
            <div className="divide-y divide-white/2">
              {stagedChanges.map((file, i) => (
                <div key={i} className="px-4 py-2 hover:bg-white/5 flex items-center justify-between group transition-colors">
                  <div className="flex items-center gap-3">
                    <GitPullRequest size={14} className="text-emerald-400" />
                    <span className="text-xs text-zinc-300 group-hover:text-white truncate">{file}</span>
                  </div>
                  <button 
                    onClick={() => unstageFile(file)}
                    className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-500/20 rounded transition-all text-text-dim hover:text-red-400"
                  >
                    <Minus size={12} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Unstaged Changes */}
        <div className="p-4 flex items-center justify-between bg-white/2 border-y border-white/5">
          <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest">Modifications</span>
          <span className="text-[10px] bg-amber-500/10 px-1.5 py-0.5 rounded text-amber-400">{unstagedChanges.length}</span>
        </div>
        
        {unstagedChanges.length === 0 && stagedChanges.length === 0 && (
          <div className="p-8 text-center text-text-dim text-xs italic opacity-50">
            Aucune modification détectée
          </div>
        )}

        <div className="divide-y divide-white/2">
          {unstagedChanges.map((file, i) => (
            <div key={i} className="px-4 py-2 hover:bg-white/5 flex items-center justify-between group transition-colors">
              <div className="flex items-center gap-3">
                <GitPullRequest size={14} className="text-amber-400" />
                <span className="text-xs text-zinc-300 group-hover:text-white truncate">{file}</span>
              </div>
              <button 
                onClick={() => stageFile(file)}
                className="opacity-0 group-hover:opacity-100 p-1 hover:bg-brand/20 rounded transition-all text-text-dim hover:text-brand"
              >
                <Plus size={12} />
              </button>
            </div>
          ))}
        </div>

        {/* Commit History */}
        {gitCommits.length > 0 && (
          <div className="mt-6 border-t border-white/5">
            <div className="p-4 bg-white/2 flex items-center gap-2">
              <History size={14} className="text-text-dim" />
              <span className="text-[10px] font-bold text-text-dim uppercase tracking-widest">Historique</span>
            </div>
            <div className="divide-y divide-white/2">
              {gitCommits.map((commit, i) => (
                <div key={i} className="px-4 py-3 hover:bg-white/5 transition-colors">
                  <div className="flex justify-between items-start mb-1">
                    <span className="text-xs text-white font-medium line-clamp-1">{commit.message}</span>
                    <span className="text-[9px] font-mono text-brand bg-brand/5 px-1 rounded uppercase">{commit.hash}</span>
                  </div>
                  <span className="text-[10px] text-text-dim">{commit.date}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="p-4 border-t border-white/5 bg-white/2">
        <div className="flex items-center justify-between text-text-dim">
          <span className="text-[10px] uppercase font-bold tracking-tighter opacity-50">rassoul code v1.0</span>
          <Share2 size={14} className="cursor-pointer hover:text-white transition-colors" />
        </div>
      </div>
    </div>
  );
}
