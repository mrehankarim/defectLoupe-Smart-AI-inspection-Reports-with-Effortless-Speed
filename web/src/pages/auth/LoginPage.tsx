import { FormEvent, useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { ApiError } from "../../services/api";
import { Alert } from "../../components/ui/Alert";
import { Button } from "../../components/ui/Button";
import { FormField } from "../../components/ui/FormField";
import { AuthPageLayout, IconShield } from "./AuthPageLayout";

const IconMail = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="4" width="20" height="16" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
  </svg>
);

const IconLock = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);

const IconArrow = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12h14M12 5l7 7-7 7" />
  </svg>
);

function safeNext(value: string | null) {
  return value?.startsWith("/") && !value.startsWith("//") ? value : "/dashboard";
}

export default function LoginPage() {
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const next = safeNext(searchParams.get("next"));

  useEffect(() => {
    if (user) {
      navigate(next, { replace: true });
    }
  }, [navigate, next, user]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);
    try {
      await login({ email, password });
      navigate(next, { replace: true });
    } catch (requestError) {
      setError((requestError as ApiError).detail || "Unable to sign in. Check your email and password.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthPageLayout>
      {/* Brand Header */}
      <div className="flex flex-col items-center mb-6">
        <div
          className="w-12 h-12 rounded-2xl flex items-center justify-center text-indigo-500 dark:text-indigo-300 mb-3"
          style={{
            background: "rgba(99,102,241,0.22)",
            border: "1px solid rgba(99,102,241,0.40)",
            boxShadow: "0 0 24px rgba(99,102,241,0.35), inset 0 1px 0 rgba(255,255,255,0.12)",
          }}
        >
          <IconShield />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Welcome back</h1>
        <p className="text-xs text-slate-500 mt-1">Sign in to manage your inspections</p>
      </div>

      <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
        {error && <Alert variant="error">{error}</Alert>}

        <FormField
          autoComplete="email"
          id="email"
          label="Email address"
          leftIcon={<IconMail />}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="ali@inspector.com"
          required
          type="email"
          value={email}
        />

        <FormField
          autoComplete="current-password"
          id="password"
          label="Password"
          leftIcon={<IconLock />}
          minLength={8}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="••••••••"
          required
          rightIcon={
            <button
              aria-label={showPassword ? "Hide password" : "Show password"}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              onClick={() => setShowPassword(!showPassword)}
              type="button"
            >
              {showPassword ? (
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858-5.908a10.025 10.025 0 012.122-.363c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21M3 3l18 18" />
                </svg>
              ) : (
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              )}
            </button>
          }
          type={showPassword ? "text" : "password"}
          value={password}
        />

        <Button className="w-full font-bold mt-2 py-3" isLoading={isSubmitting} rightIcon={<IconArrow />} size="lg" type="submit">
          {isSubmitting ? "Signing in…" : "Sign In"}
        </Button>
      </form>

      <p className="text-center text-[13px] text-slate-500 mt-6">
        New to DefectLoupe?{" "}
        <Link to="/signup" className="text-indigo-500 dark:text-indigo-400 hover:underline font-medium">
          Create an account
        </Link>
      </p>
    </AuthPageLayout>
  );
}
