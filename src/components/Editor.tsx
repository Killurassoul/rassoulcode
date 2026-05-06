import Editor, { OnMount } from "@monaco-editor/react";
import { useIDEStore } from "../store/useIDEStore";
import { Sparkles, Save, Wand2, Loader2, Code2 } from "lucide-react";
import { cn } from "../lib/utils";
import { useRef, useState, useEffect } from "react";
import { getAIAutocomplete } from "../lib/ai-providers";

export default function CodeEditor() {
  const {
    activeFile,
    fileContents,
    setFileContent,
    refactorCode,
    isAgentThinking,
    fileTree,
    fileSaveStatus,
    setFileSaveStatus,
    saveFile,
    aiProvider,
    aiModel,
    apiKeys,
  } = useIDEStore();

  const getFileTreeContext = (nodes: any[], indent = ""): string => {
    return nodes.map(node => {
      if (node.type === "directory") {
        return `${indent}DIR: ${node.name}\n${getFileTreeContext(node.children || [], indent + "  ")}`;
      }
      return `${indent}FILE: ${node.name}`;
    }).join("\n");
  };

  const projectContext = getFileTreeContext(fileTree).substring(0, 1000);

  const editorRef = useRef<any>(null);
  const monacoRef = useRef<any>(null);
  const isSaving = activeFile ? fileSaveStatus[activeFile] === "saving" : false;

  // Register AI Autocomplete
  useEffect(() => {
    if (!monacoRef.current) return;

    const monaco = monacoRef.current;
    const apiKey = apiKeys[aiProvider] || "";

    if (!apiKey) return;

    let lastRequestTime = 0;
    const provider = monaco.languages.registerInlineCompletionsProvider(
      ["typescript", "javascript", "css", "html", "json", "markdown", "plaintext", "python", "rust", "go"],
      {
        provideInlineCompletions: async (model: any, position: any) => {
          const now = Date.now();
          lastRequestTime = now;

          await new Promise(resolve => setTimeout(resolve, 400));
          if (lastRequestTime !== now) return { items: [] };
          if (!activeFile) return;

          const textUntilPosition = model.getValueInRange({
            startLineNumber: 1, startColumn: 1,
            endLineNumber: position.lineNumber, endColumn: position.column,
          });
          const textAfterPosition = model.getValueInRange({
            startLineNumber: position.lineNumber, startColumn: position.column,
            endLineNumber: model.getLineCount(), endColumn: model.getLineMaxColumn(model.getLineCount()),
          });

          if (textUntilPosition.length < 5) return;

          try {
            const suggestion = await getAIAutocomplete(
              aiProvider, aiModel, apiKey,
              textUntilPosition.slice(-2000),
              textAfterPosition.slice(0, 500),
              activeFile,
              projectContext
            );

            if (!suggestion) return { items: [] };

            return {
              items: [{
                insertText: suggestion,
                range: {
                  startLineNumber: position.lineNumber, startColumn: position.column,
                  endLineNumber: position.lineNumber, endColumn: position.column,
                },
              }],
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
  }, [activeFile, aiProvider, aiModel, apiKeys]);

  const handleEditorDidMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;

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

    // Add save keybinding
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      const file = useIDEStore.getState().activeFile;
      if (file) {
        const content = editor.getValue();
        useIDEStore.getState().setFileContent(file, content);
        useIDEStore.getState().saveFile(file);
      }
    });
  };

  const handleSave = async () => {
    if (!activeFile || isSaving) return;
    const content = editorRef.current?.getValue();
    if (content !== undefined) {
      setFileContent(activeFile, content);
      await saveFile(activeFile);
    }
  };

  const getLanguage = (path: string) => {
    const ext = path.split(".").pop();
    switch (ext) {
      case "ts": case "tsx": return "typescript";
      case "js": case "jsx": return "javascript";
      case "css": return "css";
      case "json": return "json";
      case "html": return "html";
      case "md": return "markdown";
      case "py": return "python";
      case "rs": return "rust";
      case "go": return "go";
      case "java": return "java";
      case "c": case "cpp": case "h": return "cpp";
      case "sh": case "bash": return "shell";
      case "yaml": case "yml": return "yaml";
      case "toml": return "toml";
      case "sql": return "sql";
      case "xml": return "xml";
      case "svg": return "xml";
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
          <h2 className="text-lg font-medium text-white/80">CodeForge AI</h2>
          <p className="text-xs">Select a file to start coding</p>
        </div>
        <div className="flex gap-8 mt-12 text-[11px] font-mono uppercase tracking-widest">
          <div className="flex flex-col items-center gap-2 group/key">
            <span className="p-1 px-2 border border-white/10 rounded group-hover/key:border-brand transition-colors select-none">Ctrl+K</span>
            <span>Open File</span>
          </div>
          <div className="flex flex-col items-center gap-2 group/key">
            <span className="p-1 px-2 border border-white/10 rounded group-hover/key:border-brand transition-colors select-none">Ctrl+L</span>
            <span>Ask AI</span>
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
            AI Refactor
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 px-3 py-1.5 bg-bg-panel/80 backdrop-blur border border-white/10 text-white text-[11px] font-medium rounded-lg hover:bg-white/10 transition-all shadow-xl disabled:opacity-50"
          >
            {isSaving ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
            Save
          </button>
        </div>

        <Editor
          height="100%"
          language={getLanguage(activeFile)}
          value={fileContents[activeFile]}
          onChange={(value) => value !== undefined && setFileContent(activeFile, value)}
          onMount={handleEditorDidMount}
          options={{
            fontSize: 13,
            fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
            fontLigatures: true,
            lineHeight: 22,
            minimap: { enabled: true, scale: 1 },
            scrollbar: { verticalScrollbarSize: 6, horizontalScrollbarSize: 6 },
            smoothScrolling: true,
            cursorBlinking: "smooth",
            cursorSmoothCaretAnimation: "on",
            padding: { top: 16 },
            renderLineHighlight: "all",
            bracketPairColorization: { enabled: true },
            automaticLayout: true,
            wordWrap: "on",
          }}
        />
      </div>
    </div>
  );
}
