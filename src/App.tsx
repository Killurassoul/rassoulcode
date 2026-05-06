/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState } from "react";
import Sidebar from "./components/Sidebar.tsx";
import Explorer from "./components/Explorer.tsx";
import GitView from "./components/GitView.tsx";
import SearchView from "./components/SearchView.tsx";
import Editor from "./components/Editor.tsx";
import AIChat from "./components/AIChat.tsx";
import Terminal from "./components/Terminal.tsx";
import StatusBar from "./components/StatusBar.tsx";
import TabSystem from "./components/TabSystem.tsx";
import Breadcrumbs from "./components/Breadcrumbs.tsx";
import CommandPalette from "./components/CommandPalette.tsx";
import { useIDEStore } from "./store/useIDEStore.ts";
import { motion, AnimatePresence } from "motion/react";
import { PanelLeftClose, PanelLeft, PanelRightClose, PanelRight } from "lucide-react";

export default function App() {
  const { activeSidebarTab, refreshFileTree } = useIDEStore();
  const [isExplorerOpen, setExplorerOpen] = useState(true);
  const [isChatOpen, setChatOpen] = useState(true);

  useEffect(() => {
    refreshFileTree();
  }, [refreshFileTree]);

  const sidebarLabels: Record<string, string> = {
    explorer: "Explorateur",
    git: "Gestion du code",
    search: "Recherche globale",
    ai: "Agent IA",
    history: "Historique",
    settings: "Paramètres"
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-bg-dark text-[#E0E0E0] font-sans selection:bg-brand/30">
      {/* Editorial Title Bar */}
      <CommandPalette />
      <div className="h-10 bg-bg-panel border-b border-white/5 flex items-center px-4 justify-between select-none">
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5 mr-4">
            <div className="w-3 h-3 rounded-full bg-[#FF5F57]"></div>
            <div className="w-3 h-3 rounded-full bg-[#FEB22E]"></div>
            <div className="w-3 h-3 rounded-full bg-[#28C840]"></div>
          </div>
          <span className="text-[11px] font-medium tracking-[0.2em] uppercase opacity-40">
            rassoul code — Espace de travail
          </span>
        </div>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 bg-bg-card px-3 py-1 rounded border border-white/10">
            <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
            <span className="text-[10px] font-mono opacity-80 text-blue-400">Gemini 3.1 Pro</span>
          </div>
          <div className="text-[10px] font-mono opacity-30">v1.2.0-stable</div>
        </div>
      </div>

      {/* Main Workspace */}
      <div className="flex flex-1 overflow-hidden relative">
        
        {/* Activity Bar (Sidebar) */}
        <Sidebar />

        {/* Side Panel (Explorer etc) */}
        <AnimatePresence mode="wait">
          {isExplorerOpen && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 260, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              className="h-full border-r border-border bg-bg-panel/50 overflow-hidden flex flex-col"
            >
              <div className="p-4 border-b border-white/5 flex items-center justify-between bg-white/2">
                <span className="text-[11px] font-semibold text-text-dim uppercase tracking-wider">
                  {sidebarLabels[activeSidebarTab] || activeSidebarTab}
                </span>
                <button 
                  onClick={() => setExplorerOpen(false)}
                  className="p-1 hover:bg-white/5 rounded text-text-dim hover:text-white transition-colors"
                >
                  <PanelLeftClose size={14} />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto">
                {activeSidebarTab === "explorer" && <Explorer />}
                {activeSidebarTab === "git" && <GitView />}
                {activeSidebarTab === "search" && <SearchView />}
                {activeSidebarTab !== "explorer" && activeSidebarTab !== "git" && activeSidebarTab !== "search" && (
                  <div className="p-8 text-center text-text-dim text-sm italic">
                    Bientôt disponible...
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {!isExplorerOpen && (
          <button 
            onClick={() => setExplorerOpen(true)}
            className="absolute left-16 top-4 z-50 p-2 glass rounded-full hover:bg-white/10 text-white"
          >
            <PanelLeft size={16} />
          </button>
        )}

        {/* Editor Area & Terminal */}
        <div className="flex flex-col flex-1 min-w-0 bg-bg-dark relative shadow-inner editor-gradient">
          <TabSystem />
          <Breadcrumbs />
          <div className="flex-1 min-h-0">
            <Editor />
          </div>
          
          <div className="h-[250px] border-t border-border bg-bg-panel">
            <Terminal />
          </div>
        </div>

        {/* AI Agent Chat Panel */}
        <AnimatePresence mode="wait">
          {isChatOpen && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 400, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              className="h-full border-l border-border bg-bg-panel/80 backdrop-blur-xl flex flex-col"
            >
              <div className="p-4 border-b border-border flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-sm font-medium">Agent IA Rassoul</span>
                </div>
                <button 
                  onClick={() => setChatOpen(false)}
                  className="p-1 hover:bg-white/5 rounded text-text-dim hover:text-white transition-colors"
                >
                  <PanelRightClose size={16} />
                </button>
              </div>
              <AIChat />
            </motion.div>
          )}
        </AnimatePresence>

        {!isChatOpen && (
          <button 
            onClick={() => setChatOpen(true)}
            className="absolute right-4 top-4 z-50 p-2 glass rounded-full hover:bg-white/10 text-white"
          >
            <PanelRight size={16} />
          </button>
        )}
      </div>

      {/* Footer */}
      <StatusBar />
    </div>
  );
}

