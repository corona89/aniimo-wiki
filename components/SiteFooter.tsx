import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-[var(--line)] bg-[var(--moss-deep)] text-[var(--paper)]">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-8 text-sm sm:flex-row sm:items-end sm:justify-between sm:px-6">
        <div>
          <p className="font-serif text-lg">애니모 팬 위키</p>
          <p className="mt-1 max-w-xl text-[13px] leading-6 text-[color-mix(in_oklab,var(--paper)_78%,transparent)]">
            비공식 자료입니다. Pawprint Studio / FunPlus와 무관합니다. 좌표·전투·성장 수치는 공식
            출처가 있을 때만 수록하며, 없으면 null로 둡니다.
          </p>
        </div>
        <div className="flex flex-col items-start gap-1 text-[13px] sm:items-end">
          <Link className="underline decoration-white/30 underline-offset-4 hover:decoration-white" href="/maps">
            지도 스텁 (좌표 없음)
          </Link>
          <Link className="underline decoration-white/30 underline-offset-4 hover:decoration-white" href="/training">
            육성 시뮬 스텁
          </Link>
          <p className="text-white/60">데이터 팩 2026-09-16</p>
        </div>
      </div>
    </footer>
  );
}
