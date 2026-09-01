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
    if (!token) return;

    void api
      .get<{ message: string }>(`/auth/verify-email?token=${encodeURIComponent(token)}`)
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
      {state === "verifying" && (
        <div className="text-center py-6">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400">
            <svg className="h-7 w-7 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          </div>
          <h2 className="mt-4 text-xl font-bold tracking-tight text-slate-900 dark:text-white">Verifying email...</h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Communicating with auth service</p>
        </div>
      )}

      {state === "verified" && (
        <div className="text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
            <svg className="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="mt-4 text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Email Verified!</h1>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{message}</p>
          <Link className="btn-primary mt-6 w-full font-bold justify-center" to="/login">
            Continue to Sign In
          </Link>
        </div>
      )}

      {state === "failed" && (
        <div className="text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400">
            <svg className="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h1 className="mt-4 text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Verification Failed</h1>
          <div className="mt-4 text-left">
            <Alert variant="error">{message}</Alert>
          </div>
          <Link className="btn-secondary mt-6 w-full font-semibold justify-center" to="/login">
            Return to Sign In
          </Link>
        </div>
      )}

      {state === "idle" && (
        <div className="text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400">
            <svg className="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h1 className="mt-4 text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Check Your Email</h1>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            {email ? `We sent a verification link to ${email}.` : "Use the verification link sent to your email to activate your account."}
          </p>
          <div className="mt-4 rounded-xl border border-indigo-100 bg-indigo-50/60 dark:border-indigo-900/40 dark:bg-indigo-950/30 p-3 text-left">
            <p className="text-xs text-indigo-800 dark:text-indigo-300">
              💡 <strong>Dev Note:</strong> In local testing, if `DEV_AUTO_VERIFY=true` is enabled, your account is already verified and you can log in immediately.
            </p>
          </div>
          <Link className="btn-primary mt-6 w-full font-bold justify-center" to="/login">
            Proceed to Sign In
          </Link>
        </div>
      )}
    </AuthPageLayout>
  );
}
