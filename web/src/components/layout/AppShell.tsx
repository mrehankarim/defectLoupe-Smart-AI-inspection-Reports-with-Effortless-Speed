import { useEffect, useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import { CommandPalette } from "./CommandPalette";
import { Footer } from "./Footer";
import { QuickMegaMenu } from "./QuickMegaMenu";
import LogoIcon from "../LogoIcon";

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

const IconReport = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
  </svg>
);

const IconBrain = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2a5 5 0 0 1 5 5c0 1.5-.7 2.8-1.8 3.7.8.8 1.8 1.8 1.8 3.3a4.5 4.5 0 0 1-4.5 4.5H12" />
    <path d="M12 22a5 5 0 0 1-5-5c0-1.5.7-2.8 1.8-3.7-.8-.8-1.8-1.8-1.8-3.3A4.5 4.5 0 0 1 11.5 5.5H12" />
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
  <LogoIcon size={18} />
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [cmdOpen, setCmdOpen] = useState(false);
  const [megaMenuOpen, setMegaMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  function toggleTheme() {
    setPreference(resolvedTheme === "dark" ? "light" : "dark");
  }

  async function handleLogout() {
    await logout();
    navigate("/login", { replace: true });
  }

  const userInitials = user?.email ? user.email.slice(0, 2).toUpperCase() : "IN";
  const isDark = resolvedTheme === "dark";

  return (
    <div
      className="flex flex-col min-h-screen text-[rgb(var(--text))]"
      style={{
        background: isDark
          ? "radial-gradient(ellipse 80% 50% at 50% -10%, rgba(16,185,129,0.14) 0%, rgba(6,182,212,0.04) 50%, transparent 80%), #07090e"
          : "radial-gradient(ellipse 80% 50% at 50% -10%, rgba(16,185,129,0.06) 0%, transparent 60%), #f8fafc",
        fontFamily: "'Outfit', system-ui, sans-serif",
      }}
    >
      <Noise />
      <CommandPalette isOpen={cmdOpen} onClose={() => setCmdOpen(false)} />
      <QuickMegaMenu
        isOpen={megaMenuOpen}
        onClose={() => setMegaMenuOpen(false)}
        onOpenSearch={() => setCmdOpen(true)}
        isDark={isDark}
      />

      {/* Top Floating Command Navigation Bar */}
      <header
        className="sticky top-0 z-30 w-full border-b backdrop-blur-xl transition-colors"
        style={{
          background: isDark ? "rgba(7, 9, 14, 0.88)" : "rgba(255, 255, 255, 0.92)",
          borderColor: isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(226, 232, 240, 0.9)",
          boxShadow: isDark ? "0 4px 30px rgba(0, 0, 0, 0.4)" : "0 2px 10px rgba(0, 0, 0, 0.03)",
        }}
      >
        <div className="w-full px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          {/* FAR LEFT: Brand Logo */}
          <NavLink to="/" className="flex items-center gap-2.5 text-decoration-none group shrink-0">
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center text-emerald-600 dark:text-emerald-400 font-bold transition-all group-hover:scale-105"
              style={{
                background: isDark ? "rgba(16,185,129,0.18)" : "rgba(16,185,129,0.12)",
                border: "1px solid rgba(16,185,129,0.35)",
                boxShadow: "0 0 16px rgba(16,185,129,0.20)",
              }}
            >
              <IconShield />
            </div>
            <div className="flex flex-col">
              <span
                className="text-sm font-bold tracking-tight flex items-center gap-1.5"
                style={{ color: isDark ? "#f8fafc" : "#0f172a" }}
              >
                DefectLoupe
                <span className="text-[9px] font-mono uppercase px-1.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-semibold">
                  Pro
                </span>
              </span>
            </div>
          </NavLink>

          {/* CENTER: Desktop Nav Links */}
          <nav className="hidden lg:flex items-center justify-center gap-1 flex-1 px-4">
            {[
              { to: "/dashboard", label: "Dashboard", icon: <IconGrid /> },
              { to: "/clients", label: "Clients", icon: <IconUsers /> },
              { to: "/properties", label: "Properties", icon: <IconHome /> },
              { to: "/inspections", label: "Inspections", icon: <IconClipboard /> },
              { to: "/reports", label: "Reports & PDF", icon: <IconReport /> },
              { to: "/knowledge-base", label: "AI Base", icon: <IconBrain /> },
            ].map(({ to, label, icon }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold tracking-wide transition-all ${
                    isActive
                      ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 shadow-sm"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800/60 border border-transparent"
                  }`
                }
              >
                {icon}
                {label}
              </NavLink>
            ))}
          </nav>

          {/* FAR RIGHT: Search, Theme, Notifications, Account Icon */}
          <div className="flex items-center gap-2.5 shrink-0">
            {/* Elegant Menu Launcher (Three Lines Icon) */}
            <button
              onClick={() => setMegaMenuOpen(true)}
              className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 transition-all cursor-pointer border shadow-xs group"
              style={{
                background: isDark
                  ? "rgba(16, 185, 129, 0.08)"
                  : "rgba(16, 185, 129, 0.06)",
                borderColor: isDark
                  ? "rgba(16, 185, 129, 0.25)"
                  : "rgba(16, 185, 129, 0.3)",
              }}
              type="button"
              title="Open Navigation Hub & Tools"
            >
              {/* Three Lines / Hamburger Icon with micro-animation */}
              <div className="flex flex-col justify-center items-center gap-[3px] w-4 h-4">
                <span className="w-4 h-[2px] rounded-full bg-emerald-600 dark:bg-emerald-400 group-hover:w-3 transition-all duration-200" />
                <span className="w-3 h-[2px] rounded-full bg-emerald-600 dark:bg-emerald-400 group-hover:w-4 transition-all duration-200" />
                <span className="w-4 h-[2px] rounded-full bg-emerald-600 dark:bg-emerald-400 group-hover:w-2.5 transition-all duration-200" />
              </div>
              <span className="font-semibold text-slate-800 dark:text-slate-100">Menu</span>
            </button>

            {/* Theme Toggle Button */}
            <button
              aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
              className="w-9 h-9 rounded-xl flex items-center justify-center transition-colors cursor-pointer text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 border border-transparent bg-transparent hover:bg-slate-200/60 dark:hover:bg-slate-800/60"
              onClick={toggleTheme}
              title={`Switch to ${isDark ? "light" : "dark"} mode`}
              type="button"
            >
              {isDark ? (
                <svg className="h-4 w-4 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              ) : (
                <svg className="h-4 w-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              )}
            </button>

            {/* User Account Icon Dropdown */}
            <div className="relative">
              <button
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex items-center gap-2 p-1 rounded-xl hover:bg-slate-200/60 dark:hover:bg-slate-800/40 transition-all cursor-pointer"
                type="button"
                title="Account Menu"
              >
                <div
                  className="w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold text-emerald-700 dark:text-emerald-400 shrink-0"
                  style={{
                    background: isDark ? "rgba(16,185,129,0.18)" : "rgba(16,185,129,0.12)",
                    border: "1px solid rgba(16,185,129,0.35)",
                  }}
                >
                  {userInitials}
                </div>
              </button>

              {/* User Dropdown Menu */}
              {userDropdownOpen && (
                <div
                  className="absolute right-0 mt-2 w-56 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-2 z-50"
                  onClick={() => setUserDropdownOpen(false)}
                >
                  <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800/80 mb-1">
                    <p className="text-xs font-bold text-slate-900 dark:text-slate-200 truncate">{user?.email || "Inspector Profile"}</p>
                    <p className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400">Solo Inspector</p>
                  </div>
                  <NavLink
                    to="/profile"
                    className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    <IconUser /> Profile Settings
                  </NavLink>
                  <NavLink
                    to="/settings"
                    className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    <IconSettings /> Workspace Config
                  </NavLink>
                  <button
                    onClick={() => void handleLogout()}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors text-left cursor-pointer"
                    type="button"
                  >
                    <IconLogout /> Sign Out
                  </button>
                </div>
              )}
            </div>

            {/* Mobile Menu Toggle */}
            <button
              className="lg:hidden p-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 cursor-pointer"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              type="button"
            >
              <IconMenu />
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-slate-800 bg-slate-900/95 p-4 space-y-2">
            {[
              { to: "/dashboard", label: "Dashboard", icon: <IconGrid /> },
              { to: "/clients", label: "Clients", icon: <IconUsers /> },
              { to: "/properties", label: "Properties", icon: <IconHome /> },
              { to: "/inspections", label: "Inspections", icon: <IconClipboard /> },
              { to: "/reports", label: "Reports & PDF", icon: <IconReport /> },
              { to: "/knowledge-base", label: "AI Knowledge Base", icon: <IconBrain /> },
              { to: "/profile", label: "Profile", icon: <IconUser /> },
              { to: "/settings", label: "Settings", icon: <IconSettings /> },
            ].map(({ to, label, icon }) => (
              <NavLink
                key={to}
                to={to}
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-300 hover:bg-slate-800"
              >
                {icon}
                {label}
              </NavLink>
            ))}
          </div>
        )}
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 relative z-10">
        <Outlet />
      </main>

      {/* Modern Footer */}
      <Footer />
    </div>
  );
}
