import React, { useState, useRef, useEffect } from "react";
import { useIDEStore, ChatMessage } from "../store/useIDEStore";
import { Send, Bot, User, Sparkles, Loader2, Play, Code, CheckCircle, AlertCircle, X, Trash2, FileText } from "lucide-react";
import { chatWithAI } from "../lib/ai-providers";
import { cn } from "../lib/utils";
import { motion } from "motion/react";

export default function AIChat() {
  const {
    chatHistory,
    addMessage,
    clearChat,
    updateMessageAction,
    isAgentThinking,
    setAgentThinking,
    activeFile,
    fileContents,
    executeCommand,
    executionMode,
    setExecutionMode,
    refreshFileTree,
    aiProvider,
    aiModel,
    apiKeys,
    temperature,
    maxTokens,
    workspaceRoot,
    addHistoryEntry,
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
    const jsonRegex = /```json\s*([\s\S]*?)\s*```/g;
    let cleanText = text;
    const actions: any[] = [];

    const matches = Array.from(text.matchAll(jsonRegex));

    for (const match of matches) {
      try {
        const data = JSON.parse(match[1]);
        if (data.actions && Array.isArray(data.actions)) {
          actions.push(
            ...data.actions.map((a: any) => ({
              ...a,
              status: "pending",
              payload: { ...a },
            }))
          );
        }
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

    if ((action.type === "create_file" || action.type === "edit_file") && !force && executionMode !== "autonomous") {
      setConfirmAction({ msgIndex, actionIndex });
      return;
    }

    updateMessageAction(msgIndex, actionIndex, { status: "executing" });

    try {
      if (action.type === "run_command" || action.type === "install_package") {
        const command = action.type === "install_package" ? `npm install ${action.payload.package}` : action.payload.command;

        useIDEStore.getState().broadcastTerminalCommand(command);
        const result = await executeCommand(command);

        if (result.error && !result.output) {
          updateMessageAction(msgIndex, actionIndex, { status: "failed" });
        } else {
          updateMessageAction(msgIndex, actionIndex, { status: "completed" });
        }

        let systemContent = `> ${command}\n\n`;
        if (result.output?.trim()) systemContent += `${result.output.trim()}\n`;
        if (result.error?.trim()) systemContent += `\nError: ${result.error.trim()}\n`;
        systemContent += `\n${result.error && !result.output ? "Failed" : "Completed"}`;

        addMessage({ role: "system", content: systemContent, timestamp: new Date().toISOString() });
        addHistoryEntry({ type: "command", description: `Executed: ${command}`, details: result.output || result.error });
      } else if (action.type === "create_file" || action.type === "edit_file") {
        const { workspaceRoot } = useIDEStore.getState();
        let result;
        if (window.electronAPI) {
          result = await window.electronAPI.writeFile(workspaceRoot, action.payload.path, action.payload.content);
        } else {
          const res = await fetch("/api/file", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ path: action.payload.path, content: action.payload.content }),
          });
          result = await res.json();
        }
        if (result.success || result.error === undefined) {
          updateMessageAction(msgIndex, actionIndex, { status: "completed" });
          refreshFileTree();
          addHistoryEntry({ type: action.type === "create_file" ? "file_create" : "file_edit", description: `${action.type === "create_file" ? "Created" : "Edited"}: ${action.payload.path}` });
        } else {
          updateMessageAction(msgIndex, actionIndex, { status: "failed" });
        }
      } else if (action.type === "delete_file") {
        const { workspaceRoot } = useIDEStore.getState();
        if (window.electronAPI) {
          await window.electronAPI.deleteFile(workspaceRoot, action.payload.path);
        } else {
          await fetch(`/api/file?path=${encodeURIComponent(action.payload.path)}`, { method: "DELETE" });
        }
        updateMessageAction(msgIndex, actionIndex, { status: "completed" });
        refreshFileTree();
        addHistoryEntry({ type: "file_delete", description: `Deleted: ${action.payload.path}` });
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
      let context = `Active File: ${activeFile || "None"}\n`;
      if (activeFile && fileContents[activeFile]) {
        context += `Content of ${activeFile}:\n\`\`\`\n${fileContents[activeFile].substring(0, 8000)}\n\`\`\``;
      }

      const apiKey = apiKeys[aiProvider] || "";
      const aiRawResponse = await chatWithAI(aiProvider, aiModel, apiKey, textToSend, context, [], temperature, maxTokens);

      const { cleanText, actions } = parseActions(aiRawResponse);

      const assistantMsg: ChatMessage = {
        role: "assistant",
        content: cleanText,
        timestamp: new Date().toISOString(),
        actions: actions.length > 0 ? actions : undefined,
      };

      addMessage(assistantMsg);
    } catch (error: any) {
      console.error("AI chat error handled:", error);
      setLastError({
        code: error.code || "UNKNOWN",
        message: error.message || "Unable to communicate with AI.",
      });
    } finally {
      setAgentThinking(false);
    }
  };

  const renderError = () => {
    if (!lastError) return null;

    const suggestions: Record<string, { label: string; action: () => void }[]> = {
      QUOTA_EXCEEDED: [
        { label: "Retry in a moment", action: () => handleSend() },
      ],
      INVALID_API_KEY: [
        { label: "Open Settings", action: () => useIDEStore.getState().setActiveSidebarTab("settings") },
      ],
      SAFETY_BLOCK: [
        { label: "Rephrase request", action: () => setInput("Can you help me write this in a different way?") },
      ],
      NETWORK_ERROR: [
        { label: "Check connection", action: () => handleSend() },
      ],
    };

    const errorSuggestions = suggestions[lastError.code] || [{ label: "Retry", action: () => handleSend() }];

    return (
      <div className="mx-4 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl">
        <div className="flex items-start gap-3 mb-3">
          <div className="p-2 bg-red-500/20 rounded-lg text-red-500">
            <AlertCircle size={16} />
          </div>
          <div>
            <h3 className="text-xs font-bold text-red-400 uppercase tracking-wider mb-1">AI Error ({lastError.code})</h3>
            <p className="text-xs text-red-200/70 leading-relaxed font-medium">{lastError.message}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {errorSuggestions.map((s, i) => (
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
            Dismiss
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

  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); setIsDraggingOver(true); };
  const handleDragLeave = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); setIsDraggingOver(false); };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation(); setIsDraggingOver(false);
    const filePath = e.dataTransfer.getData("application/x-file-path") || e.dataTransfer.getData("text/plain");
    if (filePath) setInput(prev => prev + `\n[File: ${filePath}]\n`);
  };

  const suggestedPrompts = [
    "Analyze this codebase and suggest improvements",
    "Create a README.md for this project",
    "Fix any bugs in the current file",
    "Add error handling to the current file",
    "Write unit tests for the current file",
  ];

  return (
    <div className="flex flex-1 flex-col h-full overflow-hidden bg-bg-panel/50">
      {/* Mode Toggle & Header */}
      <div className="p-4 border-b border-white/5">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-lg font-semibold text-white select-none">
            {executionMode === "autonomous" ? "Autonomous Mode" : "Safe Mode"}
          </h1>
          <div className="flex items-center gap-3">
            <button
              onClick={clearChat}
              className="p-1.5 hover:bg-white/5 rounded text-zinc-500 hover:text-white transition-colors"
              title="Clear chat"
            >
              <Trash2 size={14} />
            </button>
            <div
              onClick={() => setExecutionMode(executionMode === "autonomous" ? "safe" : "autonomous")}
              className={cn(
                "w-10 h-5 rounded-full flex items-center px-1 transition-all cursor-pointer",
                executionMode === "autonomous" ? "bg-brand justify-end" : "bg-white/10 justify-start"
              )}
            >
              <motion.div layout className="w-3 h-3 bg-white rounded-full shadow-sm" />
            </div>
          </div>
        </div>

        <div className="bg-bg-card rounded-xl p-3 border border-white/5">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-brand to-indigo-600 flex items-center justify-center text-[9px] font-bold text-white">CF</div>
            <div className="flex-1">
              <p className="text-[10px] text-zinc-400">
                {aiProvider} / {aiModel.split("/").pop()}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Chat Messages */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-4"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {isDraggingOver && (
          <div className="absolute inset-0 z-40 bg-brand/5 border-2 border-dashed border-brand/30 rounded-xl flex items-center justify-center">
            <div className="flex items-center gap-2 text-brand">
              <FileText size={20} />
              <span className="text-sm font-medium">Drop file to attach</span>
            </div>
          </div>
        )}

        {chatHistory.map((msg, msgIndex) => (
          <motion.div
            key={msgIndex}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn("flex gap-3", msg.role === "user" ? "flex-row-reverse" : "")}
          >
            {msg.role !== "system" && (
              <div className={cn(
                "w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-xs font-bold",
                msg.role === "assistant" ? "bg-gradient-to-br from-brand to-indigo-600 text-white" : "bg-zinc-700 text-zinc-300"
              )}>
                {msg.role === "assistant" ? <Bot size={14} /> : <User size={14} />}
              </div>
            )}

            <div className={cn(
              "flex-1 max-w-[85%]",
              msg.role === "user" ? "text-right" : "",
              msg.role === "system" ? "ml-10" : ""
            )}>
              <div className={cn(
                "inline-block text-xs leading-relaxed rounded-2xl px-4 py-3",
                msg.role === "user" ? "bg-brand text-white rounded-tr-sm" :
                msg.role === "system" ? "bg-zinc-800/50 text-zinc-400 font-mono text-[10px] border border-white/5" :
                "bg-bg-card text-zinc-200 rounded-tl-sm border border-white/5"
              )}>
                <pre className="whitespace-pre-wrap font-sans">{msg.content}</pre>
              </div>

              {/* Actions */}
              {msg.actions && msg.actions.length > 0 && (
                <div className="mt-2 space-y-1.5">
                  {msg.actions.map((action, actionIndex) => (
                    <div key={actionIndex} className="flex items-center gap-2 bg-bg-card/50 border border-white/5 rounded-lg px-3 py-2">
                      <div className={cn(
                        "w-5 h-5 rounded flex items-center justify-center text-[10px]",
                        action.status === "completed" ? "bg-emerald-500/20 text-emerald-400" :
                        action.status === "failed" ? "bg-red-500/20 text-red-400" :
                        action.status === "executing" ? "bg-brand/20 text-brand" :
                        action.status === "rejected" ? "bg-zinc-500/20 text-zinc-500" :
                        "bg-amber-500/20 text-amber-400"
                      )}>
                        {action.status === "executing" ? <Loader2 size={12} className="animate-spin" /> :
                         action.status === "completed" ? <CheckCircle size={12} /> :
                         action.status === "failed" ? <AlertCircle size={12} /> :
                         <Code size={12} />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-[10px] font-mono text-zinc-400 truncate block">
                          {action.type}: {action.payload?.path || action.payload?.command || action.payload?.package || ""}
                        </span>
                      </div>
                      {action.status === "pending" && (
                        <div className="flex gap-1">
                          <button
                            onClick={() => handleRunAction(msgIndex, actionIndex, executionMode === "autonomous")}
                            className="p-1 bg-brand/20 hover:bg-brand/30 rounded text-brand transition-colors"
                          >
                            <Play size={10} />
                          </button>
                          <button
                            onClick={() => handleRejectAction(msgIndex, actionIndex)}
                            className="p-1 bg-red-500/20 hover:bg-red-500/30 rounded text-red-400 transition-colors"
                          >
                            <X size={10} />
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              <div className="text-[9px] text-zinc-700 mt-1">
                {new Date(msg.timestamp).toLocaleTimeString()}
              </div>
            </div>
          </motion.div>
        ))}

        {isAgentThinking && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-3">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-brand to-indigo-600 flex items-center justify-center">
              <Loader2 size={14} className="text-white animate-spin" />
            </div>
            <div className="bg-bg-card border border-white/5 rounded-2xl rounded-tl-sm px-4 py-3">
              <div className="flex items-center gap-2">
                <div className="flex gap-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-brand animate-bounce" style={{ animationDelay: "0ms" }} />
                  <div className="w-1.5 h-1.5 rounded-full bg-brand animate-bounce" style={{ animationDelay: "150ms" }} />
                  <div className="w-1.5 h-1.5 rounded-full bg-brand animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
                <span className="text-[10px] text-zinc-500">Thinking...</span>
              </div>
            </div>
          </motion.div>
        )}

        {renderError()}

        {/* Suggested Prompts (only show at start) */}
        {chatHistory.length <= 1 && !isAgentThinking && (
          <div className="space-y-2 mt-4">
            <p className="text-[10px] text-zinc-600 uppercase tracking-wider font-bold">Suggestions</p>
            {suggestedPrompts.map((prompt, i) => (
              <button
                key={i}
                onClick={() => handleSend(prompt)}
                className="w-full text-left px-3 py-2 bg-bg-card/50 border border-white/5 rounded-lg text-xs text-zinc-400 hover:text-white hover:bg-white/5 hover:border-brand/20 transition-all"
              >
                {prompt}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Confirmation Dialog */}
      {confirmAction && (
        <div className="p-4 bg-amber-500/5 border-t border-amber-500/20">
          <div className="flex items-center justify-between">
            <span className="text-xs text-amber-300">Confirm this action?</span>
            <div className="flex gap-2">
              <button
                onClick={() => { handleRunAction(confirmAction.msgIndex, confirmAction.actionIndex, true); setConfirmAction(null); }}
                className="px-3 py-1 bg-brand text-white text-[10px] rounded font-bold"
              >
                Approve
              </button>
              <button
                onClick={() => { handleRejectAction(confirmAction.msgIndex, confirmAction.actionIndex); }}
                className="px-3 py-1 bg-red-500/20 text-red-400 text-[10px] rounded font-bold"
              >
                Reject
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Input */}
      <div className="p-4 border-t border-white/5">
        <div className="relative">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Ask CodeForge AI anything..."
            rows={2}
            className="w-full bg-bg-dark border border-white/10 rounded-xl px-4 py-3 pr-12 text-xs text-white outline-none focus:border-brand resize-none transition-all"
          />
          <button
            onClick={() => handleSend()}
            disabled={isAgentThinking || !input.trim()}
            className="absolute right-3 bottom-3 p-2 bg-brand text-white rounded-lg hover:bg-brand-hover disabled:opacity-30 transition-all"
          >
            <Send size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
