import { cookies } from "next/headers";
import { DICT, type Dict, type Locale, LOCALE_COOKIE } from "@/lib/i18n-dict";

export type { Locale, Dict };
export { pickName, LOCALES, DEFAULT_LOCALE, LOCALE_COOKIE, DICT } from "@/lib/i18n-dict";

export async function getLocale(): Promise<Locale> {
  const store = await cookies();
  return store.get(LOCALE_COOKIE)?.value === "en" ? "en" : "ko";
}

export async function getT(): Promise<{ locale: Locale; t: Dict }> {
  const locale = await getLocale();
  return { locale, t: DICT[locale] };
}
