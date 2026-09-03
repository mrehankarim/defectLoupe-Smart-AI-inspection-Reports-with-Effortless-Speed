import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, ApiError } from '../../services/api';
import Button from '../../components/Button';
import { InputField } from '../../components/FormFields';

function error(e: unknown) {
  return (e as ApiError).detail || 'Something went wrong. Please try again.';
}

export default function LoginPage({ onDone }: { onDone?: () => void } = {}) {
  const navigate = useNavigate();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error'>('error');
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setMessage('');

    const data = Object.fromEntries(new FormData(e.currentTarget));
    const filtered = Object.fromEntries(
      Object.entries(data).filter(([, v]) => v !== '')
    );

    try {
      const res = await fetch(
        mode === 'login' ? '/auth/login' : '/auth/register',
        {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(filtered),
        }
      );

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw { detail: body.detail || 'Request failed' };
      }

      if (mode === 'login') {
        if (onDone) {
          onDone();
        } else {
          navigate('/dashboard');
        }
      } else {
        setMessageType('success');
        setMessage('Account created. Verify your email address, then sign in.');
        setMode('login');
      }
    } catch (e) {
      setMessageType('error');
      setMessage(error(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="min-h-screen flex">
      {/* Left panel — branding */}
      <div className="hidden lg:flex flex-1 flex-col justify-center px-16 bg-brand-800 text-white">
        <div className="max-w-md">
          <p className="text-[11px] tracking-[0.13em] font-extrabold text-brand-200 uppercase mb-2">
            PROPERTY INSPECTIONS
          </p>
          <h1 className="text-5xl font-extrabold leading-tight mb-4">
            Defect<span className="text-brand-200">Loupe</span>
          </h1>
          <p className="text-brand-200/80 text-lg leading-relaxed">
            Keep every property, finding and inspection report in one reliable workspace.
          </p>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 bg-surface">
        <div className="w-full max-w-[420px]">
          {/* Mobile brand */}
          <div className="lg:hidden text-center mb-8">
            <h1 className="text-3xl font-extrabold text-text-primary">
              Defect<span className="text-brand-500">Loupe</span>
            </h1>
          </div>

          <form onSubmit={submit} className="bg-surface-card border border-border rounded-xl p-8 shadow-sm">
            <h2 className="text-xl font-bold text-text-primary mb-1">
              {mode === 'login' ? 'Welcome back' : 'Create your account'}
            </h2>
            <p className="text-sm text-text-secondary mb-6">
              {mode === 'login'
                ? 'Sign in to your DefectLoupe workspace.'
                : 'Get started with a free account.'}
            </p>

            <div className="flex flex-col gap-4">
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
            </div>

            <Button type="submit" disabled={busy} className="w-full mt-6">
              {busy ? 'Please wait...' : mode === 'login' ? 'Sign in' : 'Create account'}
            </Button>

            {message && (
              <div
                className={`mt-4 px-4 py-3 rounded-lg text-sm ${
                  messageType === 'error'
                    ? 'bg-red-50 text-red-700'
                    : 'bg-green-50 text-green-700'
                }`}
                role="alert"
              >
                {message}
              </div>
            )}

            <p className="text-sm text-text-secondary text-center mt-5">
              {mode === 'login' ? 'New to DefectLoupe? ' : 'Already have an account? '}
              <button
                type="button"
                onClick={() => {
                  setMode(mode === 'login' ? 'register' : 'login');
                  setMessage('');
                }}
                className="text-brand-500 font-semibold hover:underline bg-transparent border-none cursor-pointer p-0"
              >
                {mode === 'login' ? 'Create account' : 'Sign in'}
              </button>
            </p>
          </form>
        </div>
      </div>
    </main>
  );
}
