import React, { useState } from "react";
import { useIDEStore } from "../store/useIDEStore.ts";
import { Settings, X } from "lucide-react";
import APIKeySettings from "./APIKeySettings.tsx";
import { motion, AnimatePresence } from "motion/react";

export default function SettingsPanel() {
  const { activeSidebarTab, setActiveSidebarTab } = useIDEStore();
  const [isOpen, setIsOpen] = useState(false);

  // Si on a activé l'onglet settings depuis le store
  if (activeSidebarTab === "settings" && !isOpen) {
    setIsOpen(true);
  }

  const handleClose = () => {
    setIsOpen(false);
    setActiveSidebarTab("explorer");
  };

  return (
    <>
      {/* Settings Button (can be in toolbar) */}
      <button
        onClick={() => setIsOpen(true)}
        className="p-2 hover:bg-white/5 rounded-lg transition-colors text-text-dim hover:text-white"
        title="Paramètres"
      >
        <Settings size={18} />
      </button>

      {/* Settings Modal */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={handleClose}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-bg-panel border border-white/10 rounded-2xl w-full max-w-md max-h-[80vh] overflow-hidden shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-white/10 bg-bg-dark">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Settings size={20} />
                  Paramètres
                </h2>
                <button
                  onClick={handleClose}
                  className="p-1 hover:bg-white/10 rounded transition-colors text-text-dim hover:text-white"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Content */}
              <div className="overflow-y-auto max-h-[calc(80vh-80px)]">
                <APIKeySettings />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
