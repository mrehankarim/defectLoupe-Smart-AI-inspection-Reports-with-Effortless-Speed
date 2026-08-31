import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export function ProtectedRoute() {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[rgb(var(--canvas))] text-sm text-[rgb(var(--text-muted))]" role="status">
        Restoring your session…
      </div>
    );
  }

  if (!user) {
    const next = `${location.pathname}${location.search}`;
    return <Navigate replace to={`/login?next=${encodeURIComponent(next)}`} />;
  }

  return <Outlet />;
}
