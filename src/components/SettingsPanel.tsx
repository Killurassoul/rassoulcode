import { useState } from "react";
import { useIDEStore } from "../store/useIDEStore";
import { AI_PROVIDERS, getProvider } from "../lib/ai-providers";
import { cn } from "../lib/utils";
import { Eye, EyeOff, Check, Shield, Zap, Palette, Key, Cpu, Sliders, ChevronDown } from "lucide-react";
import { motion } from "motion/react";

export default function SettingsPanel() {
  const {
    aiProvider, setAiProvider,
    aiModel, setAiModel,
    apiKeys, setApiKey,
    temperature, setTemperature,
    maxTokens, setMaxTokens,
    executionMode, setExecutionMode,
    theme, setTheme,
  } = useIDEStore();

  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});
  const [activeSection, setActiveSection] = useState<string>("provider");
  const [saved, setSaved] = useState(false);

  const currentProvider = getProvider(aiProvider);

  const toggleKeyVisibility = (id: string) => {
    setShowKeys(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const sections = [
    { id: "provider", label: "AI Provider", icon: Cpu },
    { id: "keys", label: "API Keys", icon: Key },
    { id: "model", label: "Model Config", icon: Sliders },
    { id: "security", label: "Security", icon: Shield },
    { id: "appearance", label: "Appearance", icon: Palette },
  ];

  return (
    <div className="flex flex-col h-full bg-bg-panel/50 overflow-hidden">
      {/* Settings Header */}
      <div className="p-4 border-b border-white/5 bg-white/2">
        <h2 className="text-sm font-bold text-white mb-1">Settings</h2>
        <p className="text-[10px] text-zinc-500">Configure your AI providers, models, and preferences</p>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-white/5 overflow-x-auto no-scrollbar">
        {sections.map(section => (
          <button
            key={section.id}
            onClick={() => setActiveSection(section.id)}
            className={cn(
              "flex items-center gap-1.5 px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider whitespace-nowrap transition-all border-b-2",
              activeSection === section.id
                ? "text-brand border-brand bg-brand/5"
                : "text-zinc-500 border-transparent hover:text-white hover:bg-white/5"
            )}
          >
            <section.icon size={12} />
            {section.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* AI Provider Section */}
        {activeSection === "provider" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Active Provider</label>
            <div className="grid grid-cols-1 gap-2">
              {AI_PROVIDERS.map(provider => (
                <button
                  key={provider.id}
                  onClick={() => setAiProvider(provider.id)}
                  className={cn(
                    "flex items-center justify-between p-3 rounded-lg border transition-all text-left",
                    aiProvider === provider.id
                      ? "bg-brand/10 border-brand/30 text-white"
                      : "bg-bg-card/50 border-white/5 text-zinc-400 hover:bg-white/5 hover:text-white"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-bold",
                      aiProvider === provider.id ? "bg-brand text-white" : "bg-white/5 text-zinc-500"
                    )}>
                      {provider.name.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="text-xs font-semibold">{provider.name}</div>
                      <div className="text-[10px] text-zinc-600">{provider.models.length} models available</div>
                    </div>
                  </div>
                  {aiProvider === provider.id && (
                    <Check size={16} className="text-brand" />
                  )}
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {/* API Keys Section */}
        {activeSection === "keys" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">API Keys</label>
            <p className="text-[10px] text-zinc-600 mb-4">Keys are stored locally and encrypted. Never shared.</p>
            <div className="space-y-3">
              {AI_PROVIDERS.map(provider => (
                <div key={provider.id} className="space-y-1.5">
                  <label className="text-[10px] font-semibold text-zinc-400 flex items-center gap-2">
                    {provider.name}
                    {apiKeys[provider.id] && (
                      <span className="text-[8px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded-full">Configured</span>
                    )}
                  </label>
                  <div className="relative">
                    <input
                      type={showKeys[provider.id] ? "text" : "password"}
                      value={apiKeys[provider.id] || ""}
                      onChange={(e) => setApiKey(provider.id, e.target.value)}
                      placeholder={`Enter ${provider.name} API key...`}
                      className="w-full bg-bg-dark border border-white/10 rounded-lg px-3 py-2 pr-10 text-xs text-white font-mono outline-none focus:border-brand transition-all"
                    />
                    <button
                      onClick={() => toggleKeyVisibility(provider.id)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-zinc-500 hover:text-white transition-colors"
                    >
                      {showKeys[provider.id] ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Model Config Section */}
        {activeSection === "model" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            {/* Model Selection */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
                Model ({currentProvider?.name || aiProvider})
              </label>
              <div className="space-y-2">
                {currentProvider?.models.map(model => (
                  <button
                    key={model.id}
                    onClick={() => setAiModel(model.id)}
                    className={cn(
                      "w-full flex items-center justify-between p-3 rounded-lg border text-left transition-all",
                      aiModel === model.id
                        ? "bg-brand/10 border-brand/30"
                        : "bg-bg-card/50 border-white/5 hover:bg-white/5"
                    )}
                  >
                    <div>
                      <div className="text-xs font-medium text-white">{model.name}</div>
                      <div className="text-[10px] text-zinc-600 font-mono">{model.id}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-[9px] text-zinc-500">{(model.contextWindow / 1000).toFixed(0)}k ctx</div>
                      <div className="text-[9px] text-zinc-600">{(model.maxOutput / 1000).toFixed(0)}k max out</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Temperature */}
            <div className="space-y-2">
              <div className="flex justify-between">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Temperature</label>
                <span className="text-[10px] font-mono text-brand">{temperature.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="0"
                max="2"
                step="0.05"
                value={temperature}
                onChange={(e) => setTemperature(parseFloat(e.target.value))}
                className="w-full accent-brand"
              />
              <div className="flex justify-between text-[9px] text-zinc-600">
                <span>Precise</span>
                <span>Creative</span>
              </div>
            </div>

            {/* Max Tokens */}
            <div className="space-y-2">
              <div className="flex justify-between">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Max Output Tokens</label>
                <span className="text-[10px] font-mono text-brand">{maxTokens.toLocaleString()}</span>
              </div>
              <input
                type="range"
                min="256"
                max="65536"
                step="256"
                value={maxTokens}
                onChange={(e) => setMaxTokens(parseInt(e.target.value))}
                className="w-full accent-brand"
              />
              <div className="flex justify-between text-[9px] text-zinc-600">
                <span>256</span>
                <span>65,536</span>
              </div>
            </div>
          </motion.div>
        )}

        {/* Security Section */}
        {activeSection === "security" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Execution Mode</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setExecutionMode("safe")}
                  className={cn(
                    "p-4 rounded-xl border text-left transition-all",
                    executionMode === "safe"
                      ? "bg-emerald-500/10 border-emerald-500/30"
                      : "bg-bg-card/50 border-white/5 hover:bg-white/5"
                  )}
                >
                  <Shield size={20} className={executionMode === "safe" ? "text-emerald-400 mb-2" : "text-zinc-500 mb-2"} />
                  <div className="text-xs font-semibold text-white">Safe Mode</div>
                  <div className="text-[10px] text-zinc-500 mt-1">Confirm before every action</div>
                </button>
                <button
                  onClick={() => setExecutionMode("autonomous")}
                  className={cn(
                    "p-4 rounded-xl border text-left transition-all",
                    executionMode === "autonomous"
                      ? "bg-amber-500/10 border-amber-500/30"
                      : "bg-bg-card/50 border-white/5 hover:bg-white/5"
                  )}
                >
                  <Zap size={20} className={executionMode === "autonomous" ? "text-amber-400 mb-2" : "text-zinc-500 mb-2"} />
                  <div className="text-xs font-semibold text-white">Autonomous</div>
                  <div className="text-[10px] text-zinc-500 mt-1">AI acts freely within project</div>
                </button>
              </div>
            </div>

            <div className="p-4 bg-amber-500/5 border border-amber-500/20 rounded-xl">
              <div className="flex items-start gap-3">
                <Shield size={16} className="text-amber-400 mt-0.5" />
                <div>
                  <h4 className="text-xs font-semibold text-amber-300 mb-1">Security Notice</h4>
                  <p className="text-[10px] text-amber-200/60 leading-relaxed">
                    In Safe Mode, dangerous commands (rm -rf, format, etc.) are automatically blocked.
                    All file changes require confirmation before execution.
                    Autonomous mode gives the AI full access to modify files within your project folder.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Appearance Section */}
        {activeSection === "appearance" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Theme</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setTheme("dark")}
                  className={cn(
                    "p-4 rounded-xl border text-center transition-all",
                    theme === "dark"
                      ? "bg-white/5 border-brand/30"
                      : "bg-bg-card/50 border-white/5 hover:bg-white/5"
                  )}
                >
                  <div className="w-full h-16 rounded-lg bg-[#0A0A0C] border border-white/10 mb-3" />
                  <span className="text-xs font-medium text-white">Dark</span>
                </button>
                <button
                  onClick={() => setTheme("light")}
                  className={cn(
                    "p-4 rounded-xl border text-center transition-all opacity-50 cursor-not-allowed",
                    theme === "light"
                      ? "bg-white/5 border-brand/30"
                      : "bg-bg-card/50 border-white/5"
                  )}
                  disabled
                >
                  <div className="w-full h-16 rounded-lg bg-white/80 border border-zinc-200 mb-3" />
                  <span className="text-xs font-medium text-white">Light (Soon)</span>
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Save indicator */}
      {saved && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className="p-3 bg-emerald-500/10 border-t border-emerald-500/20 flex items-center justify-center gap-2"
        >
          <Check size={14} className="text-emerald-400" />
          <span className="text-xs text-emerald-400 font-medium">Settings saved</span>
        </motion.div>
      )}
    </div>
  );
}
