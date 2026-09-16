"use client";

import { useI18n } from "@/components/i18n/LocaleProvider";

const REPO_EDIT_BASE = "https://github.com/corona89/aniimo-wiki/edit/main";

export function EditLink({ file, className = "" }: { file: string; className?: string }) {
  const { t } = useI18n();
  return (
    <a
      className={`btn btn-ghost ${className}`}
      href={`${REPO_EDIT_BASE}/${file}`}
      target="_blank"
      rel="noopener noreferrer"
      title={t.common.editHint}
    >
      <span aria-hidden>✏️</span>
      {t.common.edit}
    </a>
  );
}
