import { ChevronRight, ChevronDown, File, Folder, FolderOpen, MoreVertical, Plus, RotateCw, Trash2, FilePlus, FolderPlus } from "lucide-react";
import React, { useState } from "react";
import { useIDEStore, FileNode } from "../store/useIDEStore.ts";
import { cn } from "../lib/utils.ts";

interface TreeItemProps {
  node: FileNode;
  level: number;
  key?: string | number;
}

function TreeItem({ node, level }: TreeItemProps) {
  const [isOpen, setOpen] = useState(false);
  const { openFile, activeFile, deleteFile } = useIDEStore();

  const isDirectory = node.type === "directory";
  const isSelected = activeFile === node.path;

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isDirectory) {
      setOpen(!isOpen);
    } else {
      openFile(node.path);
    }
  };

  const handleDragStart = (e: React.DragEvent) => {
    if (isDirectory) return;
    e.dataTransfer.setData("text/plain", node.path);
    e.dataTransfer.setData("application/x-file-path", node.path);
    e.dataTransfer.effectAllowed = "copy";
    
    // Create a drag image
    const dragIcon = document.createElement("div");
    dragIcon.className = "bg-brand text-white px-3 py-1 rounded text-xs font-mono shadow-xl";
    dragIcon.innerText = node.name;
    document.body.appendChild(dragIcon);
    e.dataTransfer.setDragImage(dragIcon, 0, 0);
    setTimeout(() => document.body.removeChild(dragIcon), 0);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm(`Voulez-vous vraiment supprimer ${node.name} ?`)) {
      deleteFile(node.path);
    }
  };

  return (
    <div>
      <div 
        draggable={!isDirectory}
        onDragStart={handleDragStart}
        className={cn(
          "flex items-center gap-1.5 py-1 px-4 cursor-pointer hover:bg-white/5 transition-colors group relative select-none",
          isSelected && "bg-brand/10 text-brand font-medium border-r-2 border-brand"
        )}
        style={{ paddingLeft: `${level * 12 + 16}px` }}
        onClick={handleClick}
      >
        <span className="text-text-dim group-hover:text-white transition-colors w-4 flex justify-center">
          {isDirectory ? (
            isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />
          ) : null}
        </span>
        
        <span className={cn(
          "flex-shrink-0",
          isDirectory ? "text-indigo-400" : "text-amber-500/80"
        )}>
          {isDirectory ? (
            isOpen ? <FolderOpen size={16} /> : <Folder size={16} />
          ) : (
            <File size={16} />
          )}
        </span>

        <span className={cn(
          "text-[13px] truncate flex-1",
          isSelected ? "text-white" : "text-zinc-300"
        )}>
          {node.name}
        </span>

        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity pr-1">
          <button 
            onClick={handleDelete}
            className="p-1 hover:bg-white/10 rounded text-text-dim hover:text-red-400 transition-colors"
          >
            <Trash2 size={12} />
          </button>
        </div>
      </div>

      {isDirectory && isOpen && node.children && (
        <div className="animate-in fade-in slide-in-from-top-1 duration-200">
          {node.children.map((child) => (
            <TreeItem key={child.path} node={child} level={level + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function Explorer() {
  const { fileTree, refreshFileTree, createFile } = useIDEStore();
  const [isCreatingFile, setIsCreatingFile] = useState(false);
  const [newFileName, setNewFileName] = useState("");

  const handleCreateFile = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!newFileName.trim()) {
      setIsCreatingFile(false);
      return;
    }
    await createFile(newFileName);
    setNewFileName("");
    setIsCreatingFile(false);
  };

  return (
    <div className="flex flex-col h-full bg-bg-panel/30">
      <div className="flex items-center justify-between px-4 py-2 border-b border-white/5 bg-white/2">
        <span className="text-[10px] font-bold text-text-dim uppercase tracking-widest">
          Espace de travail
        </span>
        <div className="flex items-center gap-1">
          <button 
            onClick={() => refreshFileTree()}
            className="p-1 hover:bg-white/5 rounded text-text-dim hover:text-white transition-colors"
            title="Rafraîchir"
          >
            <RotateCw size={12} />
          </button>
          <button 
            onClick={() => setIsCreatingFile(true)}
            className="p-1 hover:bg-white/5 rounded text-text-dim hover:text-white transition-colors" 
            title="Nouveau fichier"
          >
            <FilePlus size={13} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto py-2">
        {isCreatingFile && (
          <div className="px-4 py-2 bg-brand/5 border-l-2 border-brand mb-2 mx-2 rounded-r">
             <form onSubmit={handleCreateFile} className="flex flex-col gap-2">
                <input
                  type="text"
                  value={newFileName}
                  onChange={(e) => setNewFileName(e.target.value)}
                  placeholder="nom-fichier.ts"
                  className="bg-[#0A0A0B] border border-brand/50 rounded p-1 text-[12px] text-white outline-none"
                  autoFocus
                  onBlur={() => !newFileName && setIsCreatingFile(false)}
                />
                <div className="flex gap-2 justify-end">
                  <button type="button" onClick={() => setIsCreatingFile(false)} className="text-[10px] text-text-dim hover:text-white">Annuler</button>
                  <button type="submit" className="text-[10px] text-brand font-bold uppercase tracking-wider">Créer</button>
                </div>
             </form>
          </div>
        )}

        {fileTree.length === 0 ? (
          <div className="p-4 text-center">
            <div className="animate-pulse w-full h-4 bg-white/5 rounded mb-2" />
            <div className="animate-pulse w-3/4 h-4 bg-white/5 rounded mx-auto" />
          </div>
        ) : (
          fileTree.map((node) => (
            <TreeItem key={node.path} node={node} level={0} />
          ))
        )}
      </div>
    </div>
  );
}

