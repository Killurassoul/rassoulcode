import { useState } from "react";
import { useIDEStore } from "../store/useIDEStore";
import { motion } from "motion/react";
import { FolderOpen, Plus, Clock, Trash2, Code2, Layers, ArrowRight, Cpu } from "lucide-react";
import { cn } from "../lib/utils";

export default function ProjectsDashboard() {
  const { recentProjects, removeRecentProject, openProject, setCurrentPage } = useIDEStore();
  const [isCreating, setIsCreating] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");

  const handleOpenFolder = async () => {
    if (window.electronAPI) {
      const dirPath = await window.electronAPI.openDirectory();
      if (dirPath) {
        await openProject(dirPath);
      }
    } else {
      // Web fallback - use current directory
      setCurrentPage("workspace");
    }
  };

  const handleOpenRecent = async (path: string) => {
    await openProject(path);
  };

  const frameworkIcons: Record<string, string> = {
    "React": "bg-cyan-500/20 text-cyan-400",
    "Next.js": "bg-white/10 text-white",
    "Vue": "bg-emerald-500/20 text-emerald-400",
    "Python": "bg-yellow-500/20 text-yellow-400",
    "Node.js": "bg-green-500/20 text-green-400",
    "Express": "bg-zinc-500/20 text-zinc-400",
    "Electron": "bg-blue-500/20 text-blue-400",
    "Angular": "bg-red-500/20 text-red-400",
    "Svelte": "bg-orange-500/20 text-orange-400",
    "Rust": "bg-amber-500/20 text-amber-400",
    "Go": "bg-sky-500/20 text-sky-400",
  };

  return (
    <div className="h-screen w-screen bg-bg-dark flex flex-col overflow-hidden select-none">
      {/* Title Bar */}
      <div className="h-12 bg-bg-panel border-b border-white/5 flex items-center px-6 justify-between draggable">
        <div className="flex items-center gap-3">
          <div className="flex gap-1.5 mr-4">
            <div className="w-3 h-3 rounded-full bg-[#FF5F57]" />
            <div className="w-3 h-3 rounded-full bg-[#FEB22E]" />
            <div className="w-3 h-3 rounded-full bg-[#28C840]" />
          </div>
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-brand to-indigo-600 flex items-center justify-center">
            <Code2 size={14} className="text-white" />
          </div>
          <span className="text-sm font-semibold text-white">CodeForge AI</span>
        </div>
        <span className="text-[10px] font-mono text-zinc-600">v2.0.0</span>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-8 py-16">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            {/* Header */}
            <div className="mb-12">
              <h1 className="text-4xl font-bold text-white mb-3 tracking-tight">
                Welcome back
              </h1>
              <p className="text-zinc-500 text-lg">
                Open a project or start building something new.
              </p>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-2 gap-4 mb-12">
              <button
                onClick={handleOpenFolder}
                className="group flex items-center gap-4 p-5 bg-bg-panel/50 border border-white/5 rounded-xl hover:bg-white/5 hover:border-brand/30 transition-all"
              >
                <div className="p-3 rounded-xl bg-brand/10 text-brand group-hover:bg-brand group-hover:text-white transition-all">
                  <FolderOpen size={22} />
                </div>
                <div className="text-left">
                  <div className="text-sm font-semibold text-white">Open Project</div>
                  <div className="text-xs text-zinc-500">Browse for an existing folder</div>
                </div>
                <ArrowRight size={16} className="ml-auto text-zinc-600 group-hover:text-brand transition-colors" />
              </button>

              <button
                onClick={() => setIsCreating(true)}
                className="group flex items-center gap-4 p-5 bg-bg-panel/50 border border-white/5 rounded-xl hover:bg-white/5 hover:border-indigo-500/30 transition-all"
              >
                <div className="p-3 rounded-xl bg-indigo-500/10 text-indigo-400 group-hover:bg-indigo-500 group-hover:text-white transition-all">
                  <Plus size={22} />
                </div>
                <div className="text-left">
                  <div className="text-sm font-semibold text-white">New Project</div>
                  <div className="text-xs text-zinc-500">Let AI scaffold a new project</div>
                </div>
                <ArrowRight size={16} className="ml-auto text-zinc-600 group-hover:text-indigo-400 transition-colors" />
              </button>
            </div>

            {/* New Project Dialog */}
            {isCreating && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="mb-8 p-6 bg-bg-panel border border-brand/20 rounded-xl"
              >
                <h3 className="text-sm font-semibold text-white mb-4">Create New Project</h3>
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={newProjectName}
                    onChange={(e) => setNewProjectName(e.target.value)}
                    placeholder="Project name..."
                    className="flex-1 bg-bg-dark border border-white/10 rounded-lg px-4 py-2 text-sm text-white outline-none focus:border-brand transition-all"
                    autoFocus
                  />
                  <button
                    onClick={() => { setIsCreating(false); setNewProjectName(""); }}
                    className="px-4 py-2 text-sm text-zinc-400 hover:text-white transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={async () => {
                      if (newProjectName.trim()) {
                        setIsCreating(false);
                        setNewProjectName("");
                        handleOpenFolder();
                      }
                    }}
                    className="px-6 py-2 bg-brand text-white text-sm font-medium rounded-lg hover:bg-brand-hover transition-colors"
                  >
                    Create
                  </button>
                </div>
              </motion.div>
            )}

            {/* Recent Projects */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Clock size={16} className="text-zinc-500" />
                <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider">Recent Projects</h2>
              </div>

              {recentProjects.length === 0 ? (
                <div className="py-16 text-center">
                  <Layers size={40} className="mx-auto mb-4 text-zinc-700" />
                  <p className="text-zinc-600 text-sm">No recent projects</p>
                  <p className="text-zinc-700 text-xs mt-1">Open a folder to get started</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {recentProjects.map((project, i) => (
                    <motion.div
                      key={project.path}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      onClick={() => handleOpenRecent(project.path)}
                      className="group flex items-center gap-4 p-4 bg-bg-panel/30 border border-white/5 rounded-xl cursor-pointer hover:bg-white/5 hover:border-white/10 transition-all"
                    >
                      <div className="p-2 rounded-lg bg-white/5 text-zinc-400 group-hover:text-white transition-colors">
                        <FolderOpen size={18} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-white truncate">{project.name}</div>
                        <div className="text-[11px] text-zinc-600 font-mono truncate">{project.path}</div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {project.frameworks.map(fw => (
                          <span key={fw} className={cn("text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider", frameworkIcons[fw] || "bg-zinc-500/20 text-zinc-400")}>
                            {fw}
                          </span>
                        ))}
                      </div>
                      <div className="text-[10px] text-zinc-600 shrink-0">
                        {new Date(project.lastOpened).toLocaleDateString()}
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); removeRecentProject(project.path); }}
                        className="p-1 opacity-0 group-hover:opacity-100 hover:bg-red-500/20 rounded text-zinc-500 hover:text-red-400 transition-all"
                      >
                        <Trash2 size={14} />
                      </button>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="mt-16 pt-8 border-t border-white/5 flex items-center justify-between text-[10px] text-zinc-700">
              <div className="flex items-center gap-2">
                <Cpu size={12} />
                <span>Powered by multi-provider AI</span>
              </div>
              <span>CodeForge AI Desktop v2.0.0</span>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
