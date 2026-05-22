import React, { useState } from "react";
import { useIDEStore } from "../store/useIDEStore.ts";
import { Key, Check, AlertCircle, Loader2, Copy, Eye, EyeOff } from "lucide-react";
import { detectAPIKey } from "../lib/apiDetector.ts";
import { motion } from "motion/react";

export default function APIKeySettings() {
  const { apiKey, setApiKey, apiKeyStatus, setApiKeyStatus, aiModel, aiProvider } = useIDEStore();
  const [input, setInput] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSetupKey = async () => {
    if (!input.trim()) {
      setError("Veuillez coller une clé API");
      return;
    }

    setError(null);
    setSuccess(false);

    try {
      await setApiKey(input);
      setSuccess(true);
      setInput("");
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message || "Erreur lors de la configuration de la clé API");
    }
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setInput(text);
      setError(null);
    } catch {
      setError("Impossible d'accéder au presse-papiers");
    }
  };

  const detectedAPI = detectAPIKey(input);
  const providerLogos: Record<string, string> = {
    gemini: "🔵",
    openai: "⚫",
    anthropic: "🟣",
    cohere: "🟢",
    huggingface: "🟠",
    unknown: "❓",
  };

  return (
    <div className="p-6 space-y-6 max-h-full overflow-y-auto">
      <div className="space-y-3">
        <h3 className="text-sm font-bold uppercase tracking-wider text-white">
          Configuration de l'API IA
        </h3>
        <p className="text-xs text-text-dim leading-relaxed">
          Collez n'importe quelle clé API (Gemini, OpenAI, Anthropic, Cohere, HuggingFace...).
          Le système détecte automatiquement le fournisseur et le meilleur modèle disponible.
        </p>
      </div>

      {/* API Status Indicator */}
      {apiKeyStatus === "valid" && apiKey && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-lg space-y-3"
        >
          <div className="flex items-start gap-3">
            <Check className="w-5 h-5 text-emerald-500 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-emerald-400 mb-2">
                ✅ Clé API configurée et validée
              </p>
              <div className="space-y-2 text-xs text-emerald-300">
                <p>
                  <span className="font-mono text-emerald-400">Provider:</span>{" "}
                  {providerLogos[aiProvider]} {aiProvider}
                </p>
                <p>
                  <span className="font-mono text-emerald-400">Modèle:</span> {aiModel}
                </p>
                <p className="flex items-center gap-2 font-mono break-all">
                  <span className="text-emerald-400">Clé:</span>
                  <span className="opacity-60">
                    {showKey ? apiKey : `${apiKey.substring(0, 8)}...`}
                  </span>
                  <button
                    onClick={() => setShowKey(!showKey)}
                    className="p-1 hover:bg-emerald-500/20 rounded transition-colors"
                  >
                    {showKey ? <EyeOff size={12} /> : <Eye size={12} />}
                  </button>
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* API Input Area */}
      <div className="space-y-3">
        <label className="text-xs font-semibold uppercase text-text-dim block">
          Clé API
        </label>

        <div className="relative">
          <textarea
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              setError(null);
            }}
            placeholder="Collez votre clé API ici..."
            className="w-full bg-[#0A0A0B] border border-border rounded-lg p-3 text-xs font-mono resize-none h-24 focus:border-brand outline-none transition-colors placeholder:text-zinc-600"
          />

          {input && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="absolute top-2 right-2 text-[10px] font-bold px-2 py-1 rounded bg-bg-card border border-white/10"
            >
              {detectedAPI.isValid ? (
                <span className="text-emerald-400 flex items-center gap-1">
                  <Check size={12} /> {providerLogos[detectedAPI.provider]} {detectedAPI.provider}
                </span>
              ) : (
                <span className="text-orange-400 flex items-center gap-1">
                  <AlertCircle size={12} /> Format inconnu
                </span>
              )}
            </motion.div>
          )}
        </div>

        {detectedAPI.isValid && input && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-2 bg-blue-500/10 border border-blue-500/30 rounded text-[10px] text-blue-300"
          >
            💡 Détecté: <span className="font-bold">{detectedAPI.displayName}</span>
          </motion.div>
        )}

        <div className="flex gap-2">
          <button
            onClick={handlePaste}
            className="flex-1 py-2 px-3 bg-white/5 hover:bg-white/10 text-white text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-2 border border-white/10"
          >
            <Copy size={14} />
            Coller la clé
          </button>

          <button
            onClick={handleSetupKey}
            disabled={!input.trim() || apiKeyStatus === "validating"}
            className="flex-1 py-2 px-3 bg-brand hover:bg-brand/90 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            {apiKeyStatus === "validating" ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                Validation...
              </>
            ) : (
              <>
                <Key size={14} />
                Activer
              </>
            )}
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg flex items-start gap-3"
        >
          <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-xs font-semibold text-red-400 mb-1">Erreur</p>
            <p className="text-xs text-red-300">{error}</p>
          </div>
        </motion.div>
      )}

      {/* Success Message */}
      {success && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg flex items-center gap-2"
        >
          <Check className="w-4 h-4 text-emerald-500" />
          <p className="text-xs text-emerald-300 font-medium">Clé API activée ! 🎉</p>
        </motion.div>
      )}

      {/* Supported Providers */}
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase text-text-dim">Fournisseurs supportés</p>
        <div className="grid grid-cols-2 gap-2">
          {[
            { name: "Google Gemini", format: "AIza...", logo: "🔵" },
            { name: "OpenAI", format: "sk-...", logo: "⚫" },
            { name: "Anthropic Claude", format: "sk-ant-...", logo: "🟣" },
            { name: "Cohere", format: "co_...", logo: "🟢" },
            { name: "HuggingFace", format: "hf_...", logo: "🟠" },
            { name: "Autres", format: "20+ caractères", logo: "❓" },
          ].map((provider) => (
            <div
              key={provider.name}
              className="p-2 bg-white/2 border border-white/5 rounded text-[10px] hover:bg-white/5 transition-colors cursor-default"
            >
              <p className="font-bold text-white">
                {provider.logo} {provider.name}
              </p>
              <p className="text-text-dim opacity-70 font-mono">{provider.format}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Info */}
      <div className="p-3 bg-bg-card/50 border border-white/5 rounded text-[10px] text-text-dim space-y-1">
        <p>
          <span className="font-bold text-white">🔒 Sécurité:</span> Votre clé est stockée localement
          dans le navigateur et jamais envoyée à nos serveurs.
        </p>
        <p>
          <span className="font-bold text-white">✨ Intelligence:</span> Le système détecte
          automatiquement le meilleur modèle pour votre clé API.
        </p>
        <p>
          <span className="font-bold text-white">🚀 Prêt à utiliser:</span> Une fois activée, utilisez
          l'IA instantanément sans configuration supplémentaire.
        </p>
      </div>
    </div>
  );
}
