import { contextBridge, ipcRenderer } from 'electron';

const electronAPI = {
  // Dialog
  openDirectory: () => ipcRenderer.invoke('dialog:openDirectory'),

  // Filesystem
  readDirectory: (dirPath: string) => ipcRenderer.invoke('fs:readDirectory', dirPath),
  readFile: (basePath: string, filePath: string) => ipcRenderer.invoke('fs:readFile', basePath, filePath),
  writeFile: (basePath: string, filePath: string, content: string) => ipcRenderer.invoke('fs:writeFile', basePath, filePath, content),
  deleteFile: (basePath: string, filePath: string) => ipcRenderer.invoke('fs:deleteFile', basePath, filePath),
  createDirectory: (basePath: string, dirPath: string) => ipcRenderer.invoke('fs:createDirectory', basePath, dirPath),
  search: (basePath: string, query: string) => ipcRenderer.invoke('fs:search', basePath, query),
  detectFramework: (dirPath: string) => ipcRenderer.invoke('fs:detectFramework', dirPath),

  // Shell
  execute: (command: string, cwd: string, mode: string) => ipcRenderer.invoke('shell:execute', command, cwd, mode),

  // App
  getVersion: () => ipcRenderer.invoke('app:getVersion'),
  getPlatform: () => ipcRenderer.invoke('app:getPlatform'),

  // Persistent Store
  storeGet: (key: string) => ipcRenderer.invoke('store:get', key),
  storeSet: (key: string, value: any) => ipcRenderer.invoke('store:set', key, value),

  // Events from main process
  onNavigate: (callback: (route: string) => void) => {
    ipcRenderer.on('navigate', (_event, route) => callback(route));
  },
  onOpenProject: (callback: (path: string) => void) => {
    ipcRenderer.on('open-project', (_event, path) => callback(path));
  },
  onSaveFile: (callback: () => void) => {
    ipcRenderer.on('save-file', () => callback());
  },
  onSaveAll: (callback: () => void) => {
    ipcRenderer.on('save-all', () => callback());
  },
  onToggleCommandPalette: (callback: () => void) => {
    ipcRenderer.on('toggle-command-palette', () => callback());
  },
  onToggleSidebar: (callback: () => void) => {
    ipcRenderer.on('toggle-sidebar', () => callback());
  },
  onToggleTerminal: (callback: () => void) => {
    ipcRenderer.on('toggle-terminal', () => callback());
  },
  onToggleChat: (callback: () => void) => {
    ipcRenderer.on('toggle-chat', () => callback());
  },
};

contextBridge.exposeInMainWorld('electronAPI', electronAPI);

export type ElectronAPI = typeof electronAPI;
