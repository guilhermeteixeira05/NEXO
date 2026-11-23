"use client";

import Link from "next/link";
import { useActionState } from "react";
import { FormAlert, TextField } from "@/components/ui/Field";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { signInAction, signUpAction } from "@/lib/auth/actions";
import { initialActionState } from "@/lib/types";

export function SignInForm({ next, notice }: { next?: string; notice?: string }) {
  const [state, action] = useActionState(signInAction, initialActionState);
  const e = state.fieldErrors ?? {};
  return (
    <form action={action} className="form" noValidate>
      {notice ? <FormAlert message={notice} ok={false} /> : null}
      <FormAlert message={state.message} ok={state.ok} />
      <input type="hidden" name="next" value={next ?? "/painel"} />
      <TextField label="E-mail" name="email" type="email" autoComplete="email" inputMode="email" required errors={e.email} />
      <TextField label="Senha" name="password" type="password" autoComplete="current-password" required errors={e.password} />
      <SubmitButton block pendingText="Entrando…">
        Entrar
      </SubmitButton>
      <p className="small secondary">
        Ainda não tem conta? <Link href="/cadastro">Criar conta</Link>
      </p>
    </form>
  );
}

export function SignUpForm() {
  const [state, action] = useActionState(signUpAction, initialActionState);
  const e = state.fieldErrors ?? {};
  if (state.ok) {
    return (
      <div className="stack">
        <FormAlert message={state.message} ok />
        <Link href="/entrar" className="btn btn--secondary">
          Ir para Entrar
        </Link>
      </div>
    );
  }
  return (
    <form action={action} className="form" noValidate>
      <FormAlert message={state.message} ok={false} />
      <TextField label="Nome" name="fullName" autoComplete="name" required maxLength={120} hint="Como o NEXO vai te chamar." errors={e.fullName} />
      <TextField label="E-mail" name="email" type="email" autoComplete="email" inputMode="email" required errors={e.email} />
      <TextField
        label="Senha"
        name="password"
        type="password"
        autoComplete="new-password"
        required
        minLength={8}
        hint="Mínimo de 8 caracteres."
        errors={e.password}
      />
      <SubmitButton block pendingText="Criando conta…">
        Criar conta
      </SubmitButton>
      <p className="small secondary">
        Já tem conta? <Link href="/entrar">Entrar</Link>
      </p>
    </form>
  );
}
