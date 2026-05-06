import { app, BrowserWindow, ipcMain, dialog, shell, Menu } from 'electron';
import path from 'path';
import fs from 'fs-extra';
import { exec } from 'child_process';
import { promisify } from 'util';

const execPromise = promisify(exec);

let mainWindow: BrowserWindow | null = null;

const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    titleBarStyle: 'hiddenInset',
    trafficLightPosition: { x: 16, y: 16 },
    backgroundColor: '#0A0A0C',
    show: false,
    icon: path.join(__dirname, '../assets/icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
  });

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Build application menu
function buildMenu() {
  const template: Electron.MenuItemConstructorOptions[] = [
    {
      label: 'CodeForge AI',
      submenu: [
        { label: 'About CodeForge AI', role: 'about' },
        { type: 'separator' },
        { label: 'Settings', accelerator: 'CmdOrCtrl+,', click: () => mainWindow?.webContents.send('navigate', 'settings') },
        { type: 'separator' },
        { label: 'Quit', accelerator: 'CmdOrCtrl+Q', role: 'quit' },
      ],
    },
    {
      label: 'File',
      submenu: [
        { label: 'Open Project', accelerator: 'CmdOrCtrl+O', click: () => handleOpenProject() },
        { label: 'New Project', accelerator: 'CmdOrCtrl+Shift+N', click: () => mainWindow?.webContents.send('navigate', 'new-project') },
        { type: 'separator' },
        { label: 'Save', accelerator: 'CmdOrCtrl+S', click: () => mainWindow?.webContents.send('save-file') },
        { label: 'Save All', accelerator: 'CmdOrCtrl+Shift+S', click: () => mainWindow?.webContents.send('save-all') },
      ],
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'selectAll' },
      ],
    },
    {
      label: 'View',
      submenu: [
        { label: 'Command Palette', accelerator: 'CmdOrCtrl+K', click: () => mainWindow?.webContents.send('toggle-command-palette') },
        { type: 'separator' },
        { label: 'Toggle Sidebar', accelerator: 'CmdOrCtrl+B', click: () => mainWindow?.webContents.send('toggle-sidebar') },
        { label: 'Toggle Terminal', accelerator: 'CmdOrCtrl+`', click: () => mainWindow?.webContents.send('toggle-terminal') },
        { label: 'Toggle AI Chat', accelerator: 'CmdOrCtrl+L', click: () => mainWindow?.webContents.send('toggle-chat') },
        { type: 'separator' },
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { role: 'resetZoom' },
        { role: 'togglefullscreen' },
      ],
    },
    {
      label: 'Help',
      submenu: [
        { label: 'Documentation', click: () => shell.openExternal('https://github.com/Killurassoul/rassoulcode') },
        { label: 'Report Issue', click: () => shell.openExternal('https://github.com/Killurassoul/rassoulcode/issues') },
      ],
    },
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

async function handleOpenProject() {
  if (!mainWindow) return;
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory'],
    title: 'Open Project Folder',
  });
  if (!result.canceled && result.filePaths.length > 0) {
    mainWindow.webContents.send('open-project', result.filePaths[0]);
  }
}

// ---- IPC Handlers ----

ipcMain.handle('dialog:openDirectory', async () => {
  if (!mainWindow) return null;
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory'],
    title: 'Select Project Folder',
  });
  if (result.canceled) return null;
  return result.filePaths[0];
});

ipcMain.handle('fs:readDirectory', async (_event, dirPath: string) => {
  try {
    const getFileTree = async (dir: string): Promise<any[]> => {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      const tree = await Promise.all(
        entries.map(async (entry) => {
          const fullPath = path.join(dir, entry.name);
          const relativePath = path.relative(dirPath, fullPath);

          if (['node_modules', '.git', 'dist', '.next', '__pycache__', '.venv', 'venv'].includes(entry.name)) {
            return null;
          }

          if (entry.isDirectory()) {
            return {
              name: entry.name,
              path: relativePath,
              type: 'directory',
              children: await getFileTree(fullPath),
            };
          }
          return {
            name: entry.name,
            path: relativePath,
            type: 'file',
          };
        })
      );
      return tree.filter(Boolean);
    };
    return await getFileTree(dirPath);
  } catch (error: any) {
    return { error: error.message };
  }
});

ipcMain.handle('fs:readFile', async (_event, basePath: string, filePath: string) => {
  try {
    const fullPath = path.resolve(basePath, filePath);
    if (!fullPath.startsWith(basePath)) {
      return { error: 'Forbidden access' };
    }
    const content = await fs.readFile(fullPath, 'utf-8');
    return { content };
  } catch (error: any) {
    return { error: error.message };
  }
});

ipcMain.handle('fs:writeFile', async (_event, basePath: string, filePath: string, content: string) => {
  try {
    const fullPath = path.resolve(basePath, filePath);
    if (!fullPath.startsWith(basePath)) {
      return { error: 'Forbidden access' };
    }
    await fs.ensureDir(path.dirname(fullPath));
    await fs.writeFile(fullPath, content, 'utf-8');
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
});

ipcMain.handle('fs:deleteFile', async (_event, basePath: string, filePath: string) => {
  try {
    const fullPath = path.resolve(basePath, filePath);
    if (!fullPath.startsWith(basePath)) {
      return { error: 'Forbidden access' };
    }
    await fs.remove(fullPath);
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
});

ipcMain.handle('fs:createDirectory', async (_event, basePath: string, dirPath: string) => {
  try {
    const fullPath = path.resolve(basePath, dirPath);
    if (!fullPath.startsWith(basePath)) {
      return { error: 'Forbidden access' };
    }
    await fs.ensureDir(fullPath);
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
});

ipcMain.handle('shell:execute', async (_event, command: string, cwd: string, mode: string) => {
  try {
    if (mode === 'safe') {
      const forbidden = ['rm -rf /', 'mv /', 'chmod 777', '> /', 'shutdown', 'reboot', 'format', 'mkfs'];
      const isDangerous = forbidden.some(p => command.toLowerCase().includes(p));
      if (isDangerous) {
        return { output: '', error: `[SANDBOX BLOCK]: Command "${command}" was blocked for safety.` };
      }
    }
    const { stdout, stderr } = await execPromise(command, { cwd, timeout: 60000 });
    return { output: stdout, error: stderr };
  } catch (error: any) {
    return { output: error.stdout || '', error: error.stderr || error.message };
  }
});

ipcMain.handle('fs:search', async (_event, basePath: string, query: string) => {
  try {
    const results: any[] = [];
    const searchInDir = async (dir: string) => {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        const relativePath = path.relative(basePath, fullPath);
        if (['node_modules', '.git', 'dist'].includes(entry.name)) continue;
        if (entry.isDirectory()) {
          await searchInDir(fullPath);
        } else {
          const ext = path.extname(entry.name);
          const textExts = ['.ts', '.tsx', '.js', '.jsx', '.json', '.css', '.md', '.txt', '.html', '.py', '.rs', '.go', '.java', '.c', '.cpp', '.h'];
          if (textExts.includes(ext)) {
            const content = await fs.readFile(fullPath, 'utf-8');
            const lines = content.split('\n');
            lines.forEach((line, index) => {
              if (line.toLowerCase().includes(query.toLowerCase())) {
                results.push({ path: relativePath, line: index + 1, content: line.trim() });
              }
            });
          }
        }
      }
    };
    await searchInDir(basePath);
    return results;
  } catch (error: any) {
    return { error: error.message };
  }
});

ipcMain.handle('app:getVersion', () => {
  return app.getVersion();
});

ipcMain.handle('app:getPlatform', () => {
  return process.platform;
});

ipcMain.handle('store:get', async (_event, key: string) => {
  try {
    const storePath = path.join(app.getPath('userData'), 'codeforge-store.json');
    if (await fs.pathExists(storePath)) {
      const data = await fs.readJSON(storePath);
      return data[key] ?? null;
    }
    return null;
  } catch {
    return null;
  }
});

ipcMain.handle('store:set', async (_event, key: string, value: any) => {
  try {
    const storePath = path.join(app.getPath('userData'), 'codeforge-store.json');
    let data: Record<string, any> = {};
    if (await fs.pathExists(storePath)) {
      data = await fs.readJSON(storePath);
    }
    data[key] = value;
    await fs.writeJSON(storePath, data, { spaces: 2 });
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
});

ipcMain.handle('fs:detectFramework', async (_event, dirPath: string) => {
  try {
    const checks: Record<string, string[]> = {
      'Next.js': ['next.config.js', 'next.config.mjs', 'next.config.ts'],
      'React': ['src/App.tsx', 'src/App.jsx', 'src/App.js'],
      'Vue': ['src/App.vue', 'vue.config.js'],
      'Angular': ['angular.json'],
      'Svelte': ['svelte.config.js'],
      'Python': ['requirements.txt', 'setup.py', 'pyproject.toml'],
      'Node.js': ['server.js', 'server.ts', 'app.js'],
      'Rust': ['Cargo.toml'],
      'Go': ['go.mod'],
      'Java': ['pom.xml', 'build.gradle'],
    };
    const detected: string[] = [];
    for (const [framework, files] of Object.entries(checks)) {
      for (const file of files) {
        if (await fs.pathExists(path.join(dirPath, file))) {
          detected.push(framework);
          break;
        }
      }
    }
    // Check package.json for more details
    const pkgPath = path.join(dirPath, 'package.json');
    if (await fs.pathExists(pkgPath)) {
      const pkg = await fs.readJSON(pkgPath);
      const deps = { ...pkg.dependencies, ...pkg.devDependencies };
      if (deps['next']) detected.push('Next.js');
      if (deps['react']) detected.push('React');
      if (deps['vue']) detected.push('Vue');
      if (deps['@angular/core']) detected.push('Angular');
      if (deps['svelte']) detected.push('Svelte');
      if (deps['express']) detected.push('Express');
      if (deps['electron']) detected.push('Electron');
    }
    return [...new Set(detected)];
  } catch {
    return [];
  }
});

app.whenReady().then(() => {
  buildMenu();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
