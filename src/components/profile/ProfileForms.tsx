"use client";

import { useActionForm } from "@/components/ui/useActionForm";
import { useEffect, useRef, useState, useTransition } from "react";
import { AvailabilityEditor, type Slot } from "@/components/profile/AvailabilityEditor";
import { FormAlert, SelectField, SwitchField, TextField } from "@/components/ui/Field";
import { Icon } from "@/components/ui/Icon";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { useToast } from "@/components/ui/Toast";
import {
  changePasswordAction,
  saveAvailabilityAction,
  setProactiveAction,
  setThemeAction,
  updatePreferencesAction,
  updateProfileAction,
} from "@/lib/profile/actions";
import { FOCUS_LABELS, FOCUS_PERIODS, initialActionState, type Profile, type ThemePreference } from "@/lib/types";

export function ProfileForm({ profile, email }: { profile: Profile; email: string }) {
  const { state, pending, onSubmit } = useActionForm(updateProfileAction, initialActionState);
  const e = state.fieldErrors ?? {};
  return (
    <form onSubmit={onSubmit} className="form" noValidate aria-labelledby="titulo-dados">
      <h2 id="titulo-dados" style={{ fontSize: "var(--text-lg)" }}>
        Dados pessoais
      </h2>
      <FormAlert message={state.message} ok={state.ok} />
      <TextField label="Nome" name="fullName" defaultValue={profile.full_name} required maxLength={120} autoComplete="name" errors={e.fullName} />
      <TextField label="E-mail" name="email" value={email} readOnly hint="O e-mail de acesso não é enviado à IA." />
      <div className="form-row form-row--2">
        <TextField label="Ocupação" name="occupation" defaultValue={profile.occupation ?? ""} optional maxLength={120} errors={e.occupation} />
        <SelectField
          label="Fuso horário"
          name="timezone"
          defaultValue={profile.timezone}
          options={[
            { value: "America/Sao_Paulo", label: "Brasília (UTC−3)" },
            { value: "America/Manaus", label: "Amazonas (UTC−4)" },
            { value: "America/Rio_Branco", label: "Acre (UTC−5)" },
            { value: "America/Noronha", label: "Fernando de Noronha (UTC−2)" },
          ]}
        />
      </div>
      <div className="actions actions--end">
        <SubmitButton pending={pending}>Salvar dados</SubmitButton>
      </div>
    </form>
  );
}

export function PreferencesForm({ profile }: { profile: Profile }) {
  const { state, pending, onSubmit } = useActionForm(updatePreferencesAction, initialActionState);
  const e = state.fieldErrors ?? {};
  return (
    <form onSubmit={onSubmit} className="form" noValidate aria-labelledby="titulo-preferencias">
      <h2 id="titulo-preferencias" style={{ fontSize: "var(--text-lg)" }}>
        Preferências
      </h2>
      <FormAlert message={state.message} ok={state.ok} />
      <SelectField
        label="Período de maior foco"
        name="focusPeriod"
        defaultValue={profile.focus_period}
        options={FOCUS_PERIODS.map((f) => ({ value: f, label: FOCUS_LABELS[f] }))}
        hint="A IA prioriza atividades importantes nesse período."
        errors={e.focusPeriod}
      />
      <div className="form-row form-row--2">
        <TextField label="Duração padrão de tarefa (min)" name="defaultTaskMinutes" type="number" min={5} max={480} step={5} defaultValue={profile.default_task_minutes} errors={e.defaultTaskMinutes} />
        <TextField label="Antecedência dos lembretes (min)" name="reminderLeadMinutes" type="number" min={0} max={1440} step={5} defaultValue={profile.reminder_lead_minutes} errors={e.reminderLeadMinutes} />
      </div>
      <SwitchField label="Assistente proativo" name="proactiveEnabled" defaultChecked={profile.proactive_enabled} description="Alertas e recomendações no Painel." />
      <div className="actions actions--end">
        <SubmitButton pending={pending}>Salvar preferências</SubmitButton>
      </div>
    </form>
  );
}

export function AvailabilityForm({ initial }: { initial: Slot[] }) {
  const { state, pending, onSubmit } = useActionForm(saveAvailabilityAction, initialActionState);
  return (
    <form onSubmit={onSubmit} className="form" noValidate aria-labelledby="titulo-disp">
      <h2 id="titulo-disp" style={{ fontSize: "var(--text-lg)" }}>
        Disponibilidade semanal
      </h2>
      <p className="small secondary">Janelas em que você tem tempo livre para tarefas. Compromissos com horário fixo não precisam estar aqui.</p>
      <FormAlert message={state.message} ok={state.ok} />
      <AvailabilityEditor initial={initial} />
      <div className="actions actions--end">
        <SubmitButton pending={pending}>Salvar disponibilidade</SubmitButton>
      </div>
    </form>
  );
}

export function ThemeSwitcher({ current }: { current: ThemePreference }) {
  const toast = useToast();
  const [theme, setTheme] = useState(current);
  const [pending, start] = useTransition();
  const options: { value: ThemePreference; label: string; icon: "configuracoes" | "sol" | "lua" }[] = [
    { value: "sistema", label: "Sistema", icon: "configuracoes" },
    { value: "claro", label: "Claro", icon: "sol" },
    { value: "escuro", label: "Escuro", icon: "lua" },
  ];
  const choose = (value: ThemePreference) =>
    start(async () => {
      setTheme(value);
      if (value === "sistema") document.documentElement.removeAttribute("data-theme");
      else document.documentElement.setAttribute("data-theme", value);
      const r = await setThemeAction(value);
      toast(r.message ?? "", r.ok ? "info" : "error");
    });
  return (
    <div className="segmented" role="group" aria-label="Tema da interface" aria-busy={pending}>
      {options.map((o) => (
        <button key={o.value} type="button" className="segmented__option" aria-pressed={theme === o.value} onClick={() => choose(o.value)}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
            <Icon name={o.icon} size={18} />
            {o.label}
          </span>
        </button>
      ))}
    </div>
  );
}

export function ProactiveSwitch({ enabled }: { enabled: boolean }) {
  const toast = useToast();
  const [on, setOn] = useState(enabled);
  const [pending, start] = useTransition();
  return (
    <SwitchField
      label="Assistente proativo"
      name="proactive"
      checked={on}
      disabled={pending}
      description="Briefing diário com lembretes, alertas e recomendações no Painel."
      onChange={() =>
        start(async () => {
          const next = !on;
          setOn(next);
          const r = await setProactiveAction(next);
          toast(r.message ?? "", r.ok ? "info" : "error");
          if (!r.ok) setOn(!next);
        })
      }
    />
  );
}

export function PasswordForm() {
  const { state, pending, onSubmit } = useActionForm(changePasswordAction, initialActionState);
  const formRef = useRef<HTMLFormElement>(null);
  const e = state.fieldErrors ?? {};
  useEffect(() => {
    if (state.ok) formRef.current?.reset(); // limpa os campos de senha após sucesso
  }, [state]);
  return (
    <form ref={formRef} onSubmit={onSubmit} className="form" noValidate aria-labelledby="titulo-senha">
      <h2 id="titulo-senha" style={{ fontSize: "var(--text-lg)" }}>
        Segurança
      </h2>
      <FormAlert message={state.message} ok={state.ok} />
      <div className="form-row form-row--2">
        <TextField label="Nova senha" name="password" type="password" autoComplete="new-password" minLength={8} required hint="Mínimo de 8 caracteres." errors={e.password} />
        <TextField label="Confirmar nova senha" name="confirm" type="password" autoComplete="new-password" required errors={e.confirm} />
      </div>
      <div className="actions actions--end">
        <SubmitButton pending={pending} variant="secondary">Alterar senha</SubmitButton>
      </div>
    </form>
  );
}
