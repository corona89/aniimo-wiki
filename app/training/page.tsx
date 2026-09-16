import { PageHeader } from "@/components/PageHeader";
import { TrainingLab } from "@/components/TrainingLab";
import { creatures, trainingSchema } from "@/lib/research";

export const metadata = {
  title: "육성 / 시뮬레이션",
};

export default function TrainingPage() {
  const nurture = trainingSchema.training_actions.find((action) => action.id === "nurture_branch");
  const effect = nurture?.effect as {
    prismana_instant_chance: number;
    prismana_energy_gain: number;
    prismana_energy_soft_pity: number;
  };

  return (
    <div>
      <PageHeader
        kicker="Training / Simulation"
        title="육성 시뮬레이터"
        description="이 화면은 공략 사기가 아닙니다. 미공개 종족치·잠재력 밴드·공명 이득·부화 초를 추정하지 않으며, 공식 확률 페이지만 숫자로 옮깁니다."
      />

      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        <article className="wiki-card p-4 text-sm">
          <h2 className="font-serif text-lg">데이터 있음</h2>
          <p className="mt-2 text-[var(--ink-soft)]">도감 FK, 스파클 스타일 enum, 공식 팟 계수, 천휘 육성 확률</p>
        </article>
        <article className="wiki-card p-4 text-sm">
          <h2 className="font-serif text-lg">null-safe</h2>
          <p className="mt-2 text-[var(--ink-soft)]">종족치, 공명 비용, 특성 축, 유대, 교배 IV</p>
        </article>
        <article className="wiki-card p-4 text-sm">
          <h2 className="font-serif text-lg">금지</h2>
          <p className="mt-2 text-[var(--ink-soft)]">DPS 공식, 가짜 좌표, 미공개 성장 곡선 발명</p>
        </article>
      </div>

      <TrainingLab
        creatures={creatures}
        capture={trainingSchema.capture_coeffs_official}
        nurture={{
          prismana_instant_chance: effect.prismana_instant_chance,
          prismana_energy_gain: effect.prismana_energy_gain,
          prismana_energy_soft_pity: effect.prismana_energy_soft_pity,
        }}
      />
    </div>
  );
}
