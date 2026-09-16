import { ConfidenceChip } from "@/components/ConfidenceChip";
import { PageHeader } from "@/components/PageHeader";
import { trainingSchema } from "@/lib/research";

export const metadata = {
  title: "시스템",
};

const PODS = [
  { name: "애니팟", coeff: "×1", note: "기본" },
  { name: "슈퍼 애니팟", coeff: "×1.5", note: "공식 계수" },
  { name: "스피드 / 트래킹 / 얼티밋", coeff: "×2", note: "공식 계수" },
  { name: "챔피언 / 스파클", coeff: "반드시 성공", note: "포획 확정" },
  { name: "빅화이트볼", coeff: "×2 / 단체 ×6", note: "대중 스폰 제어 ×6" },
];

export default function SystemsPage() {
  const coeffs = trainingSchema.capture_coeffs_official;

  return (
    <div>
      <PageHeader
        kicker="Systems"
        title="시스템"
        description="트와인·포획·전투·진화·홈랜드. 전투 DPS와 유대 수치처럼 미공개인 값은 쓰지 않습니다."
      />

      <div className="grid gap-6">
        <section className="wiki-card p-6">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-serif text-2xl">트와인</h2>
            <ConfidenceChip value="confirmed" />
          </div>
          <p className="mt-3 text-sm leading-7 text-[var(--ink-soft)]">
            포획한 애니모와 유대를 맺은 뒤, 탐구자가 그 애니모가 되어 시야·이동·전투 기술을 직접 씁니다. 커뮤니티는
            지휘 모드와 트와인 모드를 구분합니다. 유대 게이지의 정확한 임계값은{" "}
            <ConfidenceChip value="unknown" compact /> 입니다.
          </p>
        </section>

        <section className="wiki-card p-6">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-serif text-2xl">포획 · 애니팟</h2>
            <ConfidenceChip value={coeffs.confidence} />
          </div>
          <p className="mt-3 text-sm leading-7 text-[var(--ink-soft)]">
            필드 포획은 타이밍, 후방 접근, 상태이상, HP, 팟 등급이 영향을 줍니다. 전투 중 HP 계수, 비전투 후방 ×1.5,
            단일 대상 일반팟의 두 번 제곱근 판정은 공식 확률 페이지에 있습니다.
          </p>
          <table className="mt-4 w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-[0.12em] text-[var(--muted)]">
                <th className="py-2">팟</th>
                <th>계수</th>
              </tr>
            </thead>
            <tbody>
              {PODS.map((pod) => (
                <tr key={pod.name} className="border-t border-[var(--line)]">
                  <td className="py-2">{pod.name}</td>
                  <td className="font-mono">{pod.coeff}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-3 text-xs">
            출처:{" "}
            <a className="text-[var(--moss)] underline underline-offset-4" href={coeffs.source}>
              {coeffs.source}
            </a>
          </p>
        </section>

        <section className="wiki-card p-6">
          <h2 className="font-serif text-2xl">전투</h2>
          <p className="mt-3 text-sm leading-7 text-[var(--ink-soft)]">
            실시간 액션. 역할 라벨은 격파·딜·서포트·힐·재생입니다. 속성은 불·물·풀·번개·땅·바람·암흑·얼음·빛 아홉
            가지. 상성 1.6× / 0.625×는 커뮤니티 보고이며 인게임 표로 재확인이 필요합니다.{" "}
            <strong>DPS 공식과 절대 데미지 숫자는 수록하지 않습니다.</strong>
          </p>
        </section>

        <section className="wiki-card p-6">
          <h2 className="font-serif text-2xl">진화 · 형태</h2>
          <p className="mt-3 text-sm leading-7 text-[var(--ink-soft)]">
            커뮤니티/인접 자료의 단계명은 Lumin → Gamma → Nova. 모든 라인이 3단계인 것은 아닙니다. 재료에 따른 분기
            예: Pebbling → 땅 Geodeback 또는 불 Lavazar. 지역·날씨 진화는 속성과 서식지를 바꿉니다. UI 문자열은 라이브
            클라이언트로 재확인.
          </p>
        </section>

        <section className="wiki-card p-6">
          <h2 className="font-serif text-2xl">캠핑카 / 홈랜드</h2>
          <p className="mt-3 text-sm leading-7 text-[var(--ink-soft)]">
            개인 RV를 야영지에 세우고, 홈랜드에서 작물·꾸미기·애니모 배치·제작을 합니다. Hatchinator는 실시간 부화.
            Caress 횟수(~20)와 리필 주기는 커뮤니티 관찰이며 정확한 부화 초 단위는 미공개입니다.
          </p>
        </section>

        <section className="wiki-card p-6">
          <h2 className="font-serif text-2xl">멀티 · 세이브</h2>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-7 text-[var(--ink-soft)]">
            <li>
              솔로+멀티, PvE/PvP, Egg Heist(Lost Isles, 3인) <ConfidenceChip value="confirmed" compact />
            </li>
            <li>
              Xbox/Steam 크로스플레이 플래그는 확인. PS↔PC↔모바일 전체 매트릭스는{" "}
              <ConfidenceChip value="unknown" compact />
            </li>
            <li>Xbox Play Anywhere는 확인. PS 세이브 연동은 미확인.</li>
          </ul>
        </section>
      </div>
    </div>
  );
}
