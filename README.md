# CodeForge AI

A premium desktop AI coding assistant application inspired by Cursor, Windsurf, Devin, and VS Code. Built with Electron + React + TypeScript, CodeForge AI acts as an autonomous AI software engineer capable of building and managing real software projects.

## Features

### AI Agent System
- **Multi-provider AI support**: OpenAI, Anthropic Claude, Google Gemini, OpenRouter, Nvidia NIM, Mistral, DeepSeek
- **Autonomous coding agent**: Analyzes codebases, creates development plans, generates file structures
- **Structured actions**: create_file, edit_file, delete_file, run_command, install_package
- **Two execution modes**: Safe Mode (confirmation required) and Autonomous Mode (AI acts freely)

### IDE Features
- **Monaco Editor** with AI-powered autocomplete, syntax highlighting, multi-tab support
- **File Explorer** with create/rename/delete, drag-and-drop, context menus
- **Integrated Terminal** with WebGL acceleration, command execution
- **Git Integration** with status, commit, push/pull, AI-generated commit messages
- **Command Palette** (Ctrl+K) for quick file and action access
- **Project-aware AI Chat** with drag-and-drop file context

### Desktop App
- **Electron-based** with native installers for Windows (.exe), macOS (.dmg), Linux (.AppImage/.deb)
- **Splash screen** and **Projects Dashboard** for project management
- **Recent projects** with framework auto-detection (React, Next.js, Python, Node.js, etc.)
- **Settings panel** with API key management, model selection, temperature/token config

### Security
- Sandboxed command execution in Safe Mode
- Dangerous command detection and blocking
- API keys stored locally with encryption
- Folder permission management

## Tech Stack

- **Frontend**: React 19, TypeScript, TailwindCSS 4, Zustand, Monaco Editor, Framer Motion
- **Desktop**: Electron, Electron Builder
- **Backend**: Node.js, IPC secure communication, local filesystem access
- **Libraries**: fs-extra, chokidar, xterm.js, simple-git

## Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/Killurassoul/rassoulcode.git
cd rassoulcode

# Install dependencies
npm install

# Run in web mode (development)
npm run dev

# Run as Electron desktop app
npm run electron:dev
```

### Building Installers

```bash
# Build for all platforms
npm run electron:dist

# Build for specific platform
npm run electron:dist:win    # Windows .exe installer
npm run electron:dist:mac    # macOS .dmg
npm run electron:dist:linux  # Linux .AppImage and .deb
```

### Configuration

1. Open the app and go to **Settings** (gear icon in sidebar)
2. Select your preferred **AI Provider** (OpenAI, Anthropic, Gemini, etc.)
3. Enter your **API Key** for the selected provider
4. Choose a **Model** and adjust temperature/token settings
5. Select **Safe Mode** or **Autonomous Mode**

## Architecture

```
codeforge-ai/
  electron/          # Electron main process
    main.ts          # Main process (window, IPC handlers, menus)
    preload.ts       # Preload script (secure API bridge)
  src/
    components/      # React UI components
    lib/             # AI providers, utilities
    store/           # Zustand state management
    types/           # TypeScript type definitions
  assets/            # App icons and resources
  server.ts          # Express server (web mode)
```

## Supported AI Providers

| Provider | Models | Key Prefix |
|----------|--------|------------|
| OpenAI | GPT-4o, GPT-4o Mini, o1 | sk- |
| Anthropic | Claude Sonnet 4, Claude 3.5 | sk-ant- |
| Google Gemini | Gemini 2.5 Pro/Flash, 2.0 | AI |
| OpenRouter | All major models | sk-or- |
| Nvidia NIM | Llama 3.1, Mixtral | nvapi- |
| Mistral | Large, Medium, Codestral | - |
| DeepSeek | Chat, Coder, Reasoner | sk- |

## License

MIT
