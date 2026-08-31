import { Navigate, Route, Routes, useParams } from "react-router-dom";
import { AppShell } from "./components/layout/AppShell";
import { LegacyPage } from "./components/routing/LegacyPage";
import { ProtectedRoute } from "./components/routing/ProtectedRoute";
import LoginPage from "./pages/auth/LoginPage";
import SignupPage from "./pages/auth/SignupPage";
import VerifyEmailPage from "./pages/auth/VerifyEmailPage";
import ClientDetailPage from "./pages/clients/ClientDetailPage";
import ClientsPage from "./pages/clients/ClientsPage";
import DashboardPage from "./pages/dashboard/DashboardPage";
import InspectionsPage from "./pages/inspections/InspectionsPage";
import PropertiesPage from "./pages/properties/PropertiesPage";
import SettingsPage from "./pages/settings/SettingsPage";

function ClientDetailRoute() {
  const { clientId = "" } = useParams();
  return <LegacyPage><ClientDetailPage clientId={clientId} /></LegacyPage>;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route path="/verify-email" element={<VerifyEmailPage />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<AppShell />}>
          <Route index element={<Navigate replace to="/dashboard" />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/clients" element={<LegacyPage><ClientsPage /></LegacyPage>} />
          <Route path="/clients/:clientId" element={<ClientDetailRoute />} />
          <Route path="/properties" element={<LegacyPage><PropertiesPage /></LegacyPage>} />
          <Route path="/inspections" element={<LegacyPage><InspectionsPage /></LegacyPage>} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate replace to="/dashboard" />} />
    </Routes>
  );
}
