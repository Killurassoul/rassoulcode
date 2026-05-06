import {
  Files,
  Search,
  MessageSquare,
  GitBranch,
  Settings,
  History,
  Code2,
  User,
} from "lucide-react";
import { useIDEStore, SidebarTab } from "../store/useIDEStore";
import { cn } from "../lib/utils";

export default function Sidebar() {
  const { activeSidebarTab, setActiveSidebarTab, setCurrentPage } = useIDEStore();

  const items: { id: SidebarTab; icon: any; label: string }[] = [
    { id: "explorer", icon: Files, label: "Explorer" },
    { id: "search", icon: Search, label: "Search" },
    { id: "ai", icon: MessageSquare, label: "AI Agent" },
    { id: "git", icon: GitBranch, label: "Source Control" },
    { id: "history", icon: History, label: "History" },
  ];

  return (
    <div className="w-[60px] h-full flex flex-col items-center py-4 bg-bg-sub border-r border-white/5 z-50">
      <div className="mb-8">
        <button
          onClick={() => setCurrentPage("dashboard")}
          className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand to-indigo-600 flex items-center justify-center shadow-lg shadow-brand/20 hover:shadow-brand/40 transition-shadow"
          title="Back to Dashboard"
        >
          <Code2 size={18} className="text-white" strokeWidth={2.5} />
        </button>
      </div>

      <div className="flex-1 flex flex-col gap-4">
        {items.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveSidebarTab(item.id)}
            className={cn(
              "p-3 rounded-xl transition-all duration-200 group relative",
              activeSidebarTab === item.id
                ? "bg-white/5 text-white"
                : "text-text-dim hover:text-white hover:bg-white/5"
            )}
            title={item.label}
          >
            <item.icon size={20} strokeWidth={activeSidebarTab === item.id ? 2.5 : 2} />
            {activeSidebarTab === item.id && (
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-brand rounded-r-full shadow-[0_0_8px_rgba(37,99,235,0.5)]" />
            )}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-4 mt-auto">
        <button
          onClick={() => setActiveSidebarTab("settings")}
          className={cn(
            "p-3 rounded-xl transition-all duration-200 text-text-dim hover:text-white hover:bg-white/5",
            activeSidebarTab === "settings" && "bg-white/10 text-white"
          )}
        >
          <Settings size={22} />
        </button>
        <div className="p-3">
          <div className="w-6 h-6 rounded-full bg-zinc-800 flex items-center justify-center border border-white/5 hover:border-white/20 cursor-pointer">
            <User size={14} className="text-text-dim" />
          </div>
        </div>
      </div>
    </div>
  );
}
