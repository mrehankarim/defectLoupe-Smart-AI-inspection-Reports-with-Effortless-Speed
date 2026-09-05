import { FormEvent, ReactNode, useEffect, useState } from "react";
import { Alert } from "../../components/ui/Alert";
import { GlassButton } from "../../components/ui/GlassButton";
import { GlassInput } from "../../components/ui/GlassInput";
import { useAuth } from "../../context/AuthContext";
import { api, ApiError } from "../../services/api";

type Inspector = {
  id: string;
  company_id: string | null;
  first_name: string;
  last_name: string;
  phone_number: string | null;
  license_number: string | null;
};

type ProfileData = {
  email: string;
  inspector: Inspector | null;
  is_company_owner: boolean;
};

type DashboardStatsData = {
  total_clients: number;
  total_properties: number;
  total_inspections: number;
  completion_rate: number;
};

const IconCamera = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" /><circle cx="12" cy="13" r="4" />
  </svg>
);

const IconEdit = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
);

const IconSave = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" /><polyline points="17 21 17 13 7 13 7 21" /><polyline points="7 3 7 8 15 8" />
  </svg>
);

const IconBadge = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="8" r="6" /><path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11" />
  </svg>
);

const IconPhone = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.14 12 19.79 19.79 0 0 1 1.07 3.37 2 2 0 0 1 3.05 1h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L7.09 8.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
  </svg>
);

const IconBuilding = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="7" width="20" height="14" rx="2" /><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
  </svg>
);

function StatChip({ value, label, color }: { value: string; label: string; color: string }) {
  return (
    <div
      className="flex flex-col items-center gap-1 px-4 py-3 rounded-2xl flex-1"
      style={{ background: `${color}0d`, border: `1px solid ${color}20` }}
    >
      <p className="text-xl font-semibold tracking-[-0.03em]" style={{ color }}>{value}</p>
      <p className="text-[11px] text-slate-500 dark:text-slate-400">{label}</p>
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div
      className="rounded-2xl px-6 py-5"
      style={{
        background: "var(--glass-bg)",
        border: "1px solid var(--glass-border)",
        backdropFilter: "blur(12px)",
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.06)",
      }}
    >
      <h2 className="text-[13px] font-mono font-medium tracking-[0.08em] uppercase text-slate-500 mb-4">{title}</h2>
      {children}
    </div>
  );
}

export default function ProfilePage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [stats, setStats] = useState<DashboardStatsData | null>(null);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    license: "",
    licenseType: "Residential & Commercial",
    company: "",
    bio: "Licensed property inspector with experience in residential and commercial property inspections.",
    city: "Lahore",
    country: "Pakistan",
  });

  useEffect(() => {
    async function loadData() {
      try {
        const [currentProfile, currentStats] = await Promise.all([
          api.get<ProfileData>("/inspectors/me"),
          api.get<DashboardStatsData>("/dashboard/stats").catch(() => null),
        ]);

        setProfile(currentProfile);
        setStats(currentStats);

        if (currentProfile.inspector) {
          setForm((f) => ({
            ...f,
            firstName: currentProfile.inspector?.first_name || "",
            lastName: currentProfile.inspector?.last_name || "",
            email: currentProfile.email || user?.email || "",
            phone: currentProfile.inspector?.phone_number || "",
            license: currentProfile.inspector?.license_number || "",
          }));
        }
      } catch (err) {
        setError((err as ApiError).detail || "Unable to load profile information.");
      }
    }
    void loadData();
  }, [user]);

  async function handleSave(e?: FormEvent) {
    if (e) e.preventDefault();
    setError("");
    setSaving(true);
    try {
      const updated = await api.patch<Inspector>("/inspectors/me", {
        first_name: form.firstName.trim(),
        last_name: form.lastName.trim(),
        phone_number: form.phone.trim() || null,
        license_number: form.license.trim() || null,
      });

      setProfile((curr) => (curr ? { ...curr, inspector: updated } : curr));
      setEditing(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      setError((err as ApiError).detail || "Unable to save profile changes.");
    } finally {
      setSaving(false);
    }
  }

  const initials = form.firstName && form.lastName
    ? `${form.firstName[0]}${form.lastName[0]}`.toUpperCase()
    : user?.email ? user.email.slice(0, 2).toUpperCase() : "IN";

  return (
    <div className="px-4 py-6 sm:px-8 sm:py-8 max-w-2xl mx-auto space-y-6" style={{ fontFamily: "'Outfit', system-ui, sans-serif" }}>
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-[-0.03em] text-slate-900 dark:text-slate-100">Profile</h1>
          <p className="text-sm text-slate-500 mt-0.5">Your inspector identity and credentials</p>
        </div>
        <div className="flex items-center gap-3">
          {saved && (
            <span
              className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 text-[13px] font-medium px-3 py-1.5 rounded-xl"
              style={{ background: "rgba(34,197,94,0.10)", border: "1px solid rgba(34,197,94,0.22)" }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              Saved
            </span>
          )}
          {editing ? (
            <>
              <GlassButton variant="ghost" size="sm" onClick={() => setEditing(false)}>
                Cancel
              </GlassButton>
              <GlassButton variant="primary" size="sm" icon={<IconSave />} loading={saving} onClick={() => void handleSave()}>
                Save changes
              </GlassButton>
            </>
          ) : (
            <GlassButton variant="ghost" size="sm" icon={<IconEdit />} onClick={() => setEditing(true)}>
              Edit profile
            </GlassButton>
          )}
        </div>
      </div>

      {error && <Alert variant="error">{error}</Alert>}

      <div className="flex flex-col gap-5">
        {/* Identity Card */}
        <div
          className="rounded-2xl p-6 flex flex-col sm:flex-row items-start gap-6"
          style={{
            background: "radial-gradient(ellipse 120% 100% at 50% 0%, rgba(99,102,241,0.10) 0%, transparent 70%), var(--glass-bg)",
            border: "1px solid rgba(99,102,241,0.20)",
            backdropFilter: "blur(12px)",
            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.08), 0 4px 24px rgba(0,0,0,0.15)",
          }}
        >
          <div className="relative shrink-0">
            <div
              className="w-20 h-20 rounded-2xl flex items-center justify-center text-2xl font-bold text-indigo-600 dark:text-indigo-200"
              style={{
                background: "linear-gradient(135deg, rgba(99,102,241,0.35) 0%, rgba(139,92,246,0.25) 100%)",
                border: "1px solid rgba(99,102,241,0.40)",
                boxShadow: "0 0 24px rgba(99,102,241,0.25)",
              }}
            >
              {initials}
            </div>
            {editing && (
              <button
                className="absolute -bottom-1 -right-1 w-7 h-7 rounded-xl flex items-center justify-center text-indigo-400 cursor-pointer"
                style={{ background: "rgba(99,102,241,0.30)", border: "1px solid rgba(99,102,241,0.50)" }}
                type="button"
              >
                <IconCamera />
              </button>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <h2 className="text-xl font-semibold tracking-[-0.02em] text-slate-900 dark:text-slate-100">
                {form.firstName || "Inspector"} {form.lastName}
              </h2>
              <span
                className="flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[11px] font-medium text-indigo-600 dark:text-indigo-300"
                style={{ background: "rgba(99,102,241,0.16)", border: "1px solid rgba(99,102,241,0.28)" }}
              >
                <IconBadge />
                Solo Inspector
              </span>
            </div>
            <p className="text-[13px] text-slate-500 mb-2">{form.email || user?.email}</p>
            <p className="text-[13px] text-slate-600 dark:text-slate-400 leading-relaxed">{form.bio}</p>
          </div>
        </div>

        {/* Stats Chips */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatChip color="#6366f1" label="Inspections" value={stats ? String(stats.total_inspections) : "0"} />
          <StatChip color="#22c55e" label="Clients" value={stats ? String(stats.total_clients) : "0"} />
          <StatChip color="#a78bfa" label="Properties" value={stats ? String(stats.total_properties) : "0"} />
          <StatChip color="#f59e0b" label="Completion" value={stats ? `${stats.completion_rate}%` : "0%"} />
        </div>

        {/* Personal Info Section */}
        <Section title="Personal Information">
          <form className="flex flex-col gap-4" onSubmit={(e) => void handleSave(e)}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <GlassInput disabled={!editing} label="First name" onChange={(v) => setForm((f) => ({ ...f, firstName: v }))} placeholder="First name" value={form.firstName} />
              <GlassInput disabled={!editing} label="Last name" onChange={(v) => setForm((f) => ({ ...f, lastName: v }))} placeholder="Last name" value={form.lastName} />
              <GlassInput disabled={!editing} icon={<span className="text-slate-500">@</span>} label="Email" onChange={(v) => setForm((f) => ({ ...f, email: v }))} placeholder="email@example.com" type="email" value={form.email} />
              <GlassInput disabled={!editing} icon={<IconPhone />} label="Phone" onChange={(v) => setForm((f) => ({ ...f, phone: v }))} placeholder="+1 (555) 000-0000" value={form.phone} />
              <GlassInput disabled={!editing} label="City" onChange={(v) => setForm((f) => ({ ...f, city: v }))} placeholder="City" value={form.city} />
              <GlassInput disabled={!editing} label="Country" onChange={(v) => setForm((f) => ({ ...f, country: v }))} placeholder="Country" value={form.country} />
            </div>

            {editing && (
              <div className="mt-2">
                <label className="text-[12px] font-mono font-medium tracking-[0.06em] text-slate-500 dark:text-slate-400 uppercase">
                  Bio
                </label>
                <textarea
                  className="w-full mt-1.5 rounded-xl px-4 py-3 text-[14px] text-[rgb(var(--text))] placeholder-slate-500 outline-none transition-all"
                  onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))}
                  rows={3}
                  style={{
                    backdropFilter: "blur(12px)",
                    WebkitBackdropFilter: "blur(12px)",
                    background: "var(--input-bg)",
                    border: "1px solid var(--input-border)",
                    boxShadow: "inset 0 1px 3px rgba(0,0,0,0.25)",
                    resize: "none",
                  }}
                  value={form.bio}
                />
              </div>
            )}
          </form>
        </Section>

        {/* License & Credentials Section */}
        <Section title="Credentials & License">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <GlassInput disabled={!editing} icon={<IconBadge />} label="License number" onChange={(v) => setForm((f) => ({ ...f, license: v }))} placeholder="PINSP-0000-0000" value={form.license} />
            <GlassInput disabled={!editing} label="License type" onChange={(v) => setForm((f) => ({ ...f, licenseType: v }))} placeholder="Residential & Commercial" value={form.licenseType} />
            <div className="sm:col-span-2">
              <GlassInput disabled={!editing} hint={!editing ? "Solo inspector — no agency assigned" : undefined} icon={<IconBuilding />} label="Agency / Company" onChange={(v) => setForm((f) => ({ ...f, company: v }))} placeholder="Independent / Agency name" value={form.company} />
            </div>
          </div>
        </Section>

        {/* Activity Feed */}
        <Section title="Recent Activity">
          {[
            { action: "Completed inspection", subject: "DHA Phase 5 Villa", time: "2 days ago", color: "#22c55e" },
            { action: "Report generated", subject: "Gulberg Apartment 3B", time: "4 days ago", color: "#a78bfa" },
            { action: "New client added", subject: "Sara Malik", time: "5 days ago", color: "#6366f1" },
            { action: "Voice note transcribed", subject: "INS-039 · Bathroom area", time: "6 days ago", color: "#f59e0b" },
          ].map(({ action, subject, time, color }) => (
            <div key={subject} className="flex items-center gap-4 py-3 border-b border-white/[0.04] last:border-0">
              <span className="w-2 h-2 rounded-full shrink-0" style={{ background: color, boxShadow: `0 0 6px ${color}80` }} />
              <div className="flex-1 min-w-0">
                <p className="text-[13px] text-slate-700 dark:text-slate-300">
                  <span className="text-slate-500 font-medium">{action}:</span> {subject}
                </p>
              </div>
              <p className="text-[11px] text-slate-500 shrink-0 font-mono">{time}</p>
            </div>
          ))}
        </Section>
      </div>
    </div>
  );
}
