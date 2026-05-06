import Editor, { OnMount } from "@monaco-editor/react";
import { useIDEStore } from "../store/useIDEStore.ts";
import { Sparkles, Save, Wand2, Loader2, Code2 } from "lucide-react";
import { cn } from "../lib/utils.ts";
import { useRef, useState, useEffect } from "react";
import { getAutocomplete } from "../lib/gemini.ts";

export default function CodeEditor() {
  const { 
    activeFile, 
    fileContents, 
    setFileContent,
    refactorCode,
    isAgentThinking,
    fileTree,
    fileSaveStatus,
    setFileSaveStatus
  } = useIDEStore();

  // Helper to stringify file tree for tokens
  const getFileTreeContext = (nodes: any[], indent = ""): string => {
    return nodes.map(node => {
      if (node.type === "directory") {
        return `${indent}DIR: ${node.name}\n${getFileTreeContext(node.children || [], indent + "  ")}`;
      }
      return `${indent}FILE: ${node.name}`;
    }).join("\n");
  };

  const projectContext = getFileTreeContext(fileTree).substring(0, 1000); // Limit context size

  const editorRef = useRef<any>(null);
  const monacoRef = useRef<any>(null);
  const isSaving = activeFile ? fileSaveStatus[activeFile] === "saving" : false;

  // Register AI Autocomplete
  useEffect(() => {
    if (!monacoRef.current) return;

    const monaco = monacoRef.current;
    
    // Inline completions are the "Ghost Text" style (like Copilot)
    let lastRequestTime = 0;
    const provider = monaco.languages.registerInlineCompletionsProvider(
      ["typescript", "javascript", "css", "html", "json", "markdown", "plaintext"],
      {
        provideInlineCompletions: async (model: any, position: any) => {
          const now = Date.now();
          lastRequestTime = now;
          
          // Debounce: wait 400ms after last stroke
          await new Promise(resolve => setTimeout(resolve, 400));
          if (lastRequestTime !== now) return { items: [] };

          // Only trigger if we have an active file and enough content
          if (!activeFile) return;

          const textUntilPosition = model.getValueInRange({
            startLineNumber: 1,
            startColumn: 1,
            endLineNumber: position.lineNumber,
            endColumn: position.column,
          });

          const textAfterPosition = model.getValueInRange({
            startLineNumber: position.lineNumber,
            startColumn: position.column,
            endLineNumber: model.getLineCount(),
            endColumn: model.getLineMaxColumn(model.getLineCount()),
          });

          // Debounce / Minimal context check
          if (textUntilPosition.length < 5) return;

          try {
            const suggestion = await getAutocomplete(
              textUntilPosition.slice(-2000), // Last 2000 chars
              textAfterPosition.slice(0, 500),  // Next 500 chars
              activeFile,
              projectContext
            );

            if (!suggestion) return { items: [] };

            return {
              items: [
                {
                  insertText: suggestion,
                  range: {
                    startLineNumber: position.lineNumber,
                    startColumn: position.column,
                    endLineNumber: position.lineNumber,
                    endColumn: position.column,
                  },
                },
              ],
            };
          } catch (e) {
            console.error("AI Completion provider error:", e);
            return { items: [] };
          }
        },
        freeInlineCompletions: () => {},
      }
    );

    return () => provider.dispose();
  }, [activeFile]);

  const handleEditorDidMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;
    
    // Customize Theme
    monaco.editor.defineTheme("codeforge-dark", {
      base: "vs-dark",
      inherit: true,
      rules: [],
      colors: {
        "editor.background": "#0A0A0B",
        "editor.lineHighlightBackground": "#171719",
        "editorCursor.foreground": "#4F46E5",
        "editorLineNumber.foreground": "#3F3F46",
        "editorLineNumber.activeForeground": "#A1A1AA",
      },
    });
    monaco.editor.setTheme("codeforge-dark");
  };

  const handleSave = async () => {
    if (!activeFile || isSaving) return;
    const content = editorRef.current?.getValue();
    setFileSaveStatus(activeFile, "saving");
    try {
      const res = await fetch("/api/file", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path: activeFile, content })
      });
      if (res.ok) {
        setFileSaveStatus(activeFile, "saved");
      } else {
        setFileSaveStatus(activeFile, "unsaved");
      }
    } catch (error) {
      console.error("Failed to save", error);
      setFileSaveStatus(activeFile, "unsaved");
    }
  };

  const getLanguage = (path: string) => {
    const ext = path.split(".").pop();
    switch (ext) {
      case "ts":
      case "tsx": return "typescript";
      case "js":
      case "jsx": return "javascript";
      case "css": return "css";
      case "json": return "json";
      case "html": return "html";
      case "md": return "markdown";
      default: return "plaintext";
    }
  };

  if (!activeFile || !fileContents[activeFile]) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-text-dim gap-4 opacity-50 select-none">
        <div className="w-24 h-24 rounded-3xl bg-white/5 flex items-center justify-center">
          <Code2 size={48} className="text-white/10" />
        </div>
        <div className="flex flex-col items-center gap-1">
          <h2 className="text-lg font-medium text-white/80">rassoul code</h2>
          <p className="text-xs">Sélectionnez un fichier pour commencer à coder</p>
        </div>
        <div className="flex gap-8 mt-12 text-[11px] font-mono uppercase tracking-widest">
          <div className="flex flex-col items-center gap-2 group/key">
            <span className="p-1 px-2 border border-white/10 rounded group-hover/key:border-brand transition-colors select-none">⌘ K</span>
            <span>Ouvrir Fichier</span>
          </div>
          <div className="flex flex-col items-center gap-2 group/key">
            <span className="p-1 px-2 border border-white/10 rounded group-hover/key:border-brand transition-colors select-none">⌘ L</span>
            <span>Demander à l'IA</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-[#0A0A0B] relative group">
      <div className="flex-1 relative">
        {/* Floating AI Actions */}
        <div className="absolute top-4 right-8 z-20 flex items-center gap-2 pointer-events-none group-hover:pointer-events-auto opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
          <button 
            onClick={refactorCode}
            disabled={isAgentThinking}
            className="flex items-center gap-2 px-3 py-1.5 bg-bg-panel/80 backdrop-blur border border-brand/30 text-brand text-[11px] font-bold rounded-lg hover:bg-brand hover:text-white transition-all shadow-xl shadow-brand/10 disabled:opacity-50"
          >
            {isAgentThinking ? <Loader2 size={12} className="animate-spin" /> : <Wand2 size={12} />}
            <span>Optimiser</span>
          </button>
          <button 
            className="flex items-center gap-2 px-3 py-1.5 bg-bg-panel/80 backdrop-blur border border-white/10 text-white text-[11px] font-bold rounded-lg hover:bg-white/10 transition-all shadow-xl"
          >
            <Sparkles size={12} className="text-yellow-400" />
            <span>Expliquer</span>
          </button>
        </div>

        <Editor
          height="100%"
          language={getLanguage(activeFile)}
          value={fileContents[activeFile]}
          onMount={handleEditorDidMount}
          onChange={(val) => setFileContent(activeFile, val || "")}
          options={{
            fontSize: 13,
            lineNumbers: "on",
            minimap: { enabled: true, scale: 0.75, renderCharacters: false },
            padding: { top: 16 },
            scrollBeyondLastLine: false,
            smoothScrolling: true,
            cursorBlinking: "expand",
            cursorSmoothCaretAnimation: "on",
            automaticLayout: true,
            fontFamily: "JetBrains Mono",
            bracketPairColorization: { enabled: true },
            inlineSuggest: { enabled: true, showToolbar: "always" },
            suggest: { showWords: false }, // Reduce noise to favor AI
          }}
        />

        <button 
          onClick={handleSave}
          disabled={isSaving}
          className="absolute bottom-6 right-6 p-4 bg-brand hover:bg-brand-hover text-white rounded-2xl shadow-2xl shadow-brand/40 transition-all hover:scale-105 active:scale-95 flex items-center gap-2 text-sm z-10 group/btn font-bold"
        >
          {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} className="group-hover/btn:rotate-12 transition-transform" />}
          <span className="tracking-tight">Enregistrer</span>
        </button>
      </div>
    </div>
  );
}
