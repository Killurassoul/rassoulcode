import Editor, { OnMount } from "@monaco-editor/react";
import { useIDEStore } from "../store/useIDEStore.ts";
import { X, Code2, Save } from "lucide-react";
import { cn } from "../lib/utils.ts";
import { useRef } from "react";

export default function CodeEditor() {
  const { 
    openFiles, 
    activeFile, 
    setActiveFile, 
    closeFile, 
    fileContents, 
    setFileContent 
  } = useIDEStore();
  const editorRef = useRef<any>(null);

  const handleEditorDidMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;
    
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
    if (!activeFile) return;
    const content = editorRef.current?.getValue();
    try {
      const res = await fetch("/api/file", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path: activeFile, content })
      });
      if (res.ok) {
        console.log("File saved!");
      }
    } catch (error) {
      console.error("Failed to save", error);
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
          <h2 className="text-lg font-medium text-white/80">CodeForge AI</h2>
          <p className="text-xs">Select a file to start building</p>
        </div>
        <div className="flex gap-8 mt-12 text-[11px] font-mono uppercase tracking-widest">
          <div className="flex flex-col items-center gap-2">
            <span className="p-1 px-2 border border-white/10 rounded">⌘ P</span>
            <span>Open File</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <span className="p-1 px-2 border border-white/10 rounded">⌘ L</span>
            <span>Ask AI</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-[#0A0A0B]">
      {/* Tabs */}
      <div className="flex items-center bg-[#111113] border-b border-white/5 overflow-x-auto h-10 no-scrollbar">
        {openFiles.map((path) => (
          <div
            key={path}
            onClick={() => setActiveFile(path)}
            className={cn(
              "flex items-center gap-2 px-3 h-full border-r border-white/5 cursor-pointer text-xs transition-all select-none min-w-[120px] max-w-[200px] group",
              activeFile === path ? "bg-[#0A0A0B] text-white shadow-[0_-1px_0_inset_#4F46E5]" : "text-text-dim hover:bg-white/5"
            )}
          >
            <Code2 size={14} className={cn(activeFile === path ? "text-indigo-400" : "text-zinc-500")} />
            <span className="truncate flex-1">{path.split("/").pop()}</span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                closeFile(path);
              }}
              className="p-0.5 hover:bg-white/10 rounded opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <X size={12} />
            </button>
          </div>
        ))}
      </div>

      <div className="flex-1 relative">
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
          }}
        />

        <button 
          onClick={handleSave}
          className="absolute bottom-6 right-6 p-3 bg-brand hover:bg-brand-hover text-white rounded-xl shadow-xl shadow-brand/20 transition-all flex items-center gap-2 text-sm z-10"
        >
          <Save size={16} />
          <span>Save Changes</span>
        </button>
      </div>
    </div>
  );
}
