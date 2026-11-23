"use client";

import { useActionForm } from "@/components/ui/useActionForm";
import { useState } from "react";
import { FormAlert } from "@/components/ui/Field";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { generatePlanAction } from "@/lib/planning/actions";

const SCOPES = [
  { value: "diario", label: "Dia", help: "Encaixa as atividades pendentes nos horários livres da data escolhida." },
  { value: "semanal", label: "Semana", help: "Distribui as atividades nos próximos 7 dias, respeitando prazos." },
  { value: "reorganizacao", label: "Reorganizar adiadas", help: "Redistribui apenas as atividades atrasadas ou adiadas." },
] as const;

export function GeneratePlanForm({ today, defaultScope, defaultDate }: { today: string; defaultScope: string; defaultDate: string }) {
  const { state, pending, onSubmit } = useActionForm(generatePlanAction, { ok: false });
  const [scope, setScope] = useState<string>(SCOPES.some((s) => s.value === defaultScope) ? defaultScope : "diario");
  const current = SCOPES.find((s) => s.value === scope)!;
  return (
    <form onSubmit={onSubmit} className="panel form" aria-labelledby="titulo-gerar">
      <h2 id="titulo-gerar" style={{ fontSize: "var(--text-lg)" }}>
        Gerar um plano
      </h2>
      <fieldset>
        <legend>Tipo de plano</legend>
        <div className="segmented" role="radiogroup" aria-label="Tipo de plano">
          {SCOPES.map((s) => (
            <label key={s.value} className="segmented__option" data-selected={scope === s.value} style={{ cursor: "pointer" }}>
              <input type="radio" name="scope" value={s.value} checked={scope === s.value} onChange={() => setScope(s.value)} className="sr-only" />
              {s.label}
            </label>
          ))}
        </div>
        <p className="field__hint" style={{ marginTop: 6 }}>
          {current.help}
        </p>
      </fieldset>
      <div className="field">
        <label className="field__label" htmlFor="data-plano">
          {scope === "diario" ? "Data" : "Começar em"}
        </label>
        <input id="data-plano" name="startDate" type="date" className="input" min={today} defaultValue={defaultDate} required />
      </div>
      <FormAlert message={state.message} ok={state.ok} />
      <SubmitButton pending={pending} pendingText="Planejando…">Gerar plano</SubmitButton>
      <p className="xsmall muted">O plano aparece como proposta. Nada muda na sua agenda até você aprovar.</p>
    </form>
  );
}
