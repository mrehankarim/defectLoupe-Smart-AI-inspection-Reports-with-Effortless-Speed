import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Alert } from "../../components/ui/Alert";
import { api, ApiError } from "../../services/api";
import { AuthPageLayout } from "./AuthPageLayout";

type VerificationState = "idle" | "verifying" | "verified" | "failed";

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const [state, setState] = useState<VerificationState>(searchParams.get("token") ? "verifying" : "idle");
  const [message, setMessage] = useState("");
  const token = searchParams.get("token");
  const email = searchParams.get("email");

  useEffect(() => {
    if (!token) {
      return;
    }

    void api.get<{ message: string }>(`/auth/verify-email?token=${encodeURIComponent(token)}`)
      .then((response) => {
        setMessage(response.message);
        setState("verified");
      })
      .catch((error: ApiError) => {
        setMessage(error.detail || "This verification link is invalid or has expired.");
        setState("failed");
      });
  }, [token]);

  return (
    <AuthPageLayout>
      {state === "verifying" && <p className="text-sm text-[rgb(var(--text-muted))]" role="status">Verifying your email…</p>}
      {state === "verified" && (
        <>
          <h1 className="text-2xl font-bold tracking-tight">Email verified</h1>
          <p className="mt-2 text-sm text-[rgb(var(--text-muted))]">{message}</p>
          <Link className="btn-primary mt-6 w-full" to="/login">Continue to sign in</Link>
        </>
      )}
      {state === "failed" && (
        <>
          <h1 className="text-2xl font-bold tracking-tight">Verification unavailable</h1>
          <div className="mt-4"><Alert>{message}</Alert></div>
          <Link className="btn-secondary mt-6 w-full" to="/login">Return to sign in</Link>
        </>
      )}
      {state === "idle" && (
        <>
          <h1 className="text-2xl font-bold tracking-tight">Check your inbox</h1>
          <p className="mt-2 text-sm text-[rgb(var(--text-muted))]">
            {email ? `We sent a verification link to ${email}.` : "Use the verification link from your email to activate your account."}
          </p>
          <Link className="btn-secondary mt-6 w-full" to="/login">Return to sign in</Link>
        </>
      )}
    </AuthPageLayout>
  );
}
