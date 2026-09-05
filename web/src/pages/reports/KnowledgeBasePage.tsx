/**
 * RAG Knowledge Base management & semantic vector search page.
 * Powered by pgvector (384-dimensional dense cosine distance) and
 * preloaded with standard forensic engineering codes (IBC 2024, ASTM C881,
 * NEC 2023, IRC 2024, EPA Mold Remediation).
 */
import { useState, useEffect, useCallback, useRef } from "react";
import { api, ApiError } from "../../services/api";

interface Document {
  id: string;
  filename: string;
  created_at: string;
  chunk_count?: number;
}

interface SearchResult {
  id: string;
  filename: string;
  chunk_text: string;
  score: number;
}

const SUGGESTED_QUERIES = [
  { label: "Concrete Shear Crack", query: "concrete shear crack deflection limits" },
  { label: "Electrical Panel Double-Tapping", query: "double tapping breaker neutral bus isolation" },
  { label: "Roof Shingle Granule Loss", query: "roof asphalt shingle hail damage and granule loss" },
  { label: "Mold & Moisture WME Limits", query: "wood moisture equivalent WME relative humidity limits" },
  { label: "ASTM C881 Epoxy Injection", query: "ASTM C881 epoxy pressure injection foundation crack" },
  { label: "Attic Ventilation & Moisture", query: "attic ventilation ratio 1/150 net free area" },
];

export default function KnowledgeBasePage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [docsLoading, setDocsLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeQuery, setActiveQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "error" | "success" } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const showToast = (message: string, type: "error" | "success" = "success") =>
    setToast({ message, type });

  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(t);
    }
  }, [toast]);

  const fetchDocuments = useCallback(async () => {
    setDocsLoading(true);
    try {
      const data = await api.get<Document[]>("/rag/documents");
      setDocuments(data);
    } catch (err) {
      showToast((err as ApiError).detail || "Failed to load documents", "error");
    } finally {
      setDocsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  async function uploadFile(file: File) {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await api.upload<{ filename: string; chunks_created: number }>("/rag/documents/upload", formData);
      showToast(`Ingested ${res.filename} (${res.chunks_created} vector chunks)`);
      fetchDocuments();
    } catch (err) {
      showToast((err as ApiError).detail || "Upload failed", "error");
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(filename: string) {
    if (!confirm(`Delete all vector embeddings for "${filename}"?`)) return;
    try {
      await api.delete(`/rag/documents/${encodeURIComponent(filename)}`);
      showToast(`Removed: ${filename}`);
      fetchDocuments();
      if (activeQuery) {
        handleSearch(activeQuery);
      }
    } catch (err) {
      showToast((err as ApiError).detail || "Delete failed", "error");
    }
  }

  async function handleSearch(targetQuery?: string) {
    const q = (targetQuery !== undefined ? targetQuery : searchQuery).trim();
    if (!q) return;

    if (targetQuery !== undefined) {
      setSearchQuery(targetQuery);
    }

    setSearching(true);
    setActiveQuery(q);
    setHasSearched(true);
    setSearchResults([]);

    try {
      const data = await api.post<{ results: SearchResult[] }>("/rag/search", {
        query: q,
        limit: 8,
      });
      setSearchResults(data.results || []);
    } catch (err) {
      showToast((err as ApiError).detail || "Vector search failed", "error");
    } finally {
      setSearching(false);
    }
  }

  function handleCopySnippet(id: string, text: string) {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      uploadFile(files[0]);
    }
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (files && files.length > 0) {
      uploadFile(files[0]);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed top-5 right-5 ${
            toast.type === "error" ? "bg-rose-600 border-rose-700" : "bg-emerald-600 border-emerald-700"
          } text-white px-4 py-3 rounded-xl shadow-2xl z-[200] max-w-md flex items-center justify-between gap-4 border animate-in fade-in slide-in-from-top-2`}
        >
          <span className="text-xs sm:text-sm font-medium">{toast.message}</span>
          <button onClick={() => setToast(null)} className="text-white/80 hover:text-white font-bold text-lg leading-none">
            &times;
          </button>
        </div>
      )}

      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-slate-200 dark:border-slate-800 bg-gradient-to-r from-slate-900 via-slate-950 to-indigo-950 p-6 sm:p-8 text-white shadow-xl">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                PgVector Semantic RAG
              </span>
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-white/10 text-white/90 border border-white/15">
                384-Dim all-MiniLM-L6-v2
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              AI Inspection Knowledge Base
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl">
              Query building codes, architectural specifications, and repair guidelines using dense vector similarity.
              Search across IBC 2024, ASTM C881, NEC 2023, IRC 2024, or upload your agency’s proprietary standards.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => fetchDocuments()}
              className="px-4 py-2 rounded-xl text-xs font-bold border border-white/20 bg-white/10 hover:bg-white/15 text-white transition-all flex items-center gap-2 cursor-pointer"
            >
              <svg className={`w-3.5 h-3.5 ${docsLoading ? "animate-spin" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh Vector Index
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid: Left = Document Ingestion, Right = Semantic Search */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column (5 cols): Ingestion & Documents */}
        <div className="lg:col-span-5 space-y-6">
          {/* Upload Box */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all duration-200 ${
              dragOver
                ? "border-emerald-500 bg-emerald-500/10 scale-[1.01]"
                : "border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900/60 hover:border-emerald-500/60 hover:bg-slate-50 dark:hover:bg-slate-900"
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.txt,.md"
              onChange={handleFileSelect}
              className="hidden"
            />
            {uploading ? (
              <div className="py-4">
                <div className="w-10 h-10 border-3 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin mx-auto mb-3" />
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Chunking & Generating Embeddings...</p>
                <p className="text-[11px] text-slate-400 mt-1">Indexing vectors into PostgreSQL pgvector</p>
              </div>
            ) : (
              <div className="py-2">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto mb-3">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                </div>
                <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                  Drop building code or click to upload
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  Supports PDF, TXT, and Markdown (.md) technical manuals
                </p>
              </div>
            )}
          </div>

          {/* Document Library */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-950/40">
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                  Indexed Knowledge Standards
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                  {documents.length}
                </span>
              </div>
            </div>

            <div className="max-h-[460px] overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/80">
              {docsLoading ? (
                <div className="p-8 text-center text-xs text-slate-400 space-y-2">
                  <div className="w-6 h-6 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin mx-auto" />
                  <p>Loading vector indexes...</p>
                </div>
              ) : documents.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400">
                  No reference documents ingested yet
                </div>
              ) : (
                documents.map((doc) => {
                  const isStandard =
                    doc.filename.startsWith("IBC_") ||
                    doc.filename.startsWith("ASTM_") ||
                    doc.filename.startsWith("NEC_") ||
                    doc.filename.startsWith("IRC_") ||
                    doc.filename.startsWith("EPA_");

                  return (
                    <div
                      key={doc.id}
                      className="p-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors flex items-start justify-between gap-3 group"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold uppercase tracking-wider ${
                              isStandard
                                ? "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20"
                                : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                            }`}
                          >
                            {isStandard ? "Standard Code" : "Custom Manual"}
                          </span>
                          {doc.chunk_count !== undefined && (
                            <span className="text-[10px] font-mono text-slate-400">
                              {doc.chunk_count} chunk(s)
                            </span>
                          )}
                        </div>
                        <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">
                          {doc.filename}
                        </p>
                        <p className="text-[10px] font-mono text-slate-400 mt-0.5">
                          Indexed: {new Date(doc.created_at).toLocaleDateString()}
                        </p>
                      </div>

                      <div className="flex items-center gap-1 shrink-0 pt-1">
                        <button
                          onClick={() => {
                            const queryTerm = doc.filename
                              .replace(/\.(md|pdf|txt)$/i, "")
                              .replace(/_/g, " ");
                            handleSearch(queryTerm);
                          }}
                          className="px-2 py-1 rounded-lg text-[10px] font-bold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 transition-colors flex items-center gap-1 cursor-pointer"
                          title="Search chunks from this document"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                          </svg>
                          Query
                        </button>
                        {!isStandard && (
                          <button
                            onClick={() => handleDelete(doc.filename)}
                            className="p-1 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer opacity-0 group-hover:opacity-100"
                            title="Delete vector chunks"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Right Column (7 cols): Vector Search Console */}
        <div className="lg:col-span-7 space-y-6">
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden flex flex-col">
            {/* Console Header */}
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    Semantic Vector Query Console
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Calculates cosine similarity distance across all embedded technical standard chunks
                  </p>
                </div>
              </div>

              {/* Search Bar Input */}
              <div className="mt-4 flex gap-2">
                <div className="relative flex-1">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    placeholder="Ask any building code question (e.g. differential settlement crack limits, subpanel grounding)..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                    className="w-full pl-9 pr-8 py-2.5 rounded-xl text-xs sm:text-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 placeholder-slate-400 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/50"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery("")}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-sm cursor-pointer"
                    >
                      &times;
                    </button>
                  )}
                </div>

                <button
                  onClick={() => handleSearch()}
                  disabled={!searchQuery.trim() || searching}
                  className="px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm text-white bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-emerald-500/20 transition-all flex items-center gap-2 cursor-pointer shrink-0"
                >
                  {searching ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Searching...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                      Execute Query
                    </>
                  )}
                </button>
              </div>

              {/* Suggested Engineering Query Chips */}
              <div className="mt-3 flex items-center gap-1.5 flex-wrap">
                <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider mr-1">
                  Suggestions:
                </span>
                {SUGGESTED_QUERIES.map((sq) => (
                  <button
                    key={sq.label}
                    onClick={() => handleSearch(sq.query)}
                    className="px-2.5 py-1 rounded-lg text-[11px] font-medium border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-emerald-500/50 hover:bg-emerald-500/5 text-slate-700 dark:text-slate-300 transition-all cursor-pointer"
                  >
                    {sq.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Results Body */}
            <div className="p-5 flex-1 min-h-[400px]">
              {searching ? (
                <div className="py-16 text-center space-y-4">
                  <div className="w-10 h-10 border-3 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin mx-auto" />
                  <div>
                    <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                      Querying PgVector Knowledge Graph...
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      Generating dense embedding & ranking top cosine similarity matches
                    </p>
                  </div>
                </div>
              ) : !hasSearched ? (
                <div className="py-12 px-4 text-center max-w-md mx-auto space-y-4">
                  <div className="w-14 h-14 rounded-3xl bg-indigo-500/10 text-indigo-500 dark:text-indigo-400 flex items-center justify-center mx-auto">
                    <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm sm:text-base">
                      Interactive RAG Semantic Search
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
                      Type any question or click one of the suggested engineering queries above to perform
                      dense vector search across all standard building manuals and remediation specifications.
                    </p>
                  </div>
                </div>
              ) : searchResults.length === 0 ? (
                <div className="py-12 px-4 text-center max-w-md mx-auto space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                      No vector chunks matched "{activeQuery}"
                    </h3>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                      Try broadening your search terms, selecting a suggested query above, or uploading a relevant manual.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Results Header */}
                  <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-100 dark:border-slate-800">
                    <span className="font-mono text-slate-500 dark:text-slate-400">
                      Ranked results for:{" "}
                      <span className="font-bold text-slate-800 dark:text-slate-200">"{activeQuery}"</span>
                    </span>
                    <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                      {searchResults.length} chunk(s) retrieved
                    </span>
                  </div>

                  {/* Results Cards List */}
                  <div className="space-y-3.5">
                    {searchResults.map((result, idx) => {
                      const relevancePct = Math.min(Math.max(Math.round(((result.score - 0.1) / 0.6) * 100), 20), 99);
                      const isHigh = relevancePct >= 70;
                      const isMed = relevancePct >= 50;

                      return (
                        <div
                          key={result.id || idx}
                          className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/60 hover:border-emerald-500/40 hover:shadow-md transition-all space-y-2.5"
                        >
                          {/* Card Top: Rank, File, Score, Copy Button */}
                          <div className="flex items-center justify-between gap-2 flex-wrap">
                            <div className="flex items-center gap-2">
                              <span className="w-5 h-5 rounded-md bg-slate-200 dark:bg-slate-800 text-[10px] font-mono font-bold flex items-center justify-center text-slate-700 dark:text-slate-300">
                                #{idx + 1}
                              </span>
                              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 truncate max-w-[220px]">
                                {result.filename}
                              </span>
                            </div>

                            <div className="flex items-center gap-2">
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border ${
                                  isHigh
                                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
                                    : isMed
                                    ? "bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/30"
                                    : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30"
                                }`}
                              >
                                {relevancePct}% Relevance <span className="opacity-60 text-[9px]">({result.score.toFixed(3)})</span>
                              </span>
                              <button
                                onClick={() => handleCopySnippet(result.id, result.chunk_text)}
                                className="px-2 py-1 rounded-lg text-[10px] font-bold text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors flex items-center gap-1 cursor-pointer"
                                title="Copy excerpt to clipboard"
                              >
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                </svg>
                                {copiedId === result.id ? "Copied!" : "Copy"}
                              </button>
                            </div>
                          </div>

                          {/* Excerpt Body */}
                          <p className="text-xs sm:text-[13px] text-slate-800 dark:text-slate-200 font-sans leading-relaxed whitespace-pre-line bg-white dark:bg-slate-900/80 p-3 rounded-lg border border-slate-100 dark:border-slate-800/80">
                            {result.chunk_text}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
