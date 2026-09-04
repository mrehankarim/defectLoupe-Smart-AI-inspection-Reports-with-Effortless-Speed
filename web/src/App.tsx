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
import ProfilePage from "./pages/settings/ProfilePage";
import SettingsPage from "./pages/settings/SettingsPage";
import VerifyReportPage from "./pages/reports/VerifyReportPage";
import ReportViewerPage from "./pages/reports/ReportViewerPage";
import KnowledgeBasePage from "./pages/reports/KnowledgeBasePage";
import LandingPage from "./pages/landing/LandingPage";

function ClientDetailRoute() {
  const { clientId = "" } = useParams();
  return <LegacyPage><ClientDetailPage clientId={clientId} /></LegacyPage>;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route path="/verify-email" element={<VerifyEmailPage />} />
      <Route path="/verify/:verify_token" element={<VerifyReportPage />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<AppShell />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/clients" element={<LegacyPage><ClientsPage /></LegacyPage>} />
          <Route path="/clients/:clientId" element={<ClientDetailRoute />} />
          <Route path="/properties" element={<LegacyPage><PropertiesPage /></LegacyPage>} />
          <Route path="/inspections" element={<LegacyPage><InspectionsPage /></LegacyPage>} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/reports" element={<LegacyPage><ReportViewerPage /></LegacyPage>} />
          <Route path="/knowledge-base" element={<LegacyPage><KnowledgeBasePage /></LegacyPage>} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate replace to="/dashboard" />} />
    </Routes>
  );
}
