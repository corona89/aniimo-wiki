import { EditLink } from "@/components/EditLink";
import { PageHeader } from "@/components/PageHeader";
import { LinkButton } from "@/components/ui";
import { adminUsername, getAdmin, isAuthConfigured, isPasswordConfigured } from "@/lib/auth";
import { getT } from "@/lib/i18n";

export async function generateMetadata() {
  const { t } = await getT();
  return { title: t.auth.adminTitle };
}

const DATA_FILES = [
  "data/research/creatures.json",
  "data/research/regions.json",
  "data/research/meta.json",
  "data/research/sources.json",
  "data/research/systems.md",
  "data/research/maps.md",
  "data/research/training-sim-schema.json",
  "data/maps/empty-collection.json",
];

export default async function AdminPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { t } = await getT();
  const { error } = await searchParams;
  const googleConfigured = isAuthConfigured();
  const passwordConfigured = isPasswordConfigured();
  const configured = googleConfigured || passwordConfigured;
  const { email, isAdmin } = await getAdmin();

  const errorMessage =
    error === "state"
      ? t.auth.loginErrorState
      : error === "email"
        ? t.auth.loginErrorEmail
        : error === "cred"
          ? t.auth.loginErrorCred
          : error === "config" || error === "token"
            ? t.auth.loginErrorConfig
            : null;

  return (
    <div>
      <PageHeader
        crumbs={[{ label: t.nav.home, href: "/" }, { label: t.auth.adminTitle }]}
        kicker="Admin"
        title={t.auth.adminTitle}
        description={isAdmin ? t.auth.adminDesc : t.auth.adminOnlyDesc}
      />

      {errorMessage ? (
        <div className="mb-6 wiki-card border-l-4 p-4 text-sm" style={{ borderLeftColor: "var(--fire)" }}>
          {errorMessage}
        </div>
      ) : null}

      {isAdmin ? (
        <section className="wiki-card p-6">
          <div className="mb-4 flex items-center justify-between gap-3">
            <p className="text-sm text-[var(--muted)]">
              {t.auth.signedInAs}: <span className="font-medium text-[var(--ink)]">{email}</span>
            </p>
            <a href="/api/auth/logout" className="link-moss text-sm">
              {t.auth.logout}
            </a>
          </div>
          <h2 className="font-display text-xl">{t.auth.editData}</h2>
          <ul className="mt-4 grid gap-2 sm:grid-cols-2">
            {DATA_FILES.map((file) => (
              <li key={file} className="flex items-center justify-between gap-3 border-b border-[var(--line)] py-2">
                <code className="text-xs text-[var(--ink-soft)]">{file}</code>
                <EditLink file={file} className="px-3 py-1.5 text-xs" />
              </li>
            ))}
          </ul>
        </section>
      ) : (
        <section className="wiki-card p-8 text-center">
          <p className="font-display text-2xl">{t.auth.adminOnly}</p>
          <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-[var(--ink-soft)]">
            {email ? t.auth.notAdmin : t.auth.adminOnlyDesc}
          </p>
          <div className="mx-auto mt-6 max-w-sm">
            {!configured ? (
              <span className="chip chip-unknown">{t.auth.notConfigured}</span>
            ) : email ? (
              <div className="flex justify-center">
                <LinkButton href="/api/auth/logout" variant="ghost" external>
                  {t.auth.logout}
                </LinkButton>
              </div>
            ) : (
              <div className="space-y-4">
                {googleConfigured ? (
                  <a href="/api/auth/google/login" className="btn btn-primary w-full">
                    <span aria-hidden>🔑</span>
                    {t.auth.signInGoogle}
                  </a>
                ) : null}

                {googleConfigured && passwordConfigured ? (
                  <div className="flex items-center gap-3 text-xs text-[var(--muted)]">
                    <span className="h-px flex-1 bg-[var(--line)]" />
                    {t.auth.orDivider}
                    <span className="h-px flex-1 bg-[var(--line)]" />
                  </div>
                ) : null}

                {passwordConfigured ? (
                  <form method="post" action="/api/auth/password" className="space-y-3 text-left">
                    <label className="block text-sm">
                      {t.auth.username}
                      <input
                        name="username"
                        type="text"
                        autoComplete="username"
                        defaultValue={adminUsername()}
                        className="mt-1 w-full rounded-xl border border-[var(--line)] bg-[var(--paper-2)] px-3 py-2"
                      />
                    </label>
                    <label className="block text-sm">
                      {t.auth.password}
                      <input
                        name="password"
                        type="password"
                        autoComplete="current-password"
                        required
                        className="mt-1 w-full rounded-xl border border-[var(--line)] bg-[var(--paper-2)] px-3 py-2"
                      />
                    </label>
                    <button type="submit" className="btn btn-primary w-full">
                      {t.auth.signIn}
                    </button>
                  </form>
                ) : null}
              </div>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
