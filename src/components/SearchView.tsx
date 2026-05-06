import React, { useState } from "react";
import { useIDEStore } from "../store/useIDEStore";
import { Search, FileText, Loader2 } from "lucide-react";

export default function SearchView() {
  const { searchQuery, setSearchQuery, performSearch, searchResults, openFile } = useIDEStore();
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    await performSearch(searchQuery);
    setIsSearching(false);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-white/5">
        <form onSubmit={handleSearch} className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search in project..."
            className="w-full bg-[#0A0A0B] border border-white/10 rounded-lg py-2 pl-9 pr-3 text-sm focus:border-brand outline-none transition-all"
            autoFocus
          />
          <Search className="absolute left-3 top-2.5 text-text-dim" size={14} />
          {isSearching && <Loader2 className="absolute right-3 top-2.5 text-brand animate-spin" size={14} />}
        </form>
      </div>

      <div className="flex-1 overflow-y-auto">
        {!searchResults.length && searchQuery && !isSearching && (
          <div className="p-8 text-center text-text-dim text-xs italic">
            No results found for "{searchQuery}"
          </div>
        )}

        {!searchQuery && !isSearching && (
          <div className="p-8 text-center text-text-dim text-xs opacity-50">
            Start typing to search...
          </div>
        )}

        <div className="py-2">
          {searchResults.map((result: any, i: number) => (
            <div
              key={`${result.path}-${result.line}-${i}`}
              onClick={() => openFile(result.path)}
              className="px-4 py-2 hover:bg-white/5 cursor-pointer border-b border-white/2 group transition-colors"
            >
              <div className="flex items-center gap-2 mb-1">
                <FileText size={12} className="text-brand" />
                <span className="text-[11px] font-mono text-white/80 group-hover:text-white transition-colors truncate">
                  {result.path}
                </span>
                <span className="text-[10px] text-text-dim ml-auto">line {result.line}</span>
              </div>
              <div className="pl-4 border-l-2 border-brand/20 group-hover:border-brand/50 transition-colors">
                <p className="text-[10px] text-text-dim font-mono truncate bg-bg-panel/50 px-1 py-0.5 rounded italic">
                  {result.content}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
