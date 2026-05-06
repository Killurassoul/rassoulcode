import { create } from "zustand";
import { AI_PROVIDERS, chatWithAI, getAIAutocomplete } from "../lib/ai-providers";
import type { ChatCompletionMessage } from "../lib/ai-providers";

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

export interface HistoryEntry {
  id: string;
  type: "file_create" | "file_edit" | "file_delete" | "command" | "ai_action" | "git_commit";
  description: string;
  timestamp: string;
  details?: string;
  reversible?: boolean;
  snapshot?: { path: string; content: string };
}

export interface RecentProject {
  path: string;
  name: string;
  lastOpened: string;
  frameworks: string[];
}

export type SidebarTab = "explorer" | "search" | "ai" | "git" | "settings" | "history";
export type AppPage = "splash" | "dashboard" | "workspace";

// Helper: check if running in Electron
const isElectron = () => typeof window !== 'undefined' && !!window.electronAPI;

// Helper: API call abstraction (works in both Electron and web mode)
const api = {
  async readDirectory(dirPath: string): Promise<any[]> {
    if (isElectron()) {
      return window.electronAPI!.readDirectory(dirPath);
    }
    const res = await fetch("/api/files");
    return res.json();
  },
  async readFile(basePath: string, filePath: string): Promise<{ content?: string; error?: string }> {
    if (isElectron()) {
      return window.electronAPI!.readFile(basePath, filePath);
    }
    const res = await fetch(`/api/file?path=${encodeURIComponent(filePath)}`);
    return res.json();
  },
  async writeFile(basePath: string, filePath: string, content: string) {
    if (isElectron()) {
      return window.electronAPI!.writeFile(basePath, filePath, content);
    }
    const res = await fetch("/api/file", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path: filePath, content }),
    });
    return res.json();
  },
  async deleteFile(basePath: string, filePath: string) {
    if (isElectron()) {
      return window.electronAPI!.deleteFile(basePath, filePath);
    }
    await fetch(`/api/file?path=${encodeURIComponent(filePath)}`, { method: "DELETE" });
    return { success: true };
  },
  async search(basePath: string, query: string) {
    if (isElectron()) {
      return window.electronAPI!.search(basePath, query);
    }
    const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
    return res.json();
  },
  async execute(command: string, cwd: string, mode: string) {
    if (isElectron()) {
      return window.electronAPI!.execute(command, cwd, mode);
    }
    const res = await fetch("/api/command", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ command, mode }),
    });
    return res.json();
  },
  async detectFramework(dirPath: string): Promise<string[]> {
    if (isElectron()) {
      return window.electronAPI!.detectFramework(dirPath);
    }
    return [];
  },
  async storeGet(key: string): Promise<any> {
    if (isElectron()) {
      return window.electronAPI!.storeGet(key);
    }
    try {
      const val = localStorage.getItem(`codeforge_${key}`);
      return val ? JSON.parse(val) : null;
    } catch { return null; }
  },
  async storeSet(key: string, value: any) {
    if (isElectron()) {
      return window.electronAPI!.storeSet(key, value);
    }
    localStorage.setItem(`codeforge_${key}`, JSON.stringify(value));
    return { success: true };
  },
};

interface IDEState {
  // App Navigation
  currentPage: AppPage;
  setCurrentPage: (page: AppPage) => void;

  // Navigation
  activeSidebarTab: SidebarTab;
  setActiveSidebarTab: (tab: SidebarTab) => void;

  // Workspace
  workspaceRoot: string;
  projectName: string;
  detectedFrameworks: string[];
  fileTree: FileNode[];
  setFileTree: (tree: FileNode[]) => void;
  refreshFileTree: () => Promise<void>;
  openProject: (dirPath: string) => Promise<void>;

  // Recent Projects
  recentProjects: RecentProject[];
  loadRecentProjects: () => Promise<void>;
  addRecentProject: (project: RecentProject) => Promise<void>;
  removeRecentProject: (path: string) => Promise<void>;

  // Files / Editor
  openFiles: string[];
  activeFile: string | null;
  openFile: (path: string) => void;
  closeFile: (path: string) => void;
  setActiveFile: (path: string) => void;
  fileContents: Record<string, string>;
  setFileContent: (path: string, content: string) => void;
  fileSaveStatus: Record<string, "saved" | "unsaved" | "saving">;
  setFileSaveStatus: (path: string, status: "saved" | "unsaved" | "saving") => void;
  saveFile: (path: string) => Promise<void>;

  // AI Chat
  chatHistory: ChatMessage[];
  addMessage: (msg: ChatMessage) => void;
  clearChat: () => void;
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

  // AI Settings
  aiProvider: string;
  setAiProvider: (provider: string) => void;
  aiModel: string;
  setAiModel: (model: string) => void;
  apiKeys: Record<string, string>;
  setApiKey: (provider: string, key: string) => void;
  temperature: number;
  setTemperature: (temp: number) => void;
  maxTokens: number;
  setMaxTokens: (tokens: number) => void;
  executionMode: "safe" | "autonomous";
  setExecutionMode: (mode: "safe" | "autonomous") => void;
  loadSettings: () => Promise<void>;
  saveSettings: () => Promise<void>;

  // Git
  stagedChanges: string[];
  unstagedChanges: string[];
  gitCommits: { message: string; hash: string; date: string }[];
  stageFile: (path: string) => void;
  unstageFile: (path: string) => void;
  commitChanges: (message: string) => Promise<void>;
  pushChanges: () => Promise<void>;
  pullChanges: () => Promise<void>;
  generateCommitMessage: () => Promise<string>;
  refactorCode: () => Promise<void>;

  // File operations
  deleteFileAction: (path: string) => Promise<void>;
  createFile: (path: string, content?: string) => Promise<void>;
  createDirectory: (path: string) => Promise<void>;

  // History
  history: HistoryEntry[];
  addHistoryEntry: (entry: Omit<HistoryEntry, "id" | "timestamp">) => void;
  clearHistory: () => void;

  // Theme
  theme: "dark" | "light";
  setTheme: (theme: "dark" | "light") => void;
}

export const useIDEStore = create<IDEState>((set, get) => ({
  // App Navigation
  currentPage: "splash",
  setCurrentPage: (page) => set({ currentPage: page }),

  activeSidebarTab: "explorer",
  setActiveSidebarTab: (tab) => set({ activeSidebarTab: tab }),

  workspaceRoot: "",
  projectName: "",
  detectedFrameworks: [],
  fileTree: [],
  setFileTree: (fileTree) => set({ fileTree }),

  refreshFileTree: async () => {
    const { workspaceRoot } = get();
    if (!workspaceRoot) {
      // Fallback to web API mode
      try {
        const res = await fetch("/api/files");
        const data = await res.json();
        set({ fileTree: data });
      } catch (error) {
        console.error("Failed to refresh file tree", error);
      }
      return;
    }
    try {
      const data = await api.readDirectory(workspaceRoot);
      set({ fileTree: Array.isArray(data) ? data : [] });
    } catch (error) {
      console.error("Failed to refresh file tree", error);
    }
  },

  openProject: async (dirPath: string) => {
    const name = dirPath.split("/").pop() || dirPath.split("\\").pop() || dirPath;
    set({ workspaceRoot: dirPath, projectName: name, currentPage: "workspace", openFiles: [], activeFile: null, fileContents: {} });

    // Detect frameworks
    const frameworks = await api.detectFramework(dirPath);
    set({ detectedFrameworks: frameworks });

    // Refresh file tree
    const data = await api.readDirectory(dirPath);
    set({ fileTree: Array.isArray(data) ? data : [] });

    // Add to recent
    get().addRecentProject({ path: dirPath, name, lastOpened: new Date().toISOString(), frameworks });

    get().addHistoryEntry({ type: "ai_action", description: `Opened project: ${name}`, details: dirPath });
  },

  // Recent Projects
  recentProjects: [],
  loadRecentProjects: async () => {
    const projects = await api.storeGet("recentProjects");
    if (Array.isArray(projects)) {
      set({ recentProjects: projects });
    }
  },
  addRecentProject: async (project) => {
    const { recentProjects } = get();
    const filtered = recentProjects.filter(p => p.path !== project.path);
    const updated = [project, ...filtered].slice(0, 10);
    set({ recentProjects: updated });
    await api.storeSet("recentProjects", updated);
  },
  removeRecentProject: async (path) => {
    const { recentProjects } = get();
    const updated = recentProjects.filter(p => p.path !== path);
    set({ recentProjects: updated });
    await api.storeSet("recentProjects", updated);
  },

  openFiles: [],
  activeFile: null,
  fileContents: {},
  fileSaveStatus: {},

  openFile: async (filePath) => {
    const { openFiles, fileContents, workspaceRoot } = get();
    if (!openFiles.includes(filePath)) {
      set({ openFiles: [...openFiles, filePath] });
    }

    if (!fileContents[filePath]) {
      try {
        const data = await api.readFile(workspaceRoot, filePath);
        if (data.content !== undefined) {
          set({
            fileContents: { ...get().fileContents, [filePath]: data.content },
            fileSaveStatus: { ...get().fileSaveStatus, [filePath]: "saved" },
            activeFile: filePath,
          });
        }
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
  setFileContent: (path, content) => {
    set({
      fileContents: { ...get().fileContents, [path]: content },
      fileSaveStatus: { ...get().fileSaveStatus, [path]: "unsaved" },
    });
  },
  setFileSaveStatus: (path, status) =>
    set({ fileSaveStatus: { ...get().fileSaveStatus, [path]: status } }),

  saveFile: async (filePath) => {
    const { workspaceRoot, fileContents, setFileSaveStatus: setSave } = get();
    const content = fileContents[filePath];
    if (content === undefined) return;

    setSave(filePath, "saving");
    try {
      await api.writeFile(workspaceRoot, filePath, content);
      setSave(filePath, "saved");
    } catch {
      setSave(filePath, "unsaved");
    }
  },

  chatHistory: [
    {
      role: "assistant",
      content: "Hello! I'm CodeForge AI, your autonomous coding assistant. I can help you build complete software projects, edit files, run commands, and debug issues. What would you like to work on?",
      timestamp: new Date().toISOString(),
    },
  ],
  addMessage: (msg) => set({ chatHistory: [...get().chatHistory, msg] }),
  clearChat: () =>
    set({
      chatHistory: [
        {
          role: "assistant",
          content: "Chat cleared. How can I help you?",
          timestamp: new Date().toISOString(),
        },
      ],
    }),

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
      const { workspaceRoot } = get();
      const data = await api.search(workspaceRoot, query);
      set({ searchResults: Array.isArray(data) ? data : [], searchQuery: query });
    } catch (e) {
      console.error("Search failed", e);
    }
  },

  executeCommand: async (command) => {
    const { workspaceRoot, executionMode } = get();
    const cwd = workspaceRoot || process.cwd?.() || ".";
    const result = await api.execute(command, cwd, executionMode);
    get().addHistoryEntry({ type: "command", description: `Executed: ${command}`, details: result.output || result.error });
    return result;
  },
  terminalCommands: [],
  broadcastTerminalCommand: (command) =>
    set({ terminalCommands: [...get().terminalCommands, command] }),

  // AI Settings
  aiProvider: "gemini",
  setAiProvider: (aiProvider) => {
    const provider = AI_PROVIDERS.find(p => p.id === aiProvider);
    const firstModel = provider?.models[0]?.id || "";
    set({ aiProvider, aiModel: firstModel });
    get().saveSettings();
  },
  aiModel: "gemini-2.0-flash",
  setAiModel: (aiModel) => { set({ aiModel }); get().saveSettings(); },
  apiKeys: {},
  setApiKey: (provider, key) => {
    const keys = { ...get().apiKeys, [provider]: key };
    set({ apiKeys: keys });
    get().saveSettings();
  },
  temperature: 0.1,
  setTemperature: (temperature) => { set({ temperature }); get().saveSettings(); },
  maxTokens: 8192,
  setMaxTokens: (maxTokens) => { set({ maxTokens }); get().saveSettings(); },
  executionMode: "safe",
  setExecutionMode: (executionMode) => { set({ executionMode }); get().saveSettings(); },

  loadSettings: async () => {
    const settings = await api.storeGet("settings");
    if (settings) {
      set({
        aiProvider: settings.aiProvider || "gemini",
        aiModel: settings.aiModel || "gemini-2.0-flash",
        apiKeys: settings.apiKeys || {},
        temperature: settings.temperature ?? 0.1,
        maxTokens: settings.maxTokens ?? 8192,
        executionMode: settings.executionMode || "safe",
        theme: settings.theme || "dark",
      });
    }
  },

  saveSettings: async () => {
    const { aiProvider, aiModel, apiKeys, temperature, maxTokens, executionMode, theme } = get();
    await api.storeSet("settings", { aiProvider, aiModel, apiKeys, temperature, maxTokens, executionMode, theme });
  },

  stagedChanges: [],
  unstagedChanges: [],
  gitCommits: [],
  stageFile: (path) => {
    const { stagedChanges, unstagedChanges } = get();
    set({
      stagedChanges: [...stagedChanges, path],
      unstagedChanges: unstagedChanges.filter((p) => p !== path),
    });
  },
  unstageFile: (path) => {
    const { stagedChanges, unstagedChanges } = get();
    set({
      stagedChanges: stagedChanges.filter((p) => p !== path),
      unstagedChanges: [...unstagedChanges, path],
    });
  },
  commitChanges: async (message) => {
    const { stagedChanges, gitCommits, workspaceRoot, executionMode } = get();
    if (stagedChanges.length === 0) return;

    try {
      // Try real git commit
      await api.execute(`git add ${stagedChanges.join(" ")}`, workspaceRoot, executionMode);
      await api.execute(`git commit -m '${message.replace(/'/g, "'\\''")}'`, workspaceRoot, executionMode);
    } catch {
      // Fallback to simulated
    }

    const newCommit = {
      message,
      hash: Math.random().toString(36).substring(2, 9),
      date: new Date().toISOString().split("T")[0],
    };
    set({ gitCommits: [newCommit, ...gitCommits], stagedChanges: [] });
    get().addHistoryEntry({ type: "git_commit", description: `Committed: ${message}`, details: `${stagedChanges.length} files` });
  },
  pushChanges: async () => {
    const { workspaceRoot, executionMode } = get();
    try {
      await api.execute("git push", workspaceRoot, executionMode);
    } catch {}
  },
  pullChanges: async () => {
    const { workspaceRoot, executionMode } = get();
    try {
      await api.execute("git pull", workspaceRoot, executionMode);
    } catch {}
  },
  generateCommitMessage: async () => {
    const { stagedChanges, fileContents, aiProvider, aiModel, apiKeys } = get();
    if (stagedChanges.length === 0) return "No changes to commit";

    const apiKey = apiKeys[aiProvider] || "";
    if (!apiKey) return `Update ${stagedChanges.length} files`;

    let context = "Suggest a concise Git commit message based on these changed files:\n\n";
    for (const path of stagedChanges) {
      const content = fileContents[path] || "(content not loaded)";
      context += `File: ${path}\nSnippet:\n${content.substring(0, 500)}\n\n`;
    }

    try {
      const result = await chatWithAI(aiProvider, aiModel, apiKey, "Generate ONLY a commit message string, nothing else. Keep it under 72 characters.", context);
      return result.trim() || `Update ${stagedChanges.length} files`;
    } catch {
      return `Update ${stagedChanges.length} files`;
    }
  },

  refactorCode: async () => {
    const { activeFile, fileContents, setFileContent, aiProvider, aiModel, apiKeys } = get();
    if (!activeFile) return;

    const apiKey = apiKeys[aiProvider] || "";
    if (!apiKey) return;

    try {
      set({ isAgentThinking: true });
      const content = fileContents[activeFile];
      const result = await chatWithAI(
        aiProvider, aiModel, apiKey,
        "Refactor and improve the following code. Keep it clean, efficient and follow best practices. Output ONLY the improved code, no explanations or markdown blocks.",
        `File: ${activeFile}\n\n${content}`
      );
      const improvedCode = result.trim().replace(/^```[a-z]*\n/i, "").replace(/\n```$/i, "");
      if (improvedCode) {
        const oldContent = fileContents[activeFile];
        setFileContent(activeFile, improvedCode);
        get().addHistoryEntry({
          type: "file_edit",
          description: `AI refactored: ${activeFile}`,
          reversible: true,
          snapshot: { path: activeFile, content: oldContent },
        });
      }
    } catch (e) {
      console.error("Refactoring failed", e);
    } finally {
      set({ isAgentThinking: false });
    }
  },

  deleteFileAction: async (path) => {
    const { workspaceRoot } = get();
    try {
      await api.deleteFile(workspaceRoot, path);
      get().refreshFileTree();
      get().closeFile(path);
      get().addHistoryEntry({ type: "file_delete", description: `Deleted: ${path}` });
    } catch (e) {
      console.error("Delete failed", e);
    }
  },

  createFile: async (path, content = "") => {
    const { workspaceRoot } = get();
    try {
      await api.writeFile(workspaceRoot, path, content);
      get().refreshFileTree();
      if (content) get().openFile(path);
      get().addHistoryEntry({ type: "file_create", description: `Created: ${path}` });
    } catch (e) {
      console.error("Create failed", e);
    }
  },

  createDirectory: async (dirPath) => {
    const { workspaceRoot } = get();
    try {
      if (isElectron()) {
        await window.electronAPI!.createDirectory(workspaceRoot, dirPath);
      }
      get().refreshFileTree();
      get().addHistoryEntry({ type: "file_create", description: `Created directory: ${dirPath}` });
    } catch (e) {
      console.error("Create directory failed", e);
    }
  },

  // History
  history: [],
  addHistoryEntry: (entry) => {
    const newEntry: HistoryEntry = {
      ...entry,
      id: Math.random().toString(36).substring(2, 11),
      timestamp: new Date().toISOString(),
    };
    set({ history: [newEntry, ...get().history].slice(0, 200) });
  },
  clearHistory: () => set({ history: [] }),

  // Theme
  theme: "dark",
  setTheme: (theme) => { set({ theme }); get().saveSettings(); },
}));
