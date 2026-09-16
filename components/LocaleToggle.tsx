"use client";

import { useI18n } from "@/components/i18n/LocaleProvider";
import { LOCALES } from "@/lib/i18n-dict";

export function LocaleToggle() {
  const { locale, setLocale } = useI18n();

  return (
    <div
      className="locale-toggle inline-flex overflow-hidden rounded-full border border-[var(--line)] text-xs font-semibold"
      role="group"
      aria-label="언어 선택 / Language"
    >
      {LOCALES.map((code) => {
        const active = locale === code;
        return (
          <button
            key={code}
            type="button"
            aria-pressed={active}
            onClick={() => setLocale(code)}
            className={`px-2.5 py-1 uppercase transition ${
              active
                ? "bg-[var(--moss)] text-white"
                : "bg-transparent text-[var(--muted)] hover:text-[var(--moss-deep)]"
            }`}
          >
            {code}
          </button>
        );
      })}
    </div>
  );
}
