import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import './styles.css';

/* ── Layout ────────────────────────────────────────────────────── */
import Layout from './components/Layout';

/* ── Pages ─────────────────────────────────────────────────────── */
import LoginPage from './pages/auth/LoginPage';
import DashboardPage from './pages/dashboard/DashboardPage';
import ClientsPage from './pages/clients/ClientsPage';
import PropertiesPage from './pages/properties/PropertiesPage';
import InspectionsPage from './pages/inspections/InspectionsPage';
import AccountPage from './pages/account/AccountPage';

/* ── Auth gate ─────────────────────────────────────────────────── */
function AuthGate({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<'loading' | 'authed' | 'anon'>('loading');

  useEffect(() => {
    fetch('/auth/me', { credentials: 'include' })
      .then((r) => setStatus(r.ok ? 'authed' : 'anon'))
      .catch(() => setStatus('anon'));
  }, []);

  if (status === 'loading') {
    return (
      <main className="flex items-center justify-center min-h-screen bg-surface">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-text-muted text-sm">Loading DefectLoupe...</p>
        </div>
      </main>
    );
  }

  if (status === 'anon') {
    return <LoginPage onDone={() => setStatus('authed')} />;
  }

  return <>{children}</>;
}

/* ── App shell ─────────────────────────────────────────────────── */
function App() {
  const handleLogout = () => {
    window.location.reload();
  };

  return (
    <BrowserRouter>
      <AuthGate>
        <Layout onLogout={handleLogout}>
          <Routes>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/clients" element={<ClientsPage />} />
            <Route path="/properties" element={<PropertiesPage />} />
            <Route path="/inspections" element={<InspectionsPage />} />
            <Route path="/account" element={<AccountPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Layout>
      </AuthGate>
    </BrowserRouter>
  );
}

createRoot(document.getElementById('root')!).render(<App />);
