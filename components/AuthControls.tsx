import { getAdmin, isAuthConfigured } from "@/lib/auth";
import { getT } from "@/lib/i18n";

export async function AuthControls() {
  const { t } = await getT();
  const configured = isAuthConfigured();
  const { email, isAdmin } = await getAdmin();

  if (email) {
    return (
      <div className="flex items-center gap-2 text-xs">
        <span
          className={`chip ${isAdmin ? "chip-confirmed" : "chip-unknown"}`}
          title={email}
        >
          {isAdmin ? t.auth.admin : email}
        </span>
        <a href="/api/auth/logout" className="text-[var(--muted)] underline underline-offset-2 hover:text-[var(--ink)]">
          {t.auth.logout}
        </a>
      </div>
    );
  }

  if (!configured) return null;

  return (
    <a href="/api/auth/google/login" className="btn btn-ghost px-3 py-1.5 text-xs">
      <span aria-hidden>🔑</span>
      {t.auth.adminLogin}
    </a>
  );
}
