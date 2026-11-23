import type { Metadata } from "next";
import Link from "next/link";
import { GeneratePlanForm } from "@/components/planning/GeneratePlanForm";
import { PlanCard } from "@/components/planning/PlanCard";
import { EmptyState, Notice, PageHeader, SectionTitle } from "@/components/ui/Misc";
import { getProfile, requireUser } from "@/lib/auth/session";
import { localDateString } from "@/lib/dates";
import { isAiConfigured } from "@/lib/env";
import { defaultStartDate, listPlans } from "@/lib/planning/service";

export const metadata: Metadata = { title: "Planejamento" };

export default async function PlanningPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const { supabase, user } = await requireUser();
  const profile = await getProfile();
  const sp = await searchParams;
  const today = localDateString(new Date(), profile.timezone);
  const [proposed, history] = await Promise.all([
    listPlans(supabase, user.id, { status: "proposto", limit: 5 }),
    listPlans(supabase, user.id, { limit: 12 }),
  ]);
  const decided = history.filter((p) => p.status !== "proposto").slice(0, 6);

  return (
    <>
      <PageHeader
        title="Planejamento"
        subtitle="Planos diários e semanais que respeitam suas prioridades, prazos, compromissos e horários livres."
      />
      {!isAiConfigured() ? (
        <Notice tone="info">
          <span>IA não configurada: os planos são gerados pelo planejador local (sem revisão da IA).</span>
        </Notice>
      ) : null}
      <div className="grid-2">
        <div className="stack stack--lg">
          <GeneratePlanForm today={today} defaultScope={sp.escopo ?? "diario"} defaultDate={defaultStartDate(today, sp.data)} />
          <p className="small secondary">
            Ajuste seus horários livres em <Link href="/perfil#disponibilidade">Perfil → Disponibilidade</Link>.
          </p>
        </div>
        <section className="stack stack--lg" aria-labelledby="titulo-propostas">
          <SectionTitle id="titulo-propostas" title={`Aguardando aprovação (${proposed.length})`} />
          {proposed.length ? (
            proposed.map((p) => <PlanCard key={p.id} plan={p} tz={profile.timezone} />)
          ) : (
            <EmptyState title="Nenhuma proposta pendente.">Gere um plano ao lado ou peça ao Assistente para reorganizar sua semana.</EmptyState>
          )}
        </section>
      </div>
      {decided.length ? (
        <section className="stack" aria-labelledby="titulo-historico-planos">
          <SectionTitle id="titulo-historico-planos" title="Planos anteriores" />
          <div className="cards">
            {decided.map((p) => (
              <PlanCard key={p.id} plan={p} tz={profile.timezone} headingLevel={3} />
            ))}
          </div>
        </section>
      ) : null}
    </>
  );
}
