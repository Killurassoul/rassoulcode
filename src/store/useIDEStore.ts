import { create } from "zustand";
import { GoogleGenAI } from "@google/genai";

export interface FileNode {
  name: string;
  path: string;
  type: "file" | "directory";
  children?: FileNode[];
}

export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: string;
  actions?: AIAction[];
}

export interface AIAction {
  type: "create_file" | "edit_file" | "delete_file" | "run_command" | "install_package";
  payload: any;
  status: "pending" | "approved" | "rejected" | "executing" | "completed" | "failed";
}

export type SidebarTab = "explorer" | "search" | "ai" | "git" | "settings" | "history";

interface IDEState {
  // Navigation
  activeSidebarTab: SidebarTab;
  setActiveSidebarTab: (tab: SidebarTab) => void;
  
  // Workspace
  workspaceRoot: string;
  fileTree: FileNode[];
  setFileTree: (tree: FileNode[]) => void;
  refreshFileTree: () => Promise<void>;
  
  // Files / Editor
  openFiles: string[]; // Paths
  activeFile: string | null;
  openFile: (path: string) => void;
  closeFile: (path: string) => void;
  setActiveFile: (path: string) => void;
  fileContents: Record<string, string>;
  setFileContent: (path: string, content: string) => void;
  
  // AI Chat
  chatHistory: ChatMessage[];
  addMessage: (msg: ChatMessage) => void;
  updateMessageAction: (messageIndex: number, actionIndex: number, updates: Partial<AIAction>) => void;
  isAgentThinking: boolean;
  setAgentThinking: (thinking: boolean) => void;
  
  // Search
  searchResults: any[];
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  performSearch: (query: string) => Promise<void>;

  // Execution
  executeCommand: (command: string) => Promise<{ output: string; error: string }>;
  terminalCommands: string[];
  broadcastTerminalCommand: (command: string) => void;

  // Settings
  aiProvider: string;
  setAiProvider: (provider: string) => void;
  aiModel: string;
  setAiModel: (model: string) => void;
  executionMode: "safe" | "autonomous";
  setExecutionMode: (mode: "safe" | "autonomous") => void;
  
  // Git
  stagedChanges: string[];
  unstagedChanges: string[];
  gitCommits: { message: string, hash: string, date: string }[];
  stageFile: (path: string) => void;
  unstageFile: (path: string) => void;
  commitChanges: (message: string) => Promise<void>;
  pushChanges: () => Promise<void>;
  pullChanges: () => Promise<void>;
  generateCommitMessage: () => Promise<string>;
  
  // File operations
  deleteFile: (path: string) => Promise<void>;
  createFile: (path: string, content?: string) => Promise<void>;
}

export const useIDEStore = create<IDEState>((set, get) => ({
  activeSidebarTab: "explorer",
  setActiveSidebarTab: (tab) => set({ activeSidebarTab: tab }),
  
  workspaceRoot: "",
  fileTree: [],
  setFileTree: (fileTree) => set({ fileTree }),
  refreshFileTree: async () => {
    try {
      const res = await fetch("/api/files");
      const data = await res.json();
      set({ fileTree: data });
    } catch (error) {
      console.error("Failed to refresh file tree", error);
    }
  },
  
  openFiles: [],
  activeFile: null,
  fileContents: {},
  
  openFile: async (filePath) => {
    const { openFiles, fileContents } = get();
    if (!openFiles.includes(filePath)) {
      set({ openFiles: [...openFiles, filePath] });
    }
    
    // Fetch content if not loaded
    if (!fileContents[filePath]) {
      try {
        const res = await fetch(`/api/file?path=${encodeURIComponent(filePath)}`);
        const data = await res.json();
        set({
          fileContents: { ...get().fileContents, [filePath]: data.content },
          activeFile: filePath
        });
      } catch (error) {
        console.error("Failed to load file", error);
      }
    } else {
      set({ activeFile: filePath });
    }
  },
  
  closeFile: (filePath) => {
    const { openFiles, activeFile } = get();
    const newFiles = openFiles.filter((f) => f !== filePath);
    let newActive = activeFile;
    if (activeFile === filePath) {
      newActive = newFiles.length > 0 ? newFiles[newFiles.length - 1] : null;
    }
    set({ openFiles: newFiles, activeFile: newActive });
  },
  
  setActiveFile: (filePath) => set({ activeFile: filePath }),
  setFileContent: (path, content) => set({
    fileContents: { ...get().fileContents, [path]: content }
  }),
  
  chatHistory: [
    {
      role: "assistant",
      content: "Bonjour ! Je suis votre agent IA Rassoul. Comment puis-je vous aider à construire aujourd'hui ?",
      timestamp: new Date().toISOString()
    }
  ],
  addMessage: (msg) => set({ chatHistory: [...get().chatHistory, msg] }),
  
  updateMessageAction: (messageIndex, actionIndex, updates) => {
    const history = [...get().chatHistory];
    const message = { ...history[messageIndex] };
    if (message.actions) {
      const actions = [...message.actions];
      actions[actionIndex] = { ...actions[actionIndex], ...updates };
      message.actions = actions;
      history[messageIndex] = message;
      set({ chatHistory: history });
    }
  },

  isAgentThinking: false,
  setAgentThinking: (isAgentThinking) => set({ isAgentThinking }),

  searchResults: [],
  searchQuery: "",
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  performSearch: async (query) => {
    if (!query) {
      set({ searchResults: [], searchQuery: "" });
      return;
    }
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      set({ searchResults: data, searchQuery: query });
    } catch (e) {
      console.error("Search failed", e);
    }
  },
  
  executeCommand: async (command) => {
    const res = await fetch("/api/command", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ command, mode: get().executionMode })
    });
    return await res.json();
  },
  terminalCommands: [],
  broadcastTerminalCommand: (command) => set({ 
    terminalCommands: [...get().terminalCommands, command] 
  }),

  aiProvider: "gemini",
  setAiProvider: (aiProvider) => set({ aiProvider }),
  aiModel: "gemini-3.1-pro-preview",
  setAiModel: (aiModel) => set({ aiModel }),
  executionMode: "safe",
  setExecutionMode: (executionMode) => set({ executionMode }),

  stagedChanges: [],
  unstagedChanges: ["src/App.tsx", "src/components/Terminal.tsx", "src/store/useIDEStore.ts"],
  gitCommits: [
    { message: "Initial commit", hash: "a7b8c9d", date: "2024-05-01" },
    { message: "Add AI chat and terminal", hash: "f1e2d3c", date: "2024-05-02" }
  ],
  stageFile: (path) => {
    const { stagedChanges, unstagedChanges } = get();
    set({
      stagedChanges: [...stagedChanges, path],
      unstagedChanges: unstagedChanges.filter(p => p !== path)
    });
  },
  unstageFile: (path) => {
    const { stagedChanges, unstagedChanges } = get();
    set({
      stagedChanges: stagedChanges.filter(p => p !== path),
      unstagedChanges: [...unstagedChanges, path]
    });
  },
  commitChanges: async (message) => {
    const { stagedChanges, gitCommits } = get();
    if (stagedChanges.length === 0) return;
    const newCommit = {
      message,
      hash: Math.random().toString(36).substring(7),
      date: new Date().toISOString().split('T')[0]
    };
    set({
      gitCommits: [newCommit, ...gitCommits],
      stagedChanges: []
    });
  },
  pushChanges: async () => {
    // Simulated push
    await new Promise(r => setTimeout(r, 1000));
    console.log("Pushed to main");
  },
  pullChanges: async () => {
    // Simulated pull
    await new Promise(r => setTimeout(r, 1000));
    console.log("Pulled from main");
  },
  generateCommitMessage: async () => {
    const { stagedChanges, fileContents } = get();
    if (stagedChanges.length === 0) return "No changes to commit";
    
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      
      // Collect content of staged files for context
      let context = "Suggest a concise and professional Git commit message based on the following changes:\n\n";
      
      for (const path of stagedChanges) {
        let content = fileContents[path];
        if (!content) {
          try {
            const res = await fetch(`/api/file?path=${encodeURIComponent(path)}`);
            const data = await res.json();
            content = data.content;
          } catch (e) {
            content = "(could not load content)";
          }
        }
        context += `File: ${path}\nContent snippet:\n${content?.substring(0, 500)}\n\n`;
      }

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: context,
        config: {
          systemInstruction: "You are a senior software engineer. Output ONLY the commit message string, nothing else. Keep it under 72 characters.",
          temperature: 0.7,
        }
      });

      return response.text?.trim() || `Update ${stagedChanges.length} files`;
    } catch (e) {
      console.error("AI Commit Message failed", e);
      return `Update ${stagedChanges.length} files`;
    }
  },

  deleteFile: async (path) => {
    try {
      await fetch(`/api/file?path=${encodeURIComponent(path)}`, { method: "DELETE" });
      get().refreshFileTree();
      get().closeFile(path);
    } catch (e) {
      console.error("Delete failed", e);
    }
  },

  createFile: async (path, content = "") => {
    try {
      await fetch("/api/file", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path, content })
      });
      get().refreshFileTree();
      if (content) get().openFile(path);
    } catch (e) {
      console.error("Create failed", e);
    }
  },
}));
