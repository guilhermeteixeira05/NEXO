"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getSiteUrl } from "@/lib/env";
import { fieldErrorsOf, signInSchema, signUpSchema } from "@/lib/validation/schemas";
import type { ActionState } from "@/lib/types";

/** Aceita apenas caminhos internos como destino após o login (evita redirecionamento aberto). */
function safeNext(value: FormDataEntryValue | null): string {
  const v = typeof value === "string" ? value : "";
  return v.startsWith("/") && !v.startsWith("//") ? v : "/painel";
}

export async function signUpAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = signUpSchema.safeParse({
    fullName: formData.get("fullName"),
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) return { ok: false, message: "Revise os campos destacados.", fieldErrors: fieldErrorsOf(parsed.error) };

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: { full_name: parsed.data.fullName },
      emailRedirectTo: `${getSiteUrl()}/auth/confirm?next=/configuracao-inicial`,
    },
  });
  if (error) {
    const msg = /already|registered/i.test(error.message)
      ? "Este e-mail já está cadastrado. Tente entrar."
      : /password/i.test(error.message)
        ? "Senha recusada: use pelo menos 8 caracteres, misturando letras e números."
        : "Não foi possível criar a conta agora. Tente novamente em instantes.";
    return { ok: false, message: msg };
  }
  if (!data.session) {
    // Projeto com confirmação de e-mail ativada.
    return { ok: true, message: "Conta criada! Enviamos um link de confirmação para o seu e-mail. Abra-o para continuar." };
  }
  revalidatePath("/", "layout");
  redirect("/configuracao-inicial");
}

export async function signInAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = signInSchema.safeParse({ email: formData.get("email"), password: formData.get("password") });
  if (!parsed.success) return { ok: false, message: "Revise os campos destacados.", fieldErrors: fieldErrorsOf(parsed.error) };
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) {
    return {
      ok: false,
      message: /confirm/i.test(error.message)
        ? "Confirme seu e-mail antes de entrar (verifique a caixa de entrada e o spam)."
        : "E-mail ou senha incorretos.",
    };
  }
  revalidatePath("/", "layout");
  redirect(safeNext(formData.get("next")));
}

export async function signOutAction(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/entrar");
}
