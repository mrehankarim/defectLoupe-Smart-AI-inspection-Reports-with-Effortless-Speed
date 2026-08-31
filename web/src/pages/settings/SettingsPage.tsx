import { FormEvent, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Alert } from "../../components/ui/Alert";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { FormField } from "../../components/ui/FormField";
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

export default function SettingsPage() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [profileForm, setProfileForm] = useState(emptyProfile);
  const [companyForm, setCompanyForm] = useState(emptyCompany);
  const [passwordForm, setPasswordForm] = useState({ current: "", next: "", confirmation: "" });
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
      setProfile((current) => current ? { ...current, inspector: updated } : current);
      setNotice("Profile saved.");
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
      setNotice("Company settings saved.");
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
    return <div className="p-6 text-sm text-[rgb(var(--text-muted))]" role="status">Loading account settings…</div>;
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      <div>
        <p className="text-sm font-medium text-blue-600 dark:text-blue-300">Account</p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight">Settings</h1>
        <p className="mt-1 text-sm text-[rgb(var(--text-muted))]">Manage your profile, password, and company preferences.</p>
      </div>

      {error && <Alert>{error}</Alert>}
      {notice && <Alert variant="success">{notice}</Alert>}

      <Card className="p-5">
        <h2 className="text-lg font-semibold">Profile</h2>
        <p className="mt-1 text-sm text-[rgb(var(--text-muted))]">{profile?.email}</p>
        {profile?.inspector ? (
          <form className="mt-5 grid gap-4 sm:grid-cols-2" onSubmit={saveProfile}>
            <FormField id="profile-first-name" label="First name" onChange={(event) => setProfileForm((form) => ({ ...form, first_name: event.target.value }))} required value={profileForm.first_name} />
            <FormField id="profile-last-name" label="Last name" onChange={(event) => setProfileForm((form) => ({ ...form, last_name: event.target.value }))} required value={profileForm.last_name} />
            <FormField autoComplete="tel" id="profile-phone" label="Phone number" onChange={(event) => setProfileForm((form) => ({ ...form, phone_number: event.target.value }))} value={profileForm.phone_number} />
            <FormField id="profile-license" label="License number" onChange={(event) => setProfileForm((form) => ({ ...form, license_number: event.target.value }))} value={profileForm.license_number} />
            <div className="sm:col-span-2"><Button disabled={saving === "profile"} type="submit">{saving === "profile" ? "Saving…" : "Save profile"}</Button></div>
          </form>
        ) : (
          <p className="mt-4 text-sm text-[rgb(var(--text-muted))]">An inspector profile is not available for this account.</p>
        )}
      </Card>

      <Card className="p-5">
        <h2 className="text-lg font-semibold">Change password</h2>
        <p className="mt-1 text-sm text-[rgb(var(--text-muted))]">Changing your password signs you out on every device.</p>
        <form className="mt-5 grid gap-4 sm:grid-cols-2" onSubmit={changePassword}>
          <div className="sm:col-span-2"><FormField autoComplete="current-password" id="current-password" label="Current password" minLength={1} onChange={(event) => setPasswordForm((form) => ({ ...form, current: event.target.value }))} required type="password" value={passwordForm.current} /></div>
          <FormField autoComplete="new-password" id="new-password" label="New password" minLength={8} onChange={(event) => setPasswordForm((form) => ({ ...form, next: event.target.value }))} required type="password" value={passwordForm.next} />
          <FormField autoComplete="new-password" error={passwordForm.confirmation && passwordForm.confirmation !== passwordForm.next ? "Passwords do not match." : undefined} id="confirm-new-password" label="Confirm new password" minLength={8} onChange={(event) => setPasswordForm((form) => ({ ...form, confirmation: event.target.value }))} required type="password" value={passwordForm.confirmation} />
          <div className="sm:col-span-2"><Button disabled={saving === "password"} type="submit">{saving === "password" ? "Updating…" : "Update password"}</Button></div>
        </form>
      </Card>

      {company && profile?.is_company_owner && (
        <Card className="p-5">
          <h2 className="text-lg font-semibold">Company settings</h2>
          <p className="mt-1 text-sm text-[rgb(var(--text-muted))]">Only the company owner can change these details.</p>
          <form className="mt-5 grid gap-4 sm:grid-cols-2" onSubmit={saveCompany}>
            <div className="sm:col-span-2"><FormField id="company-name" label="Company name" onChange={(event) => setCompanyForm((form) => ({ ...form, name: event.target.value }))} required value={companyForm.name} /></div>
            <FormField id="company-email" label="Company email" onChange={(event) => setCompanyForm((form) => ({ ...form, email: event.target.value }))} required type="email" value={companyForm.email} />
            <FormField id="company-phone" label="Company phone" onChange={(event) => setCompanyForm((form) => ({ ...form, phone_number: event.target.value }))} value={companyForm.phone_number} />
            <div className="sm:col-span-2"><FormField id="company-website" label="Website" onChange={(event) => setCompanyForm((form) => ({ ...form, website: event.target.value }))} type="url" value={companyForm.website} /></div>
            <div className="sm:col-span-2"><FormField id="company-address" label="Address" onChange={(event) => setCompanyForm((form) => ({ ...form, address: event.target.value }))} required value={companyForm.address} /></div>
            <FormField id="company-city" label="City" onChange={(event) => setCompanyForm((form) => ({ ...form, city: event.target.value }))} required value={companyForm.city} />
            <FormField id="company-state" label="State" onChange={(event) => setCompanyForm((form) => ({ ...form, state: event.target.value }))} required value={companyForm.state} />
            <FormField id="company-zip" label="Postal code" onChange={(event) => setCompanyForm((form) => ({ ...form, zip_code: event.target.value }))} required value={companyForm.zip_code} />
            <FormField id="company-country" label="Country" onChange={(event) => setCompanyForm((form) => ({ ...form, country: event.target.value }))} required value={companyForm.country} />
            <div className="sm:col-span-2"><Button disabled={saving === "company"} type="submit">{saving === "company" ? "Saving…" : "Save company settings"}</Button></div>
          </form>
        </Card>
      )}

      {company && !profile?.is_company_owner && (
        <Card className="p-5">
          <h2 className="text-lg font-semibold">Company settings</h2>
          <p className="mt-2 text-sm text-[rgb(var(--text-muted))]">You are a member of {company.name}. Only the company owner can change its settings.</p>
        </Card>
      )}
    </div>
  );
}
