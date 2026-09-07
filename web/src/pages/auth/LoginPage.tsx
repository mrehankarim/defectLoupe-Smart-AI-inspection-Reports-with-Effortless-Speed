import { useState, useRef, type FormEvent } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ApiError } from '../../services/api';
import Button from '../../components/Button';
import { InputField } from '../../components/FormFields';
import { AuthPageLayout, IconShield } from './AuthPageLayout';

function getErrorDetail(e: unknown) {
  return (e as ApiError).detail || 'Something went wrong. Please try again.';
}

export default function LoginPage({ onDone }: { onDone?: () => void } = {}) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login, register } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error'>('error');
  const [busy, setBusy] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  const nextUrl = searchParams.get('next');

  function fillDemoCredentials() {
    if (!formRef.current) return;
    const emailInput = formRef.current.querySelector('input[name="email"]') as HTMLInputElement;
    const passwordInput = formRef.current.querySelector('input[name="password"]') as HTMLInputElement;
    if (emailInput) {
      const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')!.set!;
      nativeInputValueSetter.call(emailInput, 'demo@defectloupe.com');
      emailInput.dispatchEvent(new Event('input', { bubbles: true }));
    }
    if (passwordInput) {
      const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')!.set!;
      nativeInputValueSetter.call(passwordInput, 'demo1234');
      passwordInput.dispatchEvent(new Event('input', { bubbles: true }));
    }
    setMessage('');
  }

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setMessage('');

    const data = Object.fromEntries(new FormData(e.currentTarget)) as Record<string, string>;

    try {
      if (mode === 'login') {
        await login({
          email: (data.email || '').trim(),
          password: data.password || '',
        });
        if (onDone) {
          onDone();
        } else {
          navigate(nextUrl || '/dashboard', { replace: true });
        }
      } else {
        await register({
          email: (data.email || '').trim(),
          password: data.password || '',
          first_name: (data.first_name || '').trim(),
          last_name: (data.last_name || '').trim(),
          phone_number: (data.phone_number || '').trim() || undefined,
        });
        setMessageType('success');
        setMessage('Account created! Please sign in with your credentials.');
        setMode('login');
      }
    } catch (err) {
      setMessageType('error');
      setMessage(getErrorDetail(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthPageLayout>
      {/* Brand Header Badge */}
      <div className="flex flex-col items-center mb-6">
        <div
          className="w-12 h-12 rounded-2xl flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-3"
          style={{
            background: "rgba(16,185,129,0.18)",
            border: "1px solid rgba(16,185,129,0.35)",
            boxShadow: "0 0 24px rgba(16,185,129,0.25)",
          }}
        >
          <IconShield />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          {mode === 'login' ? 'Welcome back' : 'Create your account'}
        </h1>
        <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
          {mode === 'login'
            ? 'Sign in to your DefectLoupe workspace'
            : 'Get started with a free inspector account'}
        </p>
      </div>

      <form ref={formRef} onSubmit={submit} className="flex flex-col gap-4">
        {mode === 'register' && (
          <div className="grid grid-cols-2 gap-3">
            <InputField required name="first_name" label="First name" placeholder="Ali" />
            <InputField required name="last_name" label="Last name" placeholder="Khan" />
          </div>
        )}

        <InputField
          required
          name="email"
          type="email"
          label="Email address"
          placeholder="you@example.com"
          autoComplete="email"
        />

        <InputField
          required
          name="password"
          type="password"
          label="Password"
          placeholder="At least 8 characters"
          minLength={8}
          autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
        />

        {mode === 'register' && (
          <InputField
            name="phone_number"
            label="Phone number"
            placeholder="+92-300-1234567 (optional)"
          />
        )}

        <Button type="submit" disabled={busy} className="w-full mt-2 py-3 text-sm font-bold">
          {busy ? 'Please wait...' : mode === 'login' ? 'Sign in' : 'Create account'}
        </Button>

        {mode === 'login' && (
          <button
            type="button"
            onClick={fillDemoCredentials}
            className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/25 hover:bg-emerald-500/20 transition-colors cursor-pointer flex items-center justify-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
            Fill Demo Credentials
          </button>
        )}

        {message && (
          <div
            className={`px-4 py-3 rounded-xl text-xs font-semibold ${
              messageType === 'error'
                ? 'bg-rose-500/15 border border-rose-500/30 text-rose-700 dark:text-rose-300'
                : 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300'
            }`}
            role="alert"
          >
            {message}
          </div>
        )}

        <p className="text-xs text-slate-600 dark:text-slate-400 text-center mt-3 font-medium">
          {mode === 'login' ? 'New to DefectLoupe? ' : 'Already have an account? '}
          <button
            type="button"
            onClick={() => {
              setMode(mode === 'login' ? 'register' : 'login');
              setMessage('');
            }}
            className="text-emerald-700 dark:text-emerald-400 font-bold hover:underline bg-transparent border-none cursor-pointer p-0"
          >
            {mode === 'login' ? 'Create account' : 'Sign in'}
          </button>
        </p>
      </form>
    </AuthPageLayout>
  );
}
