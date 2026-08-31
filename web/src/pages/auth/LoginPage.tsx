import { FormEvent, useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { ApiError } from "../../services/api";
import { Alert } from "../../components/ui/Alert";
import { Button } from "../../components/ui/Button";
import { FormField } from "../../components/ui/FormField";
import { AuthPageLayout } from "./AuthPageLayout";

function safeNext(value: string | null) {
  return value?.startsWith("/") && !value.startsWith("//") ? value : "/dashboard";
}

export default function LoginPage() {
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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
      <h1 className="text-2xl font-bold tracking-tight">Welcome back</h1>
      <p className="mt-2 text-sm text-[rgb(var(--text-muted))]">Sign in to manage your inspections.</p>
      <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
        {error && <Alert>{error}</Alert>}
        <FormField autoComplete="email" id="email" label="Email" onChange={(event) => setEmail(event.target.value)} required type="email" value={email} />
        <FormField autoComplete="current-password" id="password" label="Password" minLength={8} onChange={(event) => setPassword(event.target.value)} required type="password" value={password} />
        <Button className="w-full" disabled={isSubmitting} type="submit">{isSubmitting ? "Signing in…" : "Sign in"}</Button>
      </form>
      <p className="mt-6 text-center text-sm text-[rgb(var(--text-muted))]">
        New to DefectLoupe? <Link className="font-semibold text-blue-600 hover:underline dark:text-blue-300" to="/signup">Create an account</Link>
      </p>
    </AuthPageLayout>
  );
}
