/**
 * RAG Knowledge Base management page.
 * Upload documents, list ingested files, search the vector store,
 * and delete documents. Authenticated (inside AppShell).
 */
import { useState, useEffect, useCallback, useRef } from "react";
import { api, ApiError } from "../../services/api";

interface Document {
  id: string;
  filename: string;
  created_at: string;
}

interface SearchResult {
  id: string;
  filename: string;
  chunk_text: string;
  score: number;
}

export default function KnowledgeBasePage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [docsLoading, setDocsLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [dragOver, setDragOver] = useState(false);
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
      await api.upload("/rag/documents/upload", formData);
      showToast(`Uploaded: ${file.name}`);
      fetchDocuments();
    } catch (err) {
      showToast((err as ApiError).detail || "Upload failed", "error");
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(filename: string) {
    if (!confirm(`Delete "${filename}"?`)) return;
    try {
      await api.delete(`/rag/documents/${encodeURIComponent(filename)}`);
      showToast(`Deleted: ${filename}`);
      fetchDocuments();
    } catch (err) {
      showToast((err as ApiError).detail || "Delete failed", "error");
    }
  }

  async function handleSearch() {
    if (!searchQuery.trim()) return;
    setSearching(true);
    setSearchResults([]);
    try {
      const data = await api.post<{ results: SearchResult[] }>("/rag/search", {
        query: searchQuery.trim(),
        limit: 10,
      });
      setSearchResults(data.results || []);
    } catch (err) {
      showToast((err as ApiError).detail || "Search failed", "error");
    } finally {
      setSearching(false);
    }
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
    <div className="p-6">
      {toast && (
        <div className={`fixed top-4 right-4 ${toast.type === "error" ? "bg-red-600" : "bg-green-600"} text-white px-4 py-3 rounded-lg shadow-lg z-[100] max-w-sm`}>
          <div className="flex justify-between items-center gap-3">
            <span className="text-sm">{toast.message}</span>
            <button onClick={() => setToast(null)} className="text-white/80 hover:text-white font-bold">&times;</button>
          </div>
        </div>
      )}

      <h1 className="text-2xl font-bold mb-6">Knowledge Base</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Upload + Documents */}
        <div className="space-y-6">
          {/* Upload Zone */}
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-colors ${
              dragOver
                ? "border-indigo-400 bg-indigo-50"
                : "border-[rgb(var(--border))] hover:border-indigo-300 hover:bg-[rgb(var(--input-bg))]"
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
              <div>
                <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-3" />
                <p className="text-sm text-[rgb(var(--text-muted))]">Uploading...</p>
              </div>
            ) : (
              <div>
                <svg className="w-10 h-10 mx-auto mb-3 text-[rgb(var(--text-muted))] opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <p className="text-sm font-medium">Drop a file here or click to browse</p>
                <p className="text-xs text-[rgb(var(--text-muted))] mt-1">Supports PDF, TXT, and MD files</p>
              </div>
            )}
          </div>

          {/* Document List */}
          <div className="border border-[rgb(var(--border))] rounded-2xl bg-[rgb(var(--surface))] overflow-hidden">
            <div className="p-4 border-b border-[rgb(var(--border))] flex justify-between items-center">
              <h2 className="font-semibold">Documents ({documents.length})</h2>
              <button
                onClick={fetchDocuments}
                className="text-xs text-indigo-600 hover:text-indigo-700"
              >
                Refresh
              </button>
            </div>
            <div className="max-h-96 overflow-auto">
              {docsLoading ? (
                <div className="p-6 text-center text-sm text-[rgb(var(--text-muted))]">Loading...</div>
              ) : documents.length === 0 ? (
                <div className="p-6 text-center text-sm text-[rgb(var(--text-muted))]">
                  No documents uploaded yet
                </div>
              ) : (
                <div className="divide-y divide-[rgb(var(--border))]">
                  {documents.map((doc) => (
                    <div key={doc.id} className="flex justify-between items-center px-4 py-3 hover:bg-[rgb(var(--input-bg))] group">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">{doc.filename}</p>
                        <p className="text-xs text-[rgb(var(--text-muted))]">
                          {new Date(doc.created_at).toLocaleString()}
                        </p>
                      </div>
                      <button
                        onClick={() => handleDelete(doc.filename)}
                        className="ml-3 p-1.5 text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Delete document"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Search */}
        <div className="space-y-6">
          <div className="border border-[rgb(var(--border))] rounded-2xl bg-[rgb(var(--surface))] overflow-hidden">
            <div className="p-4 border-b border-[rgb(var(--border))]">
              <h2 className="font-semibold">Vector Search</h2>
              <p className="text-xs text-[rgb(var(--text-muted))] mt-1">Search the knowledge base using natural language queries</p>
            </div>
            <div className="p-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Enter search query..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  className="flex-1 p-2.5 border border-[rgb(var(--input-border))] rounded-xl bg-[rgb(var(--input-bg))] focus:ring-2 focus:ring-indigo-300 outline-none text-sm"
                />
                <button
                  onClick={handleSearch}
                  disabled={!searchQuery.trim() || searching}
                  className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                >
                  {searching ? "Searching..." : "Search"}
                </button>
              </div>
            </div>

            {/* Search Results */}
            <div className="border-t border-[rgb(var(--border))] max-h-[500px] overflow-auto">
              {searchResults.length === 0 && !searching ? (
                <div className="p-6 text-center text-sm text-[rgb(var(--text-muted))]">
                  Enter a query to search the knowledge base
                </div>
              ) : (
                <div className="divide-y divide-[rgb(var(--border))]">
                  {searchResults.map((result, idx) => (
                    <div key={result.id || idx} className="p-4 hover:bg-[rgb(var(--input-bg))]">
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-xs font-medium text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                          {result.filename}
                        </span>
                        <span className="text-xs text-[rgb(var(--text-muted))]">
                          Score: {(1 - result.score).toFixed(3)}
                        </span>
                      </div>
                      <p className="text-sm text-[rgb(var(--text))] leading-relaxed line-clamp-4">
                        {result.chunk_text}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

