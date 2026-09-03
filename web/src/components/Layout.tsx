import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import { useLocation, Link } from 'react-router-dom';

/* ── Navigation items ──────────────────────────────────────────── */
const NAV_ITEMS = [
  { path: '/', label: 'Dashboard', icon: DashboardIcon },
  { path: '/clients', label: 'Clients', icon: UsersIcon },
  { path: '/properties', label: 'Properties', icon: BuildingIcon },
  { path: '/inspections', label: 'Inspections', icon: ClipboardIcon },
  { path: '/account', label: 'Account', icon: UserIcon },
] as const;

/* ── Toast context ─────────────────────────────────────────────── */
type ToastType = 'success' | 'error' | 'info';
interface ToastCtx {
  showToast: (message: string, type?: ToastType) => void;
}
const ToastContext = createContext<ToastCtx>({ showToast: () => {} });
export const useToast = () => useContext(ToastContext);

interface ToastItem { id: number; message: string; type: ToastType; }

function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const showToast = useCallback((message: string, type: ToastType = 'success') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
  }, []);

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed top-4 right-4 z-[200] flex flex-col gap-2 max-w-sm">
        {toasts.map((t) => (
          <Toast key={t.id} toast={t} onDismiss={dismiss} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function Toast({ toast, onDismiss }: { toast: ToastItem; onDismiss: (id: number) => void }) {
  const bg =
    toast.type === 'error' ? 'bg-red-600' :
    toast.type === 'info' ? 'bg-brand-500' : 'bg-green-600';

  return (
    <div className={`${bg} text-white px-4 py-3 rounded-lg shadow-lg animate-[slideIn_0.2s_ease-out]`}>
      <div className="flex justify-between items-center gap-3">
        <span className="text-sm">{toast.message}</span>
        <button
          onClick={() => onDismiss(toast.id)}
          className="text-white/80 hover:text-white font-bold text-lg leading-none"
          aria-label="Dismiss"
        >
          &times;
        </button>
      </div>
    </div>
  );
}

/* ── Layout ────────────────────────────────────────────────────── */
export default function Layout({ children, onLogout }: { children: ReactNode; onLogout: () => void }) {
  const location = useLocation();

  return (
    <ToastProvider>
      <div className="flex min-h-screen">
        {/* Sidebar */}
        <aside className="w-[240px] bg-sidebar-bg text-sidebar-text flex flex-col shrink-0">
          <div className="px-5 pt-7 pb-2">
            <Link to="/" className="no-underline">
              <div className="text-xl font-extrabold text-white tracking-tight">
                Defect<span className="text-brand-200">Loupe</span>
              </div>
            </Link>
          </div>

          <nav className="flex-1 px-3 py-4 flex flex-col gap-1 sidebar-scroll overflow-y-auto">
            {NAV_ITEMS.map(({ path, label, icon: Icon }) => {
              const active = path === '/'
                ? location.pathname === '/'
                : location.pathname.startsWith(path);
              return (
                <Link
                  key={path}
                  to={path}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium no-underline transition-colors ${
                    active
                      ? 'bg-sidebar-active text-white'
                      : 'text-sidebar-text hover:bg-sidebar-hover hover:text-white'
                  }`}
                >
                  <Icon className="w-[18px] h-[18px] shrink-0 opacity-70" />
                  {label}
                </Link>
              );
            })}
          </nav>

          <div className="px-3 pb-5">
            <button
              onClick={async () => {
                await fetch('/auth/logout', { method: 'POST', credentials: 'include' });
                onLogout();
              }}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium w-full text-left text-sidebar-text hover:bg-sidebar-hover hover:text-white transition-colors"
            >
              <LogoutIcon className="w-[18px] h-[18px] shrink-0 opacity-70" />
              Sign out
            </button>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 overflow-auto">
          <div className="w-full max-w-[1100px] mx-auto px-8 py-10">
            {children}
          </div>
        </main>
      </div>
    </ToastProvider>
  );
}

/* ── Icons (inline SVG, no deps) ───────────────────────────────── */
function DashboardIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  );
}
function UsersIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}
function BuildingIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="2" width="16" height="20" rx="2" />
      <path d="M9 22v-4h6v4" />
      <path d="M8 6h.01M16 6h.01M12 6h.01M8 10h.01M16 10h.01M12 10h.01M8 14h.01M16 14h.01M12 14h.01" />
    </svg>
  );
}
function ClipboardIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <rect x="8" y="2" width="8" height="4" rx="1" />
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
      <path d="M12 11h4M12 16h4M8 11h.01M8 16h.01" />
    </svg>
  );
}
function UserIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}
function LogoutIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  );
}
