import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import fs from "fs-extra";
import { fileURLToPath } from "url";
import { exec } from "child_process";
import { promisify } from "util";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const execPromise = promisify(exec);

async function startServer() {
  const app = express();
  const PORT = 3000;
  const WORKSPACE_DIR = process.cwd();

  app.use(express.json());

  // --- API Routes ---

  // Get project status & workspace info
  app.get("/api/status", (req, res) => {
    res.json({
      workspace: WORKSPACE_DIR,
      time: new Date().toISOString(),
      platform: process.platform,
    });
  });

  // List files (Recursive tree)
  app.get("/api/files", async (req, res) => {
    try {
      const getFileTree = async (dir: string): Promise<any[]> => {
        const entries = await fs.readdir(dir, { withFileTypes: true });
        const tree = await Promise.all(
          entries.map(async (entry) => {
            const fullPath = path.join(dir, entry.name);
            const relativePath = path.relative(WORKSPACE_DIR, fullPath);
            
            if (entry.name === "node_modules" || entry.name === ".git" || entry.name === "dist") {
              return null;
            }

            if (entry.isDirectory()) {
              return {
                name: entry.name,
                path: relativePath,
                type: "directory",
                children: await getFileTree(fullPath),
              };
            } else {
              return {
                name: entry.name,
                path: relativePath,
                type: "file",
              };
            }
          })
        );
        return tree.filter(Boolean);
      };

      const tree = await getFileTree(WORKSPACE_DIR);
      res.json(tree);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Read file
  app.get("/api/file", async (req, res) => {
    const filePath = req.query.path as string;
    if (!filePath) return res.status(400).json({ error: "Path required" });

    try {
      const fullPath = path.resolve(WORKSPACE_DIR, filePath);
      if (!fullPath.startsWith(WORKSPACE_DIR)) {
        return res.status(403).json({ error: "Forbidden access" });
      }

      const content = await fs.readFile(fullPath, "utf-8");
      res.json({ content });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Write/Update file
  app.post("/api/file", async (req, res) => {
    const { path: filePath, content } = req.body;
    if (!filePath) return res.status(400).json({ error: "Path required" });

    try {
      const fullPath = path.resolve(WORKSPACE_DIR, filePath);
      if (!fullPath.startsWith(WORKSPACE_DIR)) {
        return res.status(403).json({ error: "Forbidden access" });
      }

      await fs.ensureDir(path.dirname(fullPath));
      await fs.writeFile(fullPath, content, "utf-8");
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Delete file
  app.delete("/api/file", async (req, res) => {
    const filePath = req.query.path as string;
    if (!filePath) return res.status(400).json({ error: "Path required" });

    try {
      const fullPath = path.resolve(WORKSPACE_DIR, filePath);
      if (!fullPath.startsWith(WORKSPACE_DIR)) {
        return res.status(403).json({ error: "Forbidden access" });
      }

      await fs.remove(fullPath);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Terminal Command Execution (Simplified for safety)
  app.post("/api/command", async (req, res) => {
    const { command, mode } = req.body;
    if (!command) return res.status(400).json({ error: "Command required" });

    try {
      // Basic Sandbox Simulation
      if (mode === "safe") {
        const forbiddenPatterns = ["rm -rf", "mv /", "chmod 777", "> /", "shutdown", "reboot"];
        const isDangerous = forbiddenPatterns.some(p => command.toLowerCase().includes(p));
        
        if (isDangerous) {
          return res.status(403).json({ 
            output: "", 
            error: `⚠️ [SANDBOX BLOCK]: Command "${command}" was blocked for safety in Safe Mode.` 
          });
        }

        // Simulating restricted environment by prefixing echo in some cases
        // (This is just a demo of "safer" handling)
      }

      const { stdout, stderr } = await execPromise(command, { cwd: WORKSPACE_DIR });
      res.json({ output: stdout, error: stderr });
    } catch (error: any) {
      res.status(500).json({ output: error.stdout, error: error.stderr || error.message });
    }
  });

  // Search project
  app.get("/api/search", async (req, res) => {
    const query = req.query.q as string;
    if (!query) return res.status(400).json({ error: "Query required" });

    try {
      // Use grep-like logic or direct fs read for simple demo
      // Simplified: recursive search for the string in files
      const searchInDir = async (dir: string): Promise<any[]> => {
        const results: any[] = [];
        const entries = await fs.readdir(dir, { withFileTypes: true });
        
        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name);
          const relativePath = path.relative(WORKSPACE_DIR, fullPath);

          if (entry.name === "node_modules" || entry.name === ".git" || entry.name === "dist") {
            continue;
          }

          if (entry.isDirectory()) {
            results.push(...(await searchInDir(fullPath)));
          } else {
            // Only search text files
            const ext = path.extname(entry.name);
            const textExtensions = [".ts", ".tsx", ".js", ".jsx", ".json", ".css", ".md", ".txt", ".html"];
            if (textExtensions.includes(ext)) {
               const content = await fs.readFile(fullPath, "utf-8");
               const lines = content.split("\n");
               lines.forEach((line, index) => {
                 if (line.toLowerCase().includes(query.toLowerCase())) {
                   results.push({
                     path: relativePath,
                     line: index + 1,
                     content: line.trim(),
                   });
                 }
               });
            }
          }
        }
        return results;
      };

      const searchResults = await searchInDir(WORKSPACE_DIR);
      res.json(searchResults);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // --- Vite Dev Server Integration ---

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Production serving
    const distPath = path.join(WORKSPACE_DIR, "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 CodeForge AI Server running at http://localhost:${PORT}`);
  });
}

startServer();
