import Image from "next/image";
import Link from "next/link";
import { NAV } from "@/lib/labels";

export function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-[var(--line)] bg-[var(--moss-deep)] text-[var(--paper)]">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:grid-cols-[1.4fr_1fr] sm:px-6">
        <div>
          <div className="flex items-center gap-2.5">
            <Image
              src="/art/crest.jpg"
              alt="애니모 위키 크레스트"
              width={36}
              height={36}
              className="h-9 w-9 rounded-xl object-cover"
            />
            <p className="font-display text-xl">애니모 팬 위키</p>
          </div>
          <p className="mt-3 max-w-xl text-[13px] leading-6 text-[color-mix(in_oklab,var(--paper)_78%,transparent)]">
            비공식 자료입니다. Pawprint Studio / FunPlus와 무관합니다. 좌표·전투·성장 수치는 공식 출처가 있을 때만
            수록하며, 없으면 <code className="rounded bg-white/10 px-1">null</code>로 둡니다. 페이지의 일러스트는
            분위기 표현용 팬 제작 이미지입니다.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-[13px] sm:justify-items-end">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-white/75 underline decoration-white/25 underline-offset-4 transition hover:text-white hover:decoration-white"
            >
              {item.label}
            </Link>
          ))}
          <p className="col-span-2 mt-3 text-white/50 sm:text-right">데이터 팩 2026-09-16</p>
        </div>
      </div>
    </footer>
  );
}
