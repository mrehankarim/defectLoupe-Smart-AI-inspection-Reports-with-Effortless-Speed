import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";

interface CommandItem {
  id: string;
  label: string;
  category: "Navigation" | "Quick Action";
  path: string;
  shortcut?: string;
  icon: string;
}

const COMMANDS: CommandItem[] = [
  { id: "landing", label: "Landing Page", category: "Navigation", path: "/", shortcut: "G L", icon: "🌐" },
  { id: "dash", label: "Dashboard", category: "Navigation", path: "/dashboard", shortcut: "G D", icon: "📊" },
  { id: "clients", label: "Clients Directory", category: "Navigation", path: "/clients", shortcut: "G C", icon: "👥" },
  { id: "props", label: "Properties Portfolio", category: "Navigation", path: "/properties", shortcut: "G P", icon: "🏠" },
  { id: "inspect", label: "Inspections Studio", category: "Navigation", path: "/inspections", shortcut: "G I", icon: "📋" },
  { id: "reports", label: "Reports & PDF Exports", category: "Navigation", path: "/reports", shortcut: "G R", icon: "📄" },
  { id: "kb", label: "AI Knowledge Base & RAG", category: "Navigation", path: "/knowledge-base", shortcut: "G K", icon: "🧠" },
  { id: "profile", label: "Inspector Profile", category: "Navigation", path: "/profile", shortcut: "G S", icon: "👤" },
  { id: "settings", label: "System Settings", category: "Navigation", path: "/settings", icon: "⚙️" },
];

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CommandPalette({ isOpen, onClose }: CommandPaletteProps) {
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);

  const filtered = COMMANDS.filter((cmd) =>
    cmd.label.toLowerCase().includes(query.toLowerCase()) ||
    cmd.category.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        if (isOpen) onClose();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  function handleSelect(item: CommandItem) {
    onClose();
    navigate(item.path);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % (filtered.length || 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filtered.length) % (filtered.length || 1));
    } else if (e.key === "Enter" && filtered[selectedIndex]) {
      e.preventDefault();
      handleSelect(filtered[selectedIndex]);
    } else if (e.key === "Escape") {
      onClose();
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-24 px-4 bg-slate-950/60 backdrop-blur-md transition-opacity"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl shadow-black/80 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Header */}
        <div className="flex items-center px-4 border-b border-slate-800">
          <svg className="w-4 h-4 text-slate-400 shrink-0 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            className="w-full py-4 bg-transparent text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none font-medium"
            placeholder="Type a command or search workspace..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
          />
          <kbd className="kbd-badge shrink-0">ESC</kbd>
        </div>

        {/* Command List */}
        <div className="max-h-80 overflow-y-auto p-2">
          {filtered.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500 font-mono">
              No matching commands or pages found.
            </div>
          ) : (
            filtered.map((item, idx) => {
              const isSelected = idx === selectedIndex;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleSelect(item)}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs transition-colors cursor-pointer ${
                    isSelected
                      ? "bg-indigo-600/20 text-indigo-200 border border-indigo-500/30"
                      : "text-slate-300 hover:bg-slate-800/60 border border-transparent"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-sm">{item.icon}</span>
                    <span className="font-semibold tracking-wide">{item.label}</span>
                    <span className="text-[10px] font-mono uppercase text-slate-500 px-1.5 py-0.5 rounded bg-slate-800/60 border border-slate-700/50">
                      {item.category}
                    </span>
                  </div>
                  {item.shortcut && (
                    <kbd className="kbd-badge">{item.shortcut}</kbd>
                  )}
                </button>
              );
            })
          )}
        </div>

        {/* Palette Footer */}
        <div className="flex items-center justify-between px-4 py-2.5 bg-slate-950/60 border-t border-slate-800/80 text-[11px] font-mono text-slate-500">
          <div className="flex items-center gap-2">
            <span>Navigate <kbd className="kbd-badge">↑</kbd> <kbd className="kbd-badge">↓</kbd></span>
            <span>Select <kbd className="kbd-badge">↵</kbd></span>
          </div>
          <span>DefectLoupe Workspace</span>
        </div>
      </div>
    </div>
  );
}
