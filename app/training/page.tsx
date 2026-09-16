import { EditLink } from "@/components/EditLink";
import { PageHeader } from "@/components/PageHeader";
import { TrainingLab } from "@/components/TrainingLab";
import { getT } from "@/lib/i18n";
import { creatures, trainingSchema } from "@/lib/research";

export async function generateMetadata() {
  const { t } = await getT();
  return { title: t.training.title };
}

export default async function TrainingPage() {
  const { t } = await getT();
  const nurture = trainingSchema.training_actions.find((action) => action.id === "nurture_branch");
  const effect = nurture?.effect as {
    prismana_instant_chance: number;
    prismana_energy_gain: number;
    prismana_energy_soft_pity: number;
  };

  return (
    <div>
      <PageHeader
        crumbs={[{ label: t.nav.home, href: "/" }, { label: t.training.title }]}
        kicker="Training / Simulation"
        title={t.training.title}
        description={t.training.desc}
      />

      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div className="grid flex-1 gap-4 sm:grid-cols-3">
          <article className="wiki-card p-4 text-sm">
            <h2 className="font-display text-lg">{t.training.haveTitle}</h2>
            <p className="mt-2 text-[var(--ink-soft)]">{t.training.haveBody}</p>
          </article>
          <article className="wiki-card p-4 text-sm">
            <h2 className="font-display text-lg">{t.training.nullTitle}</h2>
            <p className="mt-2 text-[var(--ink-soft)]">{t.training.nullBody}</p>
          </article>
          <article className="wiki-card p-4 text-sm">
            <h2 className="font-display text-lg">{t.training.banTitle}</h2>
            <p className="mt-2 text-[var(--ink-soft)]">{t.training.banBody}</p>
          </article>
        </div>
        <EditLink file="data/research/training-sim-schema.json" />
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
