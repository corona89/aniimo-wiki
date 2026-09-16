"use client";

import { useRouter } from "next/navigation";
import { createContext, useContext, useState, type ReactNode } from "react";
import { DICT, type Dict, type Locale, LOCALE_COOKIE } from "@/lib/i18n-dict";

type LocaleContextValue = {
  locale: Locale;
  t: Dict;
  setLocale: (next: Locale) => void;
};

const LocaleContext = createContext<LocaleContextValue | null>(null);

export function LocaleProvider({
  initialLocale,
  children,
}: {
  initialLocale: Locale;
  children: ReactNode;
}) {
  const router = useRouter();
  const [locale, setLocaleState] = useState<Locale>(initialLocale);

  function setLocale(next: Locale) {
    if (next === locale) return;
    document.cookie = `${LOCALE_COOKIE}=${next}; path=/; max-age=31536000; samesite=lax`;
    setLocaleState(next);
    router.refresh();
  }

  return (
    <LocaleContext.Provider value={{ locale, t: DICT[locale], setLocale }}>
      {children}
    </LocaleContext.Provider>
  );
}

export function useI18n(): LocaleContextValue {
  const ctx = useContext(LocaleContext);
  if (!ctx) {
    throw new Error("useI18n must be used within a LocaleProvider");
  }
  return ctx;
}
