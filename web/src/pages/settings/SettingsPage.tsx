import { FormEvent, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Alert } from "../../components/ui/Alert";
import { GlassButton } from "../../components/ui/GlassButton";
import { GlassInput } from "../../components/ui/GlassInput";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import { api, ApiError } from "../../services/api";

type Inspector = {
  id: string;
  company_id: string | null;
  first_name: string;
  last_name: string;
  phone_number: string | null;
  license_number: string | null;
};

type Profile = {
  email: string;
  inspector: Inspector | null;
  is_company_owner: boolean;
};

type Company = {
  id: string;
  name: string;
  email: string;
  phone_number: string | null;
  website: string | null;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  country: string;
};

const emptyProfile = { first_name: "", last_name: "", phone_number: "", license_number: "" };
const emptyCompany = { name: "", email: "", phone_number: "", website: "", address: "", city: "", state: "", zip_code: "", country: "" };

const IconKey = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="m21 2-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0 3 3L22 7l-3-3m-3.5 3.5L19 4" />
  </svg>
);

const IconSave = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" /><polyline points="17 21 17 13 7 13 7 21" /><polyline points="7 3 7 8 15 8" />
  </svg>
);

// Toggle switch primitive
function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!value)}
      style={{
        width: 44,
        height: 24,
        borderRadius: 12,
        background: value ? "rgba(99,102,241,0.70)" : "rgba(255,255,255,0.10)",
        border: `1px solid ${value ? "rgba(99,102,241,0.80)" : "rgba(255,255,255,0.14)"}`,
        boxShadow: value ? "0 0 10px rgba(99,102,241,0.35), inset 0 1px 0 rgba(255,255,255,0.20)" : "inset 0 1px 3px rgba(0,0,0,0.30)",
        transition: "all 220ms cubic-bezier(0.16,1,0.3,1)",
        position: "relative",
        flexShrink: 0,
        cursor: "pointer",
      }}
    >
      <span
        style={{
          position: "absolute",
          top: 2,
          left: value ? 22 : 2,
          width: 18,
          height: 18,
          borderRadius: "50%",
          background: value ? "#fff" : "rgba(255,255,255,0.50)",
          boxShadow: "0 1px 4px rgba(0,0,0,0.35)",
          transition: "left 220ms cubic-bezier(0.16,1,0.3,1), background 220ms ease",
        }}
      />
    </button>
  );
}

// Setting Row Primitive
function SettingRow({ label, description, children }: { label: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-6 py-4 border-b border-white/[0.05] last:border-0">
      <div className="flex-1 min-w-0">
        <p className="text-[14px] font-medium text-slate-900 dark:text-slate-200">{label}</p>
        {description && <p className="text-[12px] text-slate-500 dark:text-slate-500 mt-0.5">{description}</p>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

// Section card primitive
function Section({ title, children }: { title: string; children: React.ReactNode }) {
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
      <h2 className="text-[13px] font-mono font-medium tracking-[0.08em] uppercase text-slate-500 mb-1">{title}</h2>
      <div>{children}</div>
    </div>
  );
}

export default function SettingsPage() {
  const { logout } = useAuth();
  const { preference, setPreference } = useTheme();
  const navigate = useNavigate();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [profileForm, setProfileForm] = useState(emptyProfile);
  const [companyForm, setCompanyForm] = useState(emptyCompany);
  const [passwordForm, setPasswordForm] = useState({ current: "", next: "", confirmation: "" });
  
  const [notifs, setNotifs] = useState({ email: true, push: false, sms: false, reports: true, transcription: true });
  const [security, setSecurity] = useState({ twoFactor: false, sessionAlerts: true, apiAccess: false });
  const [appearance, setAppearance] = useState({ compactMode: false, animations: true, publicProfile: false });

  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [saving, setSaving] = useState<"profile" | "company" | "password" | null>(null);

  useEffect(() => {
    async function loadSettings() {
      try {
        const currentProfile = await api.get<Profile>("/inspectors/me");
        setProfile(currentProfile);
        if (currentProfile.inspector) {
          setProfileForm({
            first_name: currentProfile.inspector.first_name,
            last_name: currentProfile.inspector.last_name,
            phone_number: currentProfile.inspector.phone_number || "",
            license_number: currentProfile.inspector.license_number || "",
          });
        }
        if (currentProfile.inspector?.company_id) {
          const currentCompany = await api.get<Company>("/inspectors/company");
          setCompany(currentCompany);
          setCompanyForm({
            name: currentCompany.name,
            email: currentCompany.email,
            phone_number: currentCompany.phone_number || "",
            website: currentCompany.website || "",
            address: currentCompany.address,
            city: currentCompany.city,
            state: currentCompany.state,
            zip_code: currentCompany.zip_code,
            country: currentCompany.country,
          });
        }
      } catch (requestError) {
        setError((requestError as ApiError).detail || "Unable to load account settings.");
      } finally {
        setIsLoading(false);
      }
    }

    void loadSettings();
  }, []);

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setNotice("");
    setSaving("profile");
    try {
      const updated = await api.patch<Inspector>("/inspectors/me", {
        first_name: profileForm.first_name.trim(),
        last_name: profileForm.last_name.trim(),
        phone_number: profileForm.phone_number.trim() || null,
        license_number: profileForm.license_number.trim() || null,
      });
      setProfile((current) => (current ? { ...current, inspector: updated } : current));
      setNotice("Profile saved successfully.");
      setTimeout(() => setNotice(""), 3000);
    } catch (requestError) {
      setError((requestError as ApiError).detail || "Unable to save your profile.");
    } finally {
      setSaving(null);
    }
  }

  async function saveCompany(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setNotice("");
    setSaving("company");
    try {
      const updated = await api.patch<Company>("/inspectors/company", {
        ...companyForm,
        phone_number: companyForm.phone_number.trim() || null,
        website: companyForm.website.trim() || null,
      });
      setCompany(updated);
      setNotice("Company settings saved successfully.");
      setTimeout(() => setNotice(""), 3000);
    } catch (requestError) {
      setError((requestError as ApiError).detail || "Unable to save company settings.");
    } finally {
      setSaving(null);
    }
  }

  async function changePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setNotice("");
    if (passwordForm.next !== passwordForm.confirmation) {
      setError("New passwords do not match.");
      return;
    }

    setSaving("password");
    try {
      await api.patch("/auth/password", {
        current_password: passwordForm.current,
        new_password: passwordForm.next,
      });
      await logout().catch(() => undefined);
      navigate("/login", { replace: true });
    } catch (requestError) {
      setError((requestError as ApiError).detail || "Unable to change your password.");
    } finally {
      setSaving(null);
    }
  }

  if (isLoading) {
    return (
      <div className="px-8 py-8 max-w-2xl text-slate-500 font-mono text-xs flex items-center gap-2">
        <svg className="animate-spin h-4 w-4 text-indigo-500" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        Loading settings…
      </div>
    );
  }

  return (
    <div className="px-4 py-6 sm:px-8 sm:py-8 max-w-2xl mx-auto space-y-6" style={{ fontFamily: "'Outfit', system-ui, sans-serif" }}>
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-[-0.03em] text-slate-900 dark:text-slate-100">Settings</h1>
          <p className="text-sm text-slate-500 mt-0.5">Manage your account preferences and security</p>
        </div>
        {notice && (
          <span
            className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 text-[13px] font-medium px-3 py-1.5 rounded-xl"
            style={{ background: "rgba(34,197,94,0.10)", border: "1px solid rgba(34,197,94,0.22)" }}
          >
            ✓ Saved
          </span>
        )}
      </div>

      {error && <Alert variant="error">{error}</Alert>}

      {/* Inspector Profile */}
      {profile?.inspector && (
        <Section title="Inspector Profile">
          <form className="flex flex-col gap-4 pt-2" onSubmit={saveProfile}>
            <div className="grid grid-cols-2 gap-3">
              <GlassInput
                label="First name"
                onChange={(v) => setProfileForm((f) => ({ ...f, first_name: v }))}
                value={profileForm.first_name}
              />
              <GlassInput
                label="Last name"
                onChange={(v) => setProfileForm((f) => ({ ...f, last_name: v }))}
                value={profileForm.last_name}
              />
            </div>
            <GlassInput
              label="Phone number"
              onChange={(v) => setProfileForm((f) => ({ ...f, phone_number: v }))}
              placeholder="+1 (555) 000-0000"
              value={profileForm.phone_number}
            />
            <GlassInput
              label="License number"
              onChange={(v) => setProfileForm((f) => ({ ...f, license_number: v }))}
              placeholder="LIC-123456"
              value={profileForm.license_number}
            />
            <div className="flex justify-end pt-1">
              <GlassButton icon={<IconSave />} loading={saving === "profile"} type="submit" variant="primary">
                Save Profile
              </GlassButton>
            </div>
          </form>
        </Section>
      )}

      {/* Notifications */}
      <Section title="Notifications">
        <SettingRow description="Receive inspection updates via email" label="Email notifications">
          <Toggle onChange={(v) => setNotifs({ ...notifs, email: v })} value={notifs.email} />
        </SettingRow>
        <SettingRow description="Browser push alerts for real-time updates" label="Push notifications">
          <Toggle onChange={(v) => setNotifs({ ...notifs, push: v })} value={notifs.push} />
        </SettingRow>
        <SettingRow description="Text message alerts for critical events" label="SMS alerts">
          <Toggle onChange={(v) => setNotifs({ ...notifs, sms: v })} value={notifs.sms} />
        </SettingRow>
        <SettingRow description="Notify when AI report generation completes" label="Report ready alerts">
          <Toggle onChange={(v) => setNotifs({ ...notifs, reports: v })} value={notifs.reports} />
        </SettingRow>
        <SettingRow description="Alert when voice notes are transcribed" label="Transcription complete">
          <Toggle onChange={(v) => setNotifs({ ...notifs, transcription: v })} value={notifs.transcription} />
        </SettingRow>
      </Section>

      {/* Security */}
      <Section title="Security">
        <SettingRow description="Add an extra layer of login security" label="Two-factor authentication">
          <Toggle onChange={(v) => setSecurity({ ...security, twoFactor: v })} value={security.twoFactor} />
        </SettingRow>
        <SettingRow description="Email when a new device signs in" label="Session login alerts">
          <Toggle onChange={(v) => setSecurity({ ...security, sessionAlerts: v })} value={security.sessionAlerts} />
        </SettingRow>
        <SettingRow description="Allow third-party apps to access your data" label="API access">
          <Toggle onChange={(v) => setSecurity({ ...security, apiAccess: v })} value={security.apiAccess} />
        </SettingRow>
      </Section>

      {/* Change password */}
      <Section title="Change Password">
        <form className="flex flex-col gap-4 pt-2" onSubmit={changePassword}>
          <GlassInput
            autoComplete="current-password"
            label="Current password"
            onChange={(v) => setPasswordForm((f) => ({ ...f, current: v }))}
            placeholder="••••••••"
            type="password"
            value={passwordForm.current}
          />
          <GlassInput
            autoComplete="new-password"
            label="New password"
            onChange={(v) => setPasswordForm((f) => ({ ...f, next: v }))}
            placeholder="Min 8 characters"
            type="password"
            value={passwordForm.next}
          />
          <GlassInput
            autoComplete="new-password"
            error={passwordForm.confirmation && passwordForm.confirmation !== passwordForm.next ? "Passwords do not match" : undefined}
            label="Confirm new password"
            onChange={(v) => setPasswordForm((f) => ({ ...f, confirmation: v }))}
            placeholder="••••••••"
            type="password"
            value={passwordForm.confirmation}
          />
          <div className="flex justify-end pt-1">
            <GlassButton icon={<IconKey />} loading={saving === "password"} type="submit" variant="primary">
              Update Password
            </GlassButton>
          </div>
        </form>
      </Section>

      {/* Appearance */}
      <Section title="Appearance & Theme">
        <SettingRow description="Switch between obsidian dark and clean light themes" label="Visual Theme">
          <div className="flex gap-2">
            <button
              className={`px-3 py-1.5 rounded-xl text-xs font-mono font-medium transition-all cursor-pointer ${
                preference === "dark" ? "bg-indigo-600 text-white" : "bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
              }`}
              onClick={() => setPreference("dark")}
              type="button"
            >
              🌙 Dark
            </button>
            <button
              className={`px-3 py-1.5 rounded-xl text-xs font-mono font-medium transition-all cursor-pointer ${
                preference === "light" ? "bg-indigo-600 text-white" : "bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
              }`}
              onClick={() => setPreference("light")}
              type="button"
            >
              ☀️ Light
            </button>
            <button
              className={`px-3 py-1.5 rounded-xl text-xs font-mono font-medium transition-all cursor-pointer ${
                preference === "system" ? "bg-indigo-600 text-white" : "bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
              }`}
              onClick={() => setPreference("system")}
              type="button"
            >
              🖥️ System
            </button>
          </div>
        </SettingRow>
        <SettingRow description="Reduce padding for denser information display" label="Compact mode">
          <Toggle onChange={(v) => setAppearance({ ...appearance, compactMode: v })} value={appearance.compactMode} />
        </SettingRow>
        <SettingRow description="Enable transitions and motion effects" label="UI animations">
          <Toggle onChange={(v) => setAppearance({ ...appearance, animations: v })} value={appearance.animations} />
        </SettingRow>
      </Section>

      {/* Company Settings */}
      {company && profile?.is_company_owner && (
        <Section title="Company Settings">
          <form className="flex flex-col gap-4 pt-2" onSubmit={saveCompany}>
            <GlassInput label="Company name" onChange={(v) => setCompanyForm((f) => ({ ...f, name: v }))} value={companyForm.name} />
            <div className="grid grid-cols-2 gap-3">
              <GlassInput label="Company email" onChange={(v) => setCompanyForm((f) => ({ ...f, email: v }))} type="email" value={companyForm.email} />
              <GlassInput label="Company phone" onChange={(v) => setCompanyForm((f) => ({ ...f, phone_number: v }))} value={companyForm.phone_number} />
            </div>
            <GlassInput label="Website URL" onChange={(v) => setCompanyForm((f) => ({ ...f, website: v }))} type="url" value={companyForm.website} />
            <GlassInput label="Street address" onChange={(v) => setCompanyForm((f) => ({ ...f, address: v }))} value={companyForm.address} />
            <div className="grid grid-cols-2 gap-3">
              <GlassInput label="City" onChange={(v) => setCompanyForm((f) => ({ ...f, city: v }))} value={companyForm.city} />
              <GlassInput label="State" onChange={(v) => setCompanyForm((f) => ({ ...f, state: v }))} value={companyForm.state} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <GlassInput label="Postal code" onChange={(v) => setCompanyForm((f) => ({ ...f, zip_code: v }))} value={companyForm.zip_code} />
              <GlassInput label="Country" onChange={(v) => setCompanyForm((f) => ({ ...f, country: v }))} value={companyForm.country} />
            </div>
            <div className="flex justify-end pt-1">
              <GlassButton icon={<IconSave />} loading={saving === "company"} type="submit" variant="primary">
                Save Company Settings
              </GlassButton>
            </div>
          </form>
        </Section>
      )}
    </div>
  );
}
