"use client";

import { useRef, useState, useTransition } from "react";
import { useActionForm } from "@/components/ui/useActionForm";
import { AvailabilityEditor, type Slot } from "@/components/profile/AvailabilityEditor";
import { FormAlert, SelectField, SwitchField, TextField } from "@/components/ui/Field";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { completeOnboardingAction, skipOnboardingAction } from "@/lib/profile/actions";
import { CATEGORIES, CATEGORY_LABELS, FOCUS_LABELS, FOCUS_PERIODS, initialActionState } from "@/lib/types";

const STEPS = ["Sobre você", "Preferências", "Horários livres", "Primeiro objetivo"];

/**
 * Configuração inicial em 4 etapas (RF03). Todas as etapas ficam no mesmo formulário
 * (as ocultas continuam no DOM), e o envio final valida tudo no servidor.
 */
export function OnboardingWizard({ defaultName, initialSlots }: { defaultName: string; initialSlots: Slot[] }) {
  const [step, setStep] = useState(0);
  const { state, pending, onSubmit } = useActionForm(completeOnboardingAction, initialActionState);
  const [skipping, startSkip] = useTransition();
  const headingRef = useRef<HTMLHeadingElement>(null);
  const e = state.fieldErrors ?? {};

  const go = (n: number) => {
    setStep(n);
    requestAnimationFrame(() => headingRef.current?.focus());
  };

  return (
    <div className="wizard">
      <div className="wizard__progress" aria-hidden="true">
        {STEPS.map((s, i) => (
          <span key={s} className={`wizard__step${i <= step ? " wizard__step--done" : ""}`} />
        ))}
      </div>
      <p className="section-label" aria-live="polite">
        Etapa {step + 1} de {STEPS.length} · {STEPS[step]}
      </p>
      <form onSubmit={onSubmit} className="form" noValidate>
        <FormAlert message={state.ok ? undefined : state.message} ok={false} />

        <section hidden={step !== 0} className="form" aria-labelledby="etapa-1">
          <h1 id="etapa-1" ref={step === 0 ? headingRef : undefined} tabIndex={-1}>
            Vamos conhecer você
          </h1>
          <TextField label="Como podemos te chamar?" name="fullName" defaultValue={defaultName} required maxLength={120} autoComplete="name" errors={e.fullName} />
          <TextField label="Ocupação" name="occupation" optional maxLength={120} placeholder="Ex.: estudante e estagiário" errors={e.occupation} />
          <SelectField
            label="Fuso horário"
            name="timezone"
            defaultValue="America/Sao_Paulo"
            options={[
              { value: "America/Sao_Paulo", label: "Brasília (UTC−3)" },
              { value: "America/Manaus", label: "Amazonas (UTC−4)" },
              { value: "America/Rio_Branco", label: "Acre (UTC−5)" },
              { value: "America/Noronha", label: "Fernando de Noronha (UTC−2)" },
            ]}
          />
        </section>

        <section hidden={step !== 1} className="form" aria-labelledby="etapa-2">
          <h1 id="etapa-2" ref={step === 1 ? headingRef : undefined} tabIndex={-1}>
            Suas preferências
          </h1>
          <SelectField
            label="Em que período você rende mais?"
            name="focusPeriod"
            defaultValue="manha"
            options={FOCUS_PERIODS.map((f) => ({ value: f, label: FOCUS_LABELS[f] }))}
            hint="O planejamento prioriza atividades importantes nesse período."
            errors={e.focusPeriod}
          />
          <div className="form-row form-row--2">
            <TextField label="Duração padrão de uma tarefa (min)" name="defaultTaskMinutes" type="number" min={5} max={480} step={5} defaultValue={30} errors={e.defaultTaskMinutes} />
            <TextField label="Antecedência dos lembretes (min)" name="reminderLeadMinutes" type="number" min={0} max={1440} step={5} defaultValue={15} errors={e.reminderLeadMinutes} />
          </div>
          <SwitchField label="Assistente proativo" name="proactiveEnabled" defaultChecked description="Receber alertas e recomendações no Painel. Você pode mudar depois." />
        </section>

        <section hidden={step !== 2} className="form" aria-labelledby="etapa-3">
          <h1 id="etapa-3" ref={step === 2 ? headingRef : undefined} tabIndex={-1}>
            Quando você tem tempo livre?
          </h1>
          <p className="secondary small">O NEXO só encaixa tarefas dentro desses horários. Você pode alterar depois em Perfil.</p>
          {e.slots ? <FormAlert message={e.slots[0]} ok={false} /> : null}
          <AvailabilityEditor initial={initialSlots} />
        </section>

        <section hidden={step !== 3} className="form" aria-labelledby="etapa-4">
          <h1 id="etapa-4" ref={step === 3 ? headingRef : undefined} tabIndex={-1}>
            Um objetivo para começar
          </h1>
          <p className="secondary small">Opcional. Objetivos ajudam o NEXO a priorizar atividades relacionadas.</p>
          <TextField label="Objetivo" name="goalTitle" optional maxLength={120} placeholder="Ex.: Treinar 3 vezes por semana" errors={e["goal.title"]} />
          <div className="form-row form-row--2">
            <SelectField label="Categoria" name="goalCategory" defaultValue="pessoal" options={CATEGORIES.map((c) => ({ value: c, label: CATEGORY_LABELS[c] }))} />
            <TextField label="Prazo" name="goalTargetDate" type="date" optional errors={e["goal.targetDate"]} />
          </div>
        </section>

        <div className="actions" style={{ justifyContent: "space-between" }}>
          {step > 0 ? (
            <button type="button" className="btn btn--ghost" onClick={() => go(step - 1)}>
              Voltar
            </button>
          ) : (
            <button type="button" className="btn btn--ghost" disabled={pending || skipping} onClick={() => startSkip(() => skipOnboardingAction())}>
              Pular configuração
            </button>
          )}
          {step < STEPS.length - 1 ? (
            <button type="button" className="btn btn--primary" onClick={() => go(step + 1)}>
              Continuar
            </button>
          ) : (
            <SubmitButton pending={pending} pendingText="Salvando…">Concluir</SubmitButton>
          )}
        </div>
      </form>
    </div>
  );
}
