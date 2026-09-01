import { useEffect, useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";

const IconGrid = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
    <rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
  </svg>
);

const IconUsers = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

const IconHome = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" />
  </svg>
);

const IconClipboard = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
    <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
  </svg>
);

const IconUser = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const IconSettings = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </svg>
);

const IconLogout = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <polyline points="16 17 21 12 16 7" />
    <line x1="21" y1="12" x2="9" y2="12" />
  </svg>
);

const IconShield = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
);

const IconBell = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
  </svg>
);

const IconMenu = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" />
  </svg>
);

function Noise() {
  return (
    <svg className="pointer-events-none fixed inset-0 w-full h-full opacity-[0.032]" style={{ zIndex: 0 }}>
      <filter id="n"><feTurbulence type="fractalNoise" baseFrequency="0.68" numOctaves="4" stitchTiles="stitch" /><feColorMatrix type="saturate" values="0" /></filter>
      <rect width="100%" height="100%" filter="url(#n)" />
    </svg>
  );
}

interface NavItemProps { to: string; label: string; icon: React.ReactNode; end?: boolean; onClick?: () => void }
function NavItem({ to, label, icon, end, onClick }: NavItemProps) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  return (
    <NavLink
      to={to}
      end={end}
      onClick={onClick}
      style={({ isActive }) => ({
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "10px 14px",
        borderRadius: 14,
        fontSize: 14,
        fontWeight: 600,
        letterSpacing: "-0.01em",
        color: isActive
          ? isDark ? "rgba(165,167,255,1)" : "#4338ca"
          : isDark ? "rgba(148,163,184,0.85)" : "#334155",
        background: isActive
          ? isDark ? "rgba(99,102,241,0.18)" : "rgba(99,102,241,0.12)"
          : "transparent",
        border: `1px solid ${isActive ? (isDark ? "rgba(99,102,241,0.30)" : "rgba(99,102,241,0.35)") : "transparent"}`,
        backdropFilter: isActive ? "blur(10px)" : "none",
        transition: "all 180ms ease",
        textDecoration: "none",
      })}
    >
      {icon}
      {label}
    </NavLink>
  );
}

export function AppShell() {
  const { logout, user } = useAuth();
  const { resolvedTheme, setPreference } = useTheme();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  function toggleTheme() {
    setPreference(resolvedTheme === "dark" ? "light" : "dark");
  }

  async function handleLogout() {
    await logout();
    navigate("/login", { replace: true });
  }

  const userInitials = user?.email ? user.email.slice(0, 2).toUpperCase() : "IN";

  return (
    <div
      className="flex h-full min-h-screen text-[rgb(var(--text))]"
      style={{
        background: resolvedTheme === "dark"
          ? "radial-gradient(ellipse 80% 50% at 20% -10%, rgba(99,102,241,0.16) 0%, transparent 55%), #0b0d14"
          : "radial-gradient(ellipse 80% 50% at 20% -10%, rgba(99,102,241,0.08) 0%, transparent 55%), #f8fafc",
        fontFamily: "'Outfit', system-ui, sans-serif",
      }}
    >
      <Noise />

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 h-full z-30 flex flex-col transition-transform duration-300 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
        style={{
          width: 240,
          background: "var(--glass-bg)",
          borderRight: "1px solid var(--glass-border)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
        }}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 py-6 border-b border-white/[0.06]">
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center text-indigo-600 dark:text-indigo-300"
            style={{
              background: resolvedTheme === "dark" ? "rgba(99,102,241,0.22)" : "rgba(99,102,241,0.15)",
              border: "1px solid rgba(99,102,241,0.40)",
              boxShadow: "0 0 16px rgba(99,102,241,0.25)",
            }}
          >
            <IconShield />
          </div>
          <div>
            <p className="text-[14px] font-bold tracking-[-0.02em] text-slate-900 dark:text-slate-100">DefectLoupe</p>
            <p className="text-[10px] font-mono text-slate-500 dark:text-slate-500 tracking-wide font-medium">Inspector Suite</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-5 flex flex-col gap-1">
          <p className="text-[10px] font-mono font-bold tracking-[0.12em] uppercase text-slate-400 dark:text-slate-500 px-2 mb-2">Workspace</p>
          <NavItem to="/dashboard" label="Dashboard" icon={<IconGrid />} onClick={() => setSidebarOpen(false)} />
          <NavItem to="/clients" label="Clients" icon={<IconUsers />} onClick={() => setSidebarOpen(false)} />
          <NavItem to="/properties" label="Properties" icon={<IconHome />} onClick={() => setSidebarOpen(false)} />
          <NavItem to="/inspections" label="Inspections" icon={<IconClipboard />} onClick={() => setSidebarOpen(false)} />
          <NavItem to="/profile" label="Profile" icon={<IconUser />} onClick={() => setSidebarOpen(false)} />
          <NavItem to="/settings" label="Settings" icon={<IconSettings />} onClick={() => setSidebarOpen(false)} />
        </nav>

        {/* User row */}
        <div className="px-3 py-4 border-t border-white/[0.06]">
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-[13px] font-bold text-indigo-700 dark:text-indigo-200 shrink-0"
              style={{
                background: resolvedTheme === "dark" ? "rgba(99,102,241,0.25)" : "rgba(99,102,241,0.18)",
                border: "1px solid rgba(99,102,241,0.40)",
              }}
            >
              {userInitials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-bold text-slate-900 dark:text-slate-200 truncate">{user?.email.split("@")[0] || "Inspector"}</p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate font-medium">Solo Inspector</p>
            </div>
            <button
              onClick={() => void handleLogout()}
              className="text-slate-400 hover:text-red-500 dark:hover:text-red-400 transition-colors p-1 cursor-pointer"
              title="Sign out"
              type="button"
            >
              <IconLogout />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Container */}
      <div className="flex-1 flex flex-col lg:ml-[240px]">
        {/* Top Header Bar */}
        <header
          className="sticky top-0 z-20 flex items-center justify-between px-8 py-4"
          style={{
            background: resolvedTheme === "dark" ? "rgba(11,13,20,0.7)" : "rgba(255,255,255,0.7)",
            borderBottom: "1px solid var(--glass-border)",
            backdropFilter: "blur(16px)",
            WebkitBackdropFilter: "blur(16px)",
          }}
        >
          <button className="lg:hidden text-slate-400 cursor-pointer" onClick={() => setSidebarOpen(!sidebarOpen)} type="button">
            <IconMenu />
          </button>
          <div />

          <div className="flex items-center gap-3">
            {/* Theme Toggle Button */}
            <button
              aria-label={`Switch to ${resolvedTheme === "dark" ? "light" : "dark"} mode`}
              className="w-9 h-9 rounded-xl flex items-center justify-center transition-colors cursor-pointer"
              style={{ background: "var(--input-bg)", border: "1px solid var(--input-border)" }}
              onClick={toggleTheme}
              title={`Switch to ${resolvedTheme === "dark" ? "light" : "dark"} mode`}
              type="button"
            >
              {resolvedTheme === "dark" ? (
                <svg className="h-4 w-4 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              ) : (
                <svg className="h-4 w-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              )}
            </button>

            {/* Notification Indicator */}
            <button
              className="relative w-9 h-9 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
              style={{ background: "var(--input-bg)", border: "1px solid var(--input-border)" }}
              type="button"
            >
              <IconBell />
              <span
                className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full"
                style={{ background: "#6366f1", boxShadow: "0 0 6px rgba(99,102,241,0.8)" }}
              />
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto relative z-10 p-6 lg:p-8">
          <Outlet />
        </main>
      </div>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}
