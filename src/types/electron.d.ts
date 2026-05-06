export interface ElectronAPI {
  openDirectory: () => Promise<string | null>;
  readDirectory: (dirPath: string) => Promise<any[]>;
  readFile: (basePath: string, filePath: string) => Promise<{ content?: string; error?: string }>;
  writeFile: (basePath: string, filePath: string, content: string) => Promise<{ success?: boolean; error?: string }>;
  deleteFile: (basePath: string, filePath: string) => Promise<{ success?: boolean; error?: string }>;
  createDirectory: (basePath: string, dirPath: string) => Promise<{ success?: boolean; error?: string }>;
  search: (basePath: string, query: string) => Promise<any[]>;
  detectFramework: (dirPath: string) => Promise<string[]>;
  execute: (command: string, cwd: string, mode: string) => Promise<{ output: string; error: string }>;
  getVersion: () => Promise<string>;
  getPlatform: () => Promise<string>;
  storeGet: (key: string) => Promise<any>;
  storeSet: (key: string, value: any) => Promise<{ success?: boolean; error?: string }>;
  onNavigate: (callback: (route: string) => void) => void;
  onOpenProject: (callback: (path: string) => void) => void;
  onSaveFile: (callback: () => void) => void;
  onSaveAll: (callback: () => void) => void;
  onToggleCommandPalette: (callback: () => void) => void;
  onToggleSidebar: (callback: () => void) => void;
  onToggleTerminal: (callback: () => void) => void;
  onToggleChat: (callback: () => void) => void;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}

export {};
