import { useEffect, useState } from "react";
import { useIDEStore } from "../store/useIDEStore";
import { motion } from "motion/react";

export default function SplashScreen() {
  const { setCurrentPage, loadSettings, loadRecentProjects } = useIDEStore();
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState("Initializing...");

  useEffect(() => {
    const init = async () => {
      setStatus("Loading settings...");
      setProgress(20);
      await loadSettings();

      setStatus("Loading recent projects...");
      setProgress(50);
      await loadRecentProjects();

      setStatus("Preparing workspace...");
      setProgress(80);
      await new Promise((r) => setTimeout(r, 400));

      setStatus("Ready");
      setProgress(100);
      await new Promise((r) => setTimeout(r, 300));

      setCurrentPage("dashboard");
    };
    init();
  }, []);

  return (
    <div className="h-screen w-screen bg-bg-dark flex flex-col items-center justify-center select-none overflow-hidden relative">
      {/* Background effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-brand/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="relative z-10 flex flex-col items-center"
      >
        {/* Logo */}
        <div className="mb-8">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-brand to-indigo-600 flex items-center justify-center shadow-2xl shadow-brand/30">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="16 18 22 12 16 6" />
              <polyline points="8 6 2 12 8 18" />
              <line x1="12" y1="2" x2="12" y2="22" opacity="0.3" />
            </svg>
          </div>
        </div>

        {/* Title */}
        <h1 className="text-3xl font-bold text-white mb-1 tracking-tight">
          CodeForge AI
        </h1>
        <p className="text-sm text-zinc-500 mb-12 font-medium">
          Autonomous AI Software Engineer
        </p>

        {/* Progress bar */}
        <div className="w-64 mb-4">
          <div className="h-1 bg-white/5 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-brand to-indigo-500 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            />
          </div>
        </div>

        {/* Status text */}
        <motion.p
          key={status}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-xs text-zinc-600 font-mono"
        >
          {status}
        </motion.p>
      </motion.div>

      {/* Version */}
      <div className="absolute bottom-6 text-[10px] text-zinc-700 font-mono">
        v2.0.0
      </div>
    </div>
  );
}
