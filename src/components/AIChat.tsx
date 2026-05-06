import React, { useState, useRef, useEffect } from "react";
import { useIDEStore, ChatMessage } from "../store/useIDEStore.ts";
import { Send, Bot, User, Sparkles, Loader2, Play, Code, CheckCircle, AlertCircle, X } from "lucide-react";
import { askAI } from "../lib/gemini.ts";
import { cn } from "../lib/utils.ts";
import { motion } from "motion/react";

export default function AIChat() {
  const { 
    chatHistory, 
    addMessage, 
    updateMessageAction,
    isAgentThinking, 
    setAgentThinking, 
    activeFile, 
    fileContents, 
    executeCommand,
    executionMode,
    setExecutionMode,
    refreshFileTree 
  } = useIDEStore();
  
  const [input, setInput] = useState("");
  const [confirmAction, setConfirmAction] = useState<{ msgIndex: number; actionIndex: number } | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chatHistory, isAgentThinking]);

  const parseActions = (text: string): { cleanText: string; actions: any[] } => {
    // Improved regex to handle multiple blocks and be more lenient with whitespace
    const jsonRegex = /```json\s*([\s\S]*?)\s*```/g;
    let cleanText = text;
    const actions: any[] = [];
    
    // Find all matches
    const matches = Array.from(text.matchAll(jsonRegex));
    
    for (const match of matches) {
      try {
        const data = JSON.parse(match[1]);
        if (data.actions && Array.isArray(data.actions)) {
          actions.push(...data.actions.map((a: any) => ({
            ...a,
            status: "pending",
            payload: { ...a } // Store original payload
          })));
        }
        // Remove the JSON block from the text shown to users
        cleanText = cleanText.replace(match[0], "").trim();
      } catch (e) {
        console.error("Failed to parse AI action block", e);
      }
    }
    
    return { cleanText, actions };
  };

  const handleRunAction = async (msgIndex: number, actionIndex: number, force: boolean = false) => {
    const message = chatHistory[msgIndex];
    if (!message || !message.actions) return;
    
    const action = message.actions[actionIndex];

    // Trigger confirmation for critical actions if not in autonomous mode and not forced
    if ((action.type === "create_file" || action.type === "edit_file") && !force && executionMode !== "autonomous") {
      setConfirmAction({ msgIndex, actionIndex });
      return;
    }

    updateMessageAction(msgIndex, actionIndex, { status: "executing" });

    try {
      if (action.type === "run_command" || action.type === "install_package") {
        const command = action.type === "install_package" 
          ? `npm install ${action.payload.package}` 
          : action.payload.command;
        
        // Broadcast to terminal visual
        useIDEStore.getState().broadcastTerminalCommand(command);
        
        const result = await executeCommand(command);
        
        if (result.error && !result.output) {
           updateMessageAction(msgIndex, actionIndex, { status: "failed" });
        } else {
           updateMessageAction(msgIndex, actionIndex, { status: "completed" });
        }
        
        // Show output as a system message with clear formatting
        const output = result.output?.trim();
        const error = result.error?.trim();
        
        let systemContent = `> ${command}\n\n`;
        if (output) systemContent += `${output}\n`;
        if (error) systemContent += `\nError: ${error}\n`;
        systemContent += `\n${result.error && !result.output ? "❌ L'exécution a échoué" : "✅ L'exécution est terminée"}`;

        addMessage({
          role: "system",
          content: systemContent,
          timestamp: new Date().toISOString()
        });
      } else if (action.type === "create_file" || action.type === "edit_file") {
        const res = await fetch("/api/file", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ path: action.payload.path, content: action.payload.content })
        });
        if (res.ok) {
          updateMessageAction(msgIndex, actionIndex, { status: "completed" });
          refreshFileTree();
        } else {
          updateMessageAction(msgIndex, actionIndex, { status: "failed" });
        }
      }
    } catch (error) {
      console.error("Action execution failed", error);
      updateMessageAction(msgIndex, actionIndex, { status: "failed" });
    }
  };

  const handleRejectAction = (msgIndex: number, actionIndex: number) => {
    updateMessageAction(msgIndex, actionIndex, { status: "rejected" });
    setConfirmAction(null);
  };

  const [lastError, setLastError] = useState<{ code: string; message: string } | null>(null);

  const handleSend = async (customInput?: string) => {
    const textToSend = customInput || input;
    if (!textToSend.trim() || isAgentThinking) return;

    setLastError(null);
    const userMsg: ChatMessage = {
      role: "user",
      content: textToSend,
      timestamp: new Date().toISOString(),
    };

    addMessage(userMsg);
    if (!customInput) setInput("");
    setAgentThinking(true);

    try {
      // Prepare context
      let context = `Active File: ${activeFile || "None"}\n`;
      if (activeFile && fileContents[activeFile]) {
        context += `Content of ${activeFile}:\n\`\`\`\n${fileContents[activeFile]}\n\`\`\``;
      }

      const aiRawResponse = await askAI(textToSend, context);
      const { cleanText, actions } = parseActions(aiRawResponse);

      const assistantMsg: ChatMessage = {
        role: "assistant",
        content: cleanText,
        timestamp: new Date().toISOString(),
        actions: actions.length > 0 ? actions : undefined
      };

      addMessage(assistantMsg);
    } catch (error: any) {
      console.error("AI chat error handled:", error);
      setLastError({
        code: error.code || "UNKNOWN",
        message: error.message || "Impossible de communiquer avec l'IA."
      });
    } finally {
      setAgentThinking(false);
    }
  };

  const renderError = () => {
    if (!lastError) return null;

    const suggestions = {
      "QUOTA_EXCEEDED": [
        { label: "Utiliser un modèle plus léger", action: () => { useIDEStore.getState().setAiModel("gemini-1.5-flash"); handleSend(); } },
        { label: "Réessayer dans 1 minute", action: () => handleSend() }
      ],
      "INVALID_API_KEY": [
        { label: "Vérifier la configuration API", action: () => useIDEStore.getState().setActiveSidebarTab("settings") }
      ],
      "SAFETY_BLOCK": [
        { label: "Reformuler la demande", action: () => setInput("Peux-tu m'aider à écrire cela de manière plus standard ?") }
      ],
      "NETWORK_ERROR": [
        { label: "Vérifier la connexion", action: () => handleSend() }
      ]
    }[lastError.code as keyof typeof suggestions] || [
      { label: "Réessayer", action: () => handleSend() }
    ];

    return (
      <div className="mx-4 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl animate-in fade-in slide-in-from-bottom-2 duration-300">
        <div className="flex items-start gap-3 mb-3">
          <div className="p-2 bg-red-500/20 rounded-lg text-red-500">
            <AlertCircle size={16} />
          </div>
          <div>
            <h3 className="text-xs font-bold text-red-400 uppercase tracking-wider mb-1">Erreur de l'IA ({lastError.code})</h3>
            <p className="text-xs text-red-200/70 leading-relaxed font-medium">
              {lastError.message}
            </p>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-2">
          {suggestions.map((s, i) => (
            <button 
              key={i} 
              onClick={() => { setLastError(null); s.action(); }}
              className="text-[10px] bg-red-500/20 hover:bg-red-500/30 text-red-200 px-3 py-1.5 rounded-lg border border-red-500/20 transition-all font-bold uppercase tracking-tight"
            >
              {s.label}
            </button>
          ))}
          <button 
            onClick={() => setLastError(null)}
            className="text-[10px] bg-white/5 hover:bg-white/10 text-zinc-400 px-3 py-1.5 rounded-lg transition-all font-bold uppercase tracking-tight"
          >
            Ignorer
          </button>
        </div>
      </div>
    );
  };

  // Auto-execute in Autonomous mode
  useEffect(() => {
    if (executionMode === "autonomous" && chatHistory.length > 0) {
      const lastMsgIndex = chatHistory.length - 1;
      const lastMsg = chatHistory[lastMsgIndex];
      
      if (lastMsg.role === "assistant" && lastMsg.actions) {
        lastMsg.actions.forEach((action, actionIndex) => {
          if (action.status === "pending") {
            handleRunAction(lastMsgIndex, actionIndex);
          }
        });
      }
    }
  }, [chatHistory, executionMode]);

  const [isDraggingOver, setIsDraggingOver] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(false);
    
    const filePath = e.dataTransfer.getData("application/x-file-path") || e.dataTransfer.getData("text/plain");
    if (filePath) {
      const insertion = `\n[File: ${filePath}]\n`;
      setInput(prev => prev + insertion);
    }
  };

  return (
    <div className="flex flex-1 flex-col h-full overflow-hidden bg-bg-panel/50">
      <div className="p-6 border-b border-white/5">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-serif-italic text-white select-none">
            {executionMode === "autonomous" ? "Autonome" : "Mode Sécurisé"}
          </h1>
          <div 
            onClick={() => setExecutionMode(executionMode === "autonomous" ? "safe" : "autonomous")}
            className={cn(
              "w-10 h-5 rounded-full flex items-center px-1 transition-all cursor-pointer",
              executionMode === "autonomous" ? "bg-brand justify-end" : "bg-white/10 justify-start"
            )}
          >
            <motion.div 
              layout
              className="w-3 h-3 bg-white rounded-full shadow-sm"
            />
          </div>
        </div>
        
        <div className="bg-bg-card rounded-xl p-4 border border-white/5 space-y-4 shadow-sm">
          <div className="flex items-start gap-3">
             <div className="w-8 h-8 rounded-full bg-brand flex items-center justify-center text-[10px] font-mono font-bold text-white shadow-lg shadow-brand/20">CF</div>
             <div className="flex-1">
               <p className="text-xs text-white/80 leading-relaxed italic opacity-80 underline decoration-white/10 underline-offset-4">
                 {executionMode === "autonomous" 
                   ? "L'Agent Forge a le contrôle total de cet espace de travail."
                   : "L'Agent Forge a besoin de votre approbation pour les actions critiques."}
               </p>
             </div>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-6"
      >
        {chatHistory.map((msg, i) => (
          <div key={i} className={cn(
            "flex flex-col gap-2",
            msg.role === "user" ? "items-end" : "items-start"
          )}>
            <div className={cn(
              "flex items-center gap-2 mb-1",
              msg.role === "user" ? "flex-row-reverse" : "flex-row"
            )}>
              <div className={cn(
                "p-1.5 rounded-lg",
                msg.role === "user" ? "bg-white/10" : "bg-brand/20 text-brand"
              )}>
                {msg.role === "user" ? <User size={14} /> : <Bot size={14} />}
              </div>
              <span className="text-[10px] text-text-dim font-medium uppercase tracking-wider">
                {msg.role === "assistant" ? "IA Rassoul" : "Vous"}
              </span>
            </div>

            <div className={cn(
              "max-w-[90%] p-3 rounded-2xl text-sm leading-relaxed",
              msg.role === "user" 
                ? "bg-zinc-800 text-[#E0E0E0] rounded-tr-none" 
                : msg.role === "system"
                ? "bg-bg-sub/50 border border-white/5 text-[10px] font-mono opacity-80 rounded-lg whitespace-pre-wrap"
                : "bg-white/5 border border-white/5 text-zinc-300 rounded-tl-none"
            )}>
              {msg.content}
            </div>

            {msg.actions && msg.actions.length > 0 && (
              <div className="w-full mt-2 space-y-2">
                {msg.actions.map((action, ai) => (
                  <div key={ai} className="glass p-3 rounded-xl flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-brand/10 rounded-lg text-brand">
                        {action.type === "run_command" || action.type === "install_package" ? <Play size={14} /> : <Code size={14} />}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[10px] font-bold uppercase text-text-dim">{action.type.replace("_", " ")}</span>
                        <span className="text-xs text-white truncate max-w-[200px]">
                          {action.payload.path || action.payload.command || action.payload.package}
                        </span>
                      </div>
                    </div>
                    {action.status === "pending" && (
                      confirmAction?.msgIndex === i && confirmAction?.actionIndex === ai ? (
                        <div className="flex items-center gap-2 animate-in fade-in slide-in-from-right-2 duration-200">
                          <button 
                            onClick={() => {
                              setConfirmAction(null);
                              updateMessageAction(i, ai, { status: "approved" });
                              handleRunAction(i, ai, true);
                            }}
                            className="text-[10px] bg-emerald-600 hover:bg-emerald-700 px-3 py-1 rounded-md transition-colors font-bold uppercase tracking-wider shadow-sm text-white"
                          >
                            Approuver
                          </button>
                          <button 
                            onClick={() => handleRejectAction(i, ai)}
                            className="text-[10px] bg-zinc-700 hover:bg-zinc-600 px-3 py-1 rounded-md transition-colors font-bold uppercase tracking-wider shadow-sm text-white"
                          >
                            Rejeter
                          </button>
                        </div>
                      ) : (
                        <button 
                          onClick={() => handleRunAction(i, ai)}
                          className="text-[10px] bg-brand hover:bg-brand-hover px-3 py-1 rounded-md transition-colors font-bold uppercase tracking-wider shadow-sm"
                        >
                          {action.type === "create_file" ? "Créer" : 
                           action.type === "edit_file" ? "Appliquer" : "Autoriser"}
                        </button>
                      )
                    )}
                    {action.status === "executing" && <Loader2 size={14} className="animate-spin text-brand" />}
                    {action.status === "completed" && <CheckCircle size={14} className="text-emerald-500" />}
                    {action.status === "rejected" && <X size={14} className="text-zinc-500" />}
                    {action.status === "failed" && <AlertCircle size={14} className="text-red-500" />}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}

        {isAgentThinking && (
          <div className="flex flex-col gap-2 animate-pulse">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-brand/20 text-brand">
                <Loader2 size={14} className="animate-spin" />
              </div>
              <span className="text-[10px] text-text-dim font-medium uppercase tracking-wider italic">
                Réflexion...
              </span>
            </div>
            <div className="bg-white/5 border border-white/5 h-20 w-3/4 rounded-2xl rounded-tl-none" />
          </div>
        )}

        {!isAgentThinking && chatHistory.length <= 1 && (
          <div className="grid grid-cols-2 gap-2 mt-4 px-2">
            {[
              { label: "Améliorer le style UI", prompt: "Aide-moi à améliorer le style visuel de cette application avec des composants plus modernes." },
              { label: "Ajouter un bouton d'export", prompt: "Ajoute une fonctionnalité pour exporter les fichiers en format ZIP." },
              { label: "Optimiser le code", prompt: "Analyse le code source et suggère des optimisations de performance." },
              { label: "Correction de bugs", prompt: "Y a-t-il des erreurs potentielles ou des bugs dans mes fichiers ? Vérifie la console." }
            ].map((suggestion, idx) => (
              <button
                key={idx}
                onClick={() => setInput(suggestion.prompt)}
                className="p-3 text-left bg-white/2 hover:bg-white/5 border border-white/5 rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98] group"
              >
                <Sparkles size={14} className="text-brand mb-2 opacity-50 group-hover:opacity-100 transition-opacity" />
                <span className="text-[11px] text-text-dim group-hover:text-white leading-tight block">
                  {suggestion.label}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {renderError()}

      {/* Input */}
      <div className="p-4 border-t border-border">
        <div className={cn(
          "relative group transition-all duration-200",
          isDraggingOver && "scale-[1.02]"
        )}>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder={isDraggingOver ? "Déposez le fichier ici..." : "Comment puis-je vous aider avec votre code aujourd'hui ?"}
            className={cn(
              "w-full bg-[#0A0A0B] border border-border focus:border-brand rounded-2xl p-4 pr-12 text-sm resize-none h-[100px] outline-none transition-all placeholder:text-zinc-600 shadow-inner group-focus-within:ring-1 ring-brand/30",
              isDraggingOver && "border-brand bg-brand/5 ring-4 ring-brand/20"
            )}
          />
          <button 
            onClick={handleSend}
            disabled={!input.trim() || isAgentThinking || isDraggingOver}
            className="absolute bottom-4 right-4 p-2 bg-brand hover:bg-brand-hover text-white rounded-xl transition-all disabled:opacity-50 disabled:hover:bg-brand shadow-lg shadow-brand/20"
          >
            <Send size={16} />
          </button>
          
          <div className="absolute top-4 right-4">
             <Sparkles size={14} className={cn(
               "transition-colors",
               isDraggingOver ? "text-brand animate-pulse" : "text-indigo-400 opacity-30"
             )} />
          </div>
          
          {isDraggingOver && (
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              <div className="bg-brand text-white px-4 py-2 rounded-full text-xs font-bold shadow-2xl animate-bounce">
                Relâchez pour insérer le chemin du fichier
              </div>
            </div>
          )}
        </div>
        <div className="mt-2 flex items-center justify-between px-2">
           <div className="flex gap-2">
             <span className="text-[10px] text-text-dim hover:text-white cursor-pointer transition-colors">Mode Sécurisé</span>
             <span className="text-[10px] text-text-dim/30">|</span>
             <span className="text-[10px] text-text-dim hover:text-white cursor-pointer transition-colors">Gemini 3.1 Pro</span>
           </div>
           <span className="text-[10px] text-text-dim opacity-50">Entrée pour envoyer</span>
        </div>
      </div>
    </div>
  );
}
