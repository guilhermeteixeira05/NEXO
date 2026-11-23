import Link from "next/link";
import { ActionButton } from "@/components/ui/ActionButton";
import { Icon } from "@/components/ui/Icon";
import { SectionTitle } from "@/components/ui/Misc";
import { refreshBriefingAction } from "@/lib/insights/actions";
import { getBriefing, type Briefing } from "@/lib/insights/service";
import type { UserSnapshot } from "@/lib/snapshot";
import type { ServerSupabase } from "@/lib/supabase/server";

/**
 * Busca o briefing (que pode chamar a IA) dentro de um <Suspense> no Painel:
 * o restante da tela aparece na hora e as sugestões entram quando ficam prontas.
 */
export async function BriefingSection({ supabase, snapshot }: { supabase: ServerSupabase; snapshot: UserSnapshot }) {
  const briefing = await getBriefing(supabase, snapshot);
  return <BriefingPanel briefing={briefing} />;
}

/** Espaço reservado enquanto o briefing é gerado (mesma estrutura, sem deslocar o layout). */
export function BriefingSkeleton() {
  return (
    <section aria-labelledby="titulo-briefing" className="stack" aria-busy="true">
      <SectionTitle id="titulo-briefing" title="O NEXO sugere" />
      <div className="brief" role="status">
        <span className="brief__icon">
          <Icon name="assistente" size={20} />
        </span>
        <div className="brief__body">
          <p className="muted">O NEXO está analisando sua rotina…</p>
        </div>
      </div>
    </section>
  );
}

/** Assistente proativo no Painel (RF25). Indica se o texto veio da IA ou das regras locais. */
export function BriefingPanel({ briefing }: { briefing: Briefing | null }) {
  if (!briefing) {
    return (
      <section aria-labelledby="titulo-briefing" className="stack">
        <SectionTitle id="titulo-briefing" title="O NEXO sugere" />
        <p className="small muted">
          O assistente proativo está desligado. <Link href="/configuracoes">Ativar nas Configurações</Link>
        </p>
      </section>
    );
  }
  return (
    <section aria-labelledby="titulo-briefing" className="stack">
      <SectionTitle
        id="titulo-briefing"
        title="O NEXO sugere"
        action={
          <ActionButton action={refreshBriefingAction} className="link-btn" pendingText="Atualizando…" ariaLabel="Atualizar sugestões do NEXO">
            Atualizar
          </ActionButton>
        }
      />
      <ul className="stack" role="list">
        {briefing.messages.map((m, i) => (
          <li key={i} className="brief">
            <span className="brief__icon">
              <Icon name="assistente" size={20} />
            </span>
            <div className="brief__body">
              <p>{m.text}</p>
              <Link className="brief__action" href={m.actionHref}>
                {m.actionLabel}
              </Link>
            </div>
          </li>
        ))}
      </ul>
      <p className="xsmall muted">
        {briefing.source === "ia" ? "Gerado pela IA a partir dos seus dados." : "Gerado pelas regras do NEXO (IA não configurada ou indisponível)."}
      </p>
    </section>
  );
}
