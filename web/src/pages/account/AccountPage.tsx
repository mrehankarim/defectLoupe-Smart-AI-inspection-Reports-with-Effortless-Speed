import { Card } from '../../components/Card';
import Button from '../../components/Button';

export default function AccountPage() {
  return (
    <section>
      <Card className="max-w-lg">
        <p className="text-[11px] tracking-[0.13em] font-extrabold text-brand-500 uppercase mb-1">
          Account
        </p>
        <h1 className="text-2xl font-bold text-text-primary mb-2">Your Workspace</h1>
        <p className="text-sm text-text-secondary mb-6">
          Your session is secured with HTTP-only cookies. Sign out to end your current session.
        </p>
        <Button
          variant="secondary"
          onClick={async () => {
            await fetch('/auth/logout', { method: 'POST', credentials: 'include' });
            window.location.reload();
          }}
        >
          Sign out
        </Button>
      </Card>
    </section>
  );
}
