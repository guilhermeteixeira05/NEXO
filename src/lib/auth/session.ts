import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DEFAULT_TZ } from "@/lib/dates";
import { isSupabaseConfigured } from "@/lib/env";
import type { Profile } from "@/lib/types";

/**
 * Retorna o usuário autenticado ou redireciona para /entrar.
 * Deve ser chamado em toda página e Server Action autenticada (defesa em profundidade:
 * proxy → servidor → RLS no banco).
 */
export const requireUser = cache(async () => {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) redirect("/entrar");
  return { supabase, user: data.user };
});

/**
 * Versão para Route Handlers que precisam responder com erro em vez de redirecionar.
 * Sem Supabase configurado, retorna usuário nulo (a rota responde 401).
 */
export async function getUserOrNull() {
  if (!isSupabaseConfigured()) return { supabase: null, user: null };
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  return { supabase, user: data.user ?? null };
}

export const getProfile = cache(async (): Promise<Profile> => {
  const { supabase, user } = await requireUser();
  const { data } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
  if (data) return data as Profile;
  // Perfil ausente (ex.: gatilho não aplicado): valores padrão seguros.
  return {
    id: user.id,
    full_name: (user.user_metadata?.full_name as string) ?? "",
    occupation: null,
    timezone: DEFAULT_TZ,
    focus_period: "manha",
    default_task_minutes: 30,
    reminder_lead_minutes: 15,
    proactive_enabled: true,
    theme: "sistema",
    onboarding_completed: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
});

export function firstName(fullName: string): string {
  return fullName.trim().split(/\s+/)[0] || "";
}
