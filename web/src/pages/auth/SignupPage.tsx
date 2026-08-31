import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { ApiError } from "../../services/api";
import { Alert } from "../../components/ui/Alert";
import { Button } from "../../components/ui/Button";
import { FormField } from "../../components/ui/FormField";
import { AuthPageLayout } from "./AuthPageLayout";

export default function SignupPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  function updateField(field: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setIsSubmitting(true);
    try {
      await register({
        email: form.email,
        password: form.password,
        first_name: form.firstName,
        last_name: form.lastName,
      });
      navigate(`/verify-email?email=${encodeURIComponent(form.email)}`, { replace: true });
    } catch (requestError) {
      setError((requestError as ApiError).detail || "Unable to create your account.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthPageLayout>
      <h1 className="text-2xl font-bold tracking-tight">Create your account</h1>
      <p className="mt-2 text-sm text-[rgb(var(--text-muted))]">Start organizing your inspection work in one place.</p>
      <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
        {error && <Alert>{error}</Alert>}
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField autoComplete="given-name" id="first-name" label="First name" onChange={(event) => updateField("firstName", event.target.value)} required value={form.firstName} />
          <FormField autoComplete="family-name" id="last-name" label="Last name" onChange={(event) => updateField("lastName", event.target.value)} required value={form.lastName} />
        </div>
        <FormField autoComplete="email" id="email" label="Email" onChange={(event) => updateField("email", event.target.value)} required type="email" value={form.email} />
        <FormField autoComplete="new-password" hint="Use at least 8 characters." id="password" label="Password" minLength={8} onChange={(event) => updateField("password", event.target.value)} required type="password" value={form.password} />
        <FormField autoComplete="new-password" error={form.confirmPassword && form.confirmPassword !== form.password ? "Passwords do not match." : undefined} id="confirm-password" label="Confirm password" minLength={8} onChange={(event) => updateField("confirmPassword", event.target.value)} required type="password" value={form.confirmPassword} />
        <Button className="w-full" disabled={isSubmitting} type="submit">{isSubmitting ? "Creating account…" : "Create account"}</Button>
      </form>
      <p className="mt-6 text-center text-sm text-[rgb(var(--text-muted))]">
        Already have an account? <Link className="font-semibold text-blue-600 hover:underline dark:text-blue-300" to="/login">Sign in</Link>
      </p>
    </AuthPageLayout>
  );
}
