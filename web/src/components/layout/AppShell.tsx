import { useEffect, useRef, useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";

const navigation = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/clients", label: "Clients" },
  { to: "/properties", label: "Properties" },
  { to: "/inspections", label: "Inspections" },
];

function Navigation({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <nav aria-label="Primary navigation" className="space-y-1">
      {navigation.map((item) => (
        <NavLink
          className={({ isActive }) => `block rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
            isActive
              ? "bg-blue-600 text-white"
              : "text-[rgb(var(--text-muted))] hover:bg-[rgb(var(--surface-muted))] hover:text-[rgb(var(--text))]"
          }`}
          key={item.to}
          onClick={onNavigate}
          to={item.to}
        >
          {item.label}
        </NavLink>
      ))}
      <span aria-disabled="true" className="block cursor-not-allowed rounded-lg px-3 py-2 text-sm font-medium text-slate-400 dark:text-slate-500">
        Media <span className="ml-1 text-xs">Soon</span>
      </span>
      <span aria-disabled="true" className="block cursor-not-allowed rounded-lg px-3 py-2 text-sm font-medium text-slate-400 dark:text-slate-500">
        Reports <span className="ml-1 text-xs">Soon</span>
      </span>
    </nav>
  );
}

function Brand() {
  return <span className="text-lg font-bold tracking-tight text-[rgb(var(--text))]">DefectLoupe</span>;
}

export function AppShell() {
  const { logout, user } = useAuth();
  const { preference, setPreference } = useTheme();
  const navigate = useNavigate();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const drawerRef = useRef<HTMLElement>(null);
  const drawerButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isDrawerOpen) {
      return;
    }

    drawerRef.current?.focus();
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsDrawerOpen(false);
        drawerButtonRef.current?.focus();
      }
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [isDrawerOpen]);

  async function handleLogout() {
    await logout();
    navigate("/login", { replace: true });
  }

  return (
    <div className="min-h-screen bg-[rgb(var(--canvas))]">
      <a className="sr-only z-[100] rounded bg-blue-600 px-3 py-2 text-sm font-semibold text-white focus:not-sr-only focus:fixed focus:left-4 focus:top-4" href="#main-content">
        Skip to main content
      </a>

      <aside className="fixed inset-y-0 hidden w-64 border-r bg-[rgb(var(--surface))] px-4 py-5 lg:block">
        <Brand />
        <div className="mt-8">
          <Navigation />
        </div>
      </aside>

      <div className="min-h-screen lg:pl-64">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b bg-[rgb(var(--surface))]/95 px-4 backdrop-blur lg:px-6">
          <div className="flex items-center gap-3">
            <button
              aria-controls="mobile-navigation"
              aria-expanded={isDrawerOpen}
              aria-label="Open navigation"
              className="rounded-lg border p-2 text-[rgb(var(--text))] lg:hidden"
              onClick={() => setIsDrawerOpen(true)}
              ref={drawerButtonRef}
              type="button"
            >
              <span aria-hidden="true">☰</span>
            </button>
            <div className="lg:hidden"><Brand /></div>
          </div>

          <div className="relative">
            <button
              aria-expanded={isUserMenuOpen}
              aria-haspopup="menu"
              className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm hover:bg-[rgb(var(--surface-muted))]"
              onClick={() => setIsUserMenuOpen((open) => !open)}
              type="button"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 font-semibold text-blue-700 dark:bg-blue-900 dark:text-blue-100" aria-hidden="true">
                {user?.email.slice(0, 1).toUpperCase()}
              </span>
              <span className="hidden max-w-48 truncate sm:block">{user?.email}</span>
            </button>
            {isUserMenuOpen && (
              <div className="absolute right-0 mt-2 w-64 rounded-xl border bg-[rgb(var(--surface))] p-2 shadow-lg" role="menu">
                <NavLink className="block rounded-lg px-3 py-2 text-sm hover:bg-[rgb(var(--surface-muted))]" onClick={() => setIsUserMenuOpen(false)} to="/settings" role="menuitem">
                  Account settings
                </NavLink>
                <label className="block px-3 pb-1 pt-2 text-xs font-semibold uppercase tracking-wide text-[rgb(var(--text-muted))]" htmlFor="theme-preference">
                  Theme
                </label>
                <select
                  className="mx-2 mb-2 block w-[calc(100%-1rem)] rounded-lg border bg-[rgb(var(--surface))] px-2 py-1.5 text-sm"
                  id="theme-preference"
                  onChange={(event) => setPreference(event.target.value as "light" | "dark" | "system")}
                  value={preference}
                >
                  <option value="system">System</option>
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                </select>
                <button className="block w-full rounded-lg px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 dark:text-red-300 dark:hover:bg-red-950/50" onClick={() => void handleLogout()} role="menuitem" type="button">
                  Sign out
                </button>
              </div>
            )}
          </div>
        </header>

        <main className="min-w-0" id="main-content" tabIndex={-1}>
          <Outlet />
        </main>
      </div>

      {isDrawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button aria-label="Close navigation" className="absolute inset-0 h-full w-full bg-slate-950/50" onClick={() => setIsDrawerOpen(false)} type="button" />
          <aside
            aria-label="Mobile navigation"
            aria-modal="true"
            className="relative h-full w-72 border-r bg-[rgb(var(--surface))] p-5 shadow-xl"
            id="mobile-navigation"
            ref={drawerRef}
            role="dialog"
            tabIndex={-1}
          >
            <div className="flex items-center justify-between">
              <Brand />
              <button aria-label="Close navigation" className="rounded-lg border p-2" onClick={() => setIsDrawerOpen(false)} type="button">×</button>
            </div>
            <div className="mt-8">
              <Navigation onNavigate={() => setIsDrawerOpen(false)} />
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
