import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
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

const IconUser = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
  </svg>
);

const IconCheck = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const IconArrow = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12h14M12 5l7 7-7 7" />
  </svg>
);

type InspectorType = "solo" | "agency";

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
  const [inspectorType, setInspectorType] = useState<InspectorType>("solo");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  function updateField(field: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  const strength = (() => {
    if (!form.password) return 0;
    let s = 0;
    if (form.password.length >= 8) s++;
    if (/[A-Z]/.test(form.password)) s++;
    if (/[0-9]/.test(form.password)) s++;
    if (/[^A-Za-z0-9]/.test(form.password)) s++;
    return s;
  })();

  const strengthColor = ["#ef4444", "#f97316", "#eab308", "#22c55e"][strength - 1] ?? "#64748b";
  const strengthLabel = ["", "Weak", "Fair", "Good", "Strong"][strength];

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
      {/* Brand Header Badge */}
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
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Create your account</h1>
        <p className="text-xs text-slate-500 mt-1">Join DefectLoupe as an inspector</p>
      </div>

      <form className="flex flex-col gap-4" onSubmit={handleSubmit} noValidate>
        {error && <Alert variant="error">{error}</Alert>}

        {/* Inspector type selector */}
        <div>
          <p className="text-[11px] font-mono font-medium tracking-[0.06em] text-slate-500 dark:text-slate-400 uppercase mb-2">Account type</p>
          <div className="grid grid-cols-2 gap-2">
            {(["solo", "agency"] as InspectorType[]).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setInspectorType(type)}
                style={{
                  background: inspectorType === type ? "rgba(99,102,241,0.18)" : "var(--input-bg)",
                  border: `1px solid ${inspectorType === type ? "rgba(99,102,241,0.45)" : "var(--input-border)"}`,
                  transition: "all 180ms ease",
                }}
                className="flex flex-col items-center gap-1 py-3 rounded-xl cursor-pointer relative"
              >
                <span className={`text-[11px] font-mono font-semibold tracking-wider uppercase ${inspectorType === type ? "text-indigo-600 dark:text-indigo-300" : "text-slate-500"}`}>
                  {type === "solo" ? "Solo Inspector" : "Agency Member"}
                </span>
                <span className="text-[11px] text-slate-500">
                  {type === "solo" ? "Independent" : "Part of a team"}
                </span>
                {inspectorType === type && (
                  <span className="w-3.5 h-3.5 rounded-full bg-indigo-500 flex items-center justify-center text-white mt-0.5">
                    <IconCheck />
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <FormField
            id="first-name"
            label="First name"
            leftIcon={<IconUser />}
            onChange={(event) => updateField("firstName", event.target.value)}
            placeholder="Ali"
            required
            value={form.firstName}
          />
          <FormField
            id="last-name"
            label="Last name"
            onChange={(event) => updateField("lastName", event.target.value)}
            placeholder="Khan"
            required
            value={form.lastName}
          />
        </div>

        <FormField
          autoComplete="email"
          id="email"
          label="Email address"
          leftIcon={<IconMail />}
          onChange={(event) => updateField("email", event.target.value)}
          placeholder="ali@inspector.com"
          required
          type="email"
          value={form.email}
        />

        <div>
          <FormField
            autoComplete="new-password"
            id="password"
            label="Password"
            leftIcon={<IconLock />}
            minLength={8}
            onChange={(event) => updateField("password", event.target.value)}
            placeholder="Min 8 characters"
            required
            type="password"
            value={form.password}
          />
          {form.password && (
            <div className="flex items-center gap-2 mt-1.5">
              <div className="flex gap-1 flex-1">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="h-1 flex-1 rounded-full transition-all duration-300"
                    style={{ background: i <= strength ? strengthColor : "rgba(255,255,255,0.08)" }}
                  />
                ))}
              </div>
              <span className="text-[11px] font-mono font-semibold" style={{ color: strengthColor }}>
                {strengthLabel}
              </span>
            </div>
          )}
        </div>

        <FormField
          autoComplete="new-password"
          error={form.confirmPassword && form.confirmPassword !== form.password ? "Passwords do not match" : undefined}
          id="confirm-password"
          label="Confirm password"
          leftIcon={<IconLock />}
          minLength={8}
          onChange={(event) => updateField("confirmPassword", event.target.value)}
          placeholder="••••••••"
          required
          type="password"
          value={form.confirmPassword}
        />

        <Button className="w-full font-bold mt-2 py-3" isLoading={isSubmitting} rightIcon={<IconArrow />} size="lg" type="submit">
          {isSubmitting ? "Creating account…" : "Create Account"}
        </Button>
      </form>

      <p className="text-center text-[13px] text-slate-500 mt-6">
        Already have an account?{" "}
        <Link to="/login" className="text-indigo-500 dark:text-indigo-400 hover:underline font-medium">
          Sign in
        </Link>
      </p>
    </AuthPageLayout>
  );
}
