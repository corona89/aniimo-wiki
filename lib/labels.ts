import type { Confidence } from "@/lib/types";

export const CONFIDENCE_LABEL: Record<Confidence, { ko: string; hint: string }> = {
  confirmed: { ko: "공식 확인", hint: "공식 사이트·스토어·인덱스" },
  marketing: { ko: "마케팅", hint: "트레일러·스토어 문구, 수치 없음" },
  community: { ko: "커뮤니티", hint: "팬 위키·도구·가이드 (2차 자료)" },
  unknown: { ko: "미확인", hint: "출처 없음 · 추정 금지" },
};

export const ELEMENT_KO: Record<string, string> = {
  Fire: "불",
  Water: "물",
  Grass: "풀",
  Lightning: "번개",
  Earth: "땅",
  Wind: "바람",
  Dark: "암흑",
  Ice: "얼음",
  Light: "빛",
};

export const NAV = [
  { href: "/", label: "홈" },
  { href: "/world", label: "월드" },
  { href: "/creatures", label: "도감" },
  { href: "/systems", label: "시스템" },
  { href: "/training", label: "육성" },
  { href: "/maps", label: "지도" },
] as const;

export function elementLabel(element?: string | null): string {
  if (!element) return "속성 미상";
  return ELEMENT_KO[element] ? `${ELEMENT_KO[element]} · ${element}` : element;
}
