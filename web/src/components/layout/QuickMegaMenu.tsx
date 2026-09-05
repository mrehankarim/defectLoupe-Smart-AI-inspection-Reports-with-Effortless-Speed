import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

interface QuickMegaMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenSearch?: () => void;
  isDark: boolean;
}

interface MenuItem {
  title: string;
  description: string;
  icon: React.ReactNode;
  path?: string;
  action?: () => void;
  badge?: string;
  accentColor: string;
}

interface MenuSection {
  category: string;
  subtitle: string;
  items: MenuItem[];
}

export function QuickMegaMenu({
  isOpen,
  onClose,
  onOpenSearch,
  isDark,
}: QuickMegaMenuProps) {
  const navigate = useNavigate();
  const [filterQuery, setFilterQuery] = useState("");
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onClose();
      }
    }
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sections: MenuSection[] = [
    {
      category: "Core Inspection Workflow",
      subtitle: "Daily field operations & property tracking",
      items: [
        {
          title: "Dashboard",
          description: "Live overview & metrics",
          path: "/dashboard",
          accentColor: "from-emerald-500/20 to-teal-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <rect x="3" y="3" width="7" height="7" rx="2" strokeWidth="1.8" />
              <rect x="14" y="3" width="7" height="7" rx="2" strokeWidth="1.8" />
              <rect x="14" y="14" width="7" height="7" rx="2" strokeWidth="1.8" />
              <rect x="3" y="14" width="7" height="7" rx="2" strokeWidth="1.8" />
            </svg>
          ),
        },
        {
          title: "Clients Directory",
          description: "Homeowners & management",
          path: "/clients",
          accentColor: "from-blue-500/20 to-indigo-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30",
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" strokeWidth="1.8" />
              <path strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          ),
        },
        {
          title: "Properties",
          description: "Real estate assets & specs",
          path: "/properties",
          accentColor: "from-amber-500/20 to-orange-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30",
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" points="9 22 9 12 15 12 15 22" />
            </svg>
          ),
        },
        {
          title: "Inspections",
          description: "Active jobs & checklists",
          path: "/inspections",
          badge: "Active",
          accentColor: "from-purple-500/20 to-violet-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30",
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
              <rect x="8" y="2" width="8" height="4" rx="1" strokeWidth="1.8" />
              <path strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" d="M9 14l2 2 4-4" />
            </svg>
          ),
        },
      ],
    },
    {
      category: "AI & Intelligence Suite",
      subtitle: "Automated vision analysis, vector search & reports",
      items: [
        {
          title: "Reports & PDF",
          description: "Jinja2 & WeasyPrint export",
          path: "/reports",
          badge: "PDF Ready",
          accentColor: "from-emerald-500/20 to-green-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" points="14 2 14 8 20 8" />
              <line strokeWidth="1.8" strokeLinecap="round" x1="16" y1="13" x2="8" y2="13" />
              <line strokeWidth="1.8" strokeLinecap="round" x1="16" y1="17" x2="8" y2="17" />
              <line strokeWidth="1.8" strokeLinecap="round" x1="10" y1="9" x2="8" y2="9" />
            </svg>
          ),
        },
        {
          title: "AI Knowledge Base",
          description: "pgvector RAG document search",
          path: "/knowledge-base",
          badge: "Vector AI",
          accentColor: "from-cyan-500/20 to-blue-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/30",
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 1.98-3A2.5 2.5 0 0 1 9.5 2Z" />
              <path strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-1.98-3A2.5 2.5 0 0 0 14.5 2Z" />
            </svg>
          ),
        },
        {
          title: "Photo Defect Scanner",
          description: "Gemini 1.5 Flash inspection",
          path: "/inspections",
          badge: "Gemini",
          accentColor: "from-rose-500/20 to-pink-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30",
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
              <circle cx="12" cy="13" r="4" strokeWidth="1.8" />
            </svg>
          ),
        },
        {
          title: "QR Verification",
          description: "Cryptographic hash check",
          path: "/verify/sample-token",
          accentColor: "from-teal-500/20 to-emerald-500/10 text-teal-600 dark:text-teal-400 border-teal-500/30",
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <rect x="3" y="3" width="7" height="7" strokeWidth="1.8" />
              <rect x="14" y="3" width="7" height="7" strokeWidth="1.8" />
              <rect x="14" y="14" width="7" height="7" strokeWidth="1.8" />
              <rect x="3" y="14" width="7" height="7" strokeWidth="1.8" />
              <path strokeWidth="1.8" strokeLinecap="round" d="M10 7h1m0 10h1m6-6v1" />
            </svg>
          ),
        },
      ],
    },
    {
      category: "Account & System Tools",
      subtitle: "Inspector profile, team & command launcher",
      items: [
        {
          title: "Inspector Account",
          description: "Profile, license & agency credentials",
          path: "/profile",
          accentColor: "from-indigo-500/20 to-sky-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/30",
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" strokeWidth="1.8" />
            </svg>
          ),
        },
        {
          title: "Quick Command Palette",
          description: "Instant search (Ctrl + K)",
          action: () => {
            onClose();
            onOpenSearch?.();
          },
          accentColor: "from-violet-500/20 to-fuchsia-500/10 text-violet-600 dark:text-violet-400 border-violet-500/30",
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="8" strokeWidth="1.8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" strokeWidth="1.8" />
            </svg>
          ),
        },
        {
          title: "Public Landing Page",
          description: "Marketing & features overview",
          path: "/",
          accentColor: "from-slate-500/20 to-gray-500/10 text-slate-700 dark:text-slate-300 border-slate-500/30",
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
              <polyline strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" points="15 3 21 3 21 9" />
              <line strokeWidth="1.8" strokeLinecap="round" x1="10" y1="14" x2="21" y2="3" />
            </svg>
          ),
        },
      ],
    },
  ];

  function handleSelect(item: MenuItem) {
    onClose();
    if (item.action) {
      item.action();
    } else if (item.path) {
      navigate(item.path);
    }
  }

  const filteredSections = sections.map((sec) => ({
    ...sec,
    items: sec.items.filter(
      (item) =>
        item.title.toLowerCase().includes(filterQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(filterQuery.toLowerCase())
    ),
  })).filter((sec) => sec.items.length > 0);

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-2 sm:pt-6 pb-3 px-3 sm:px-4 bg-black/65 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto">
      <div
        ref={menuRef}
        className="w-full max-w-5xl rounded-2xl sm:rounded-3xl border shadow-2xl overflow-hidden transition-all duration-200 animate-in zoom-in-95 flex flex-col max-h-[94vh] sm:max-h-[90vh]"
        style={{
          background: isDark
            ? "rgba(10, 13, 20, 0.96)"
            : "rgba(255, 255, 255, 0.98)",
          borderColor: isDark
            ? "rgba(255, 255, 255, 0.12)"
            : "rgba(226, 232, 240, 0.95)",
          boxShadow: isDark
            ? "0 25px 50px -12px rgba(0, 0, 0, 0.8), 0 0 40px rgba(16, 185, 129, 0.12)"
            : "0 20px 45px -10px rgba(0, 0, 0, 0.12)",
        }}
      >
        {/* Header Bar */}
        <div
          className="px-4 sm:px-6 py-3.5 border-b flex items-center justify-between gap-3 shrink-0"
          style={{
            borderColor: isDark
              ? "rgba(255, 255, 255, 0.08)"
              : "rgba(226, 232, 240, 0.8)",
          }}
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              {/* Three Lines Icon */}
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <line x1="3" y1="6" x2="21" y2="6" strokeWidth="2.2" strokeLinecap="round" />
                <line x1="3" y1="12" x2="21" y2="12" strokeWidth="2.2" strokeLinecap="round" />
                <line x1="3" y1="18" x2="21" y2="18" strokeWidth="2.2" strokeLinecap="round" />
              </svg>
            </div>
            <div>
              <h2 className="text-sm font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
                Workspace Hub & Navigation
                <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  Quick Apps
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Explore all tools line-by-line in horizontal view
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Quick Filter Search */}
            <div className="relative w-48 sm:w-64">
              <input
                type="text"
                placeholder="Filter tools..."
                value={filterQuery}
                onChange={(e) => setFilterQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl bg-slate-100 dark:bg-slate-900/80 border border-slate-300/80 dark:border-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-emerald-500 transition-colors"
                autoFocus
              />
              <svg
                className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <circle cx="11" cy="11" r="8" strokeWidth="2" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" strokeWidth="2" />
              </svg>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-xl hover:bg-slate-200/80 dark:hover:bg-slate-800/80 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
              title="Close (Esc)"
            >
              <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono text-slate-400 bg-slate-200/60 dark:bg-slate-800/60 rounded border border-slate-300 dark:border-slate-700 mr-1.5">
                ESC
              </kbd>
              <svg className="w-4 h-4 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Body: Horizontal Rows / Line-Wise Sections */}
        <div className="p-4 sm:p-5 flex-1 min-h-0 overflow-y-auto space-y-4 sm:space-y-5">
          {filteredSections.map((sec, idx) => (
            <div key={idx} className="space-y-2.5">
              {/* Row Header Line */}
              <div className="flex items-center justify-between border-b pb-1.5"
                style={{
                  borderColor: isDark ? "rgba(255, 255, 255, 0.06)" : "rgba(226, 232, 240, 0.7)",
                }}
              >
                <div className="flex items-center gap-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    {sec.category}
                  </h3>
                </div>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 hidden sm:inline">
                  {sec.subtitle}
                </span>
              </div>

              {/* Horizontal Line-Wise Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
                {sec.items.map((item, itemIdx) => (
                  <button
                    key={itemIdx}
                    onClick={() => handleSelect(item)}
                    type="button"
                    className="flex flex-row items-center gap-3 p-3 rounded-2xl border text-left transition-all duration-200 group cursor-pointer hover:scale-[1.015] hover:shadow-lg"
                    style={{
                      background: isDark
                        ? "rgba(18, 24, 38, 0.55)"
                        : "rgba(248, 250, 252, 0.8)",
                      borderColor: isDark
                        ? "rgba(255, 255, 255, 0.07)"
                        : "rgba(226, 232, 240, 0.85)",
                    }}
                  >
                    {/* Icon Tile */}
                    <div
                      className={`w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center border shrink-0 transition-transform group-hover:scale-105 shadow-sm ${item.accentColor}`}
                    >
                      {item.icon}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-xs font-bold tracking-tight text-slate-900 dark:text-slate-100 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors truncate">
                          {item.title}
                        </span>
                        {item.badge && (
                          <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shrink-0">
                            {item.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
                        {item.description}
                      </p>
                    </div>

                    {/* Arrow Indicator */}
                    <svg
                      className="w-3.5 h-3.5 text-slate-400 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all shrink-0"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                ))}
              </div>
            </div>
          ))}

          {filteredSections.length === 0 && (
            <div className="py-12 text-center text-slate-500 dark:text-slate-400">
              <p className="text-sm font-medium">No tools found matching "{filterQuery}"</p>
              <p className="text-xs mt-1">Try searching for dashboard, clients, reports, or AI</p>
            </div>
          )}
        </div>

        {/* Footer Info */}
        <div
          className="px-4 sm:px-6 py-2.5 border-t flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 shrink-0"
          style={{
            borderColor: isDark
              ? "rgba(255, 255, 255, 0.08)"
              : "rgba(226, 232, 240, 0.8)",
            background: isDark
              ? "rgba(10, 13, 20, 0.8)"
              : "rgba(248, 250, 252, 0.9)",
          }}
        >
          <div className="flex items-center gap-2">
            <span>DefectLoupe Engine Active — 4 Microservices Operational</span>
          </div>
          <div className="flex items-center gap-3">
            <span>Click any card or press <kbd className="px-1 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-[10px] font-mono">Esc</kbd></span>
          </div>
        </div>
      </div>
    </div>
  );
}
