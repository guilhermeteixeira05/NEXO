"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth/session";
import { logActivity } from "@/lib/history/log";
import { generatePlan } from "@/lib/planning/service";
import { loadUserSnapshot } from "@/lib/snapshot";
import { generatePlanSchema } from "@/lib/validation/schemas";
import type { ActionState } from "@/lib/types";

function revalidatePlanViews() {
  for (const p of ["/planejamento", "/painel", "/tarefas", "/calendario", "/assistente", "/insights"]) revalidatePath(p);
}

export interface GeneratePlanState extends ActionState {
  planId?: string | null;
}

export async function generatePlanAction(_prev: GeneratePlanState, formData: FormData): Promise<GeneratePlanState> {
  const { supabase } = await requireUser();
  const parsed = generatePlanSchema.safeParse({ scope: formData.get("scope"), startDate: formData.get("startDate") });
  if (!parsed.success) return { ok: false, message: "Escolha um tipo de plano e uma data válida." };
  const snapshot = await loadUserSnapshot();
  if (snapshot.availability.length === 0) {
    return { ok: false, message: "Cadastre seus horários livres em Perfil → Disponibilidade para que o NEXO consiga planejar." };
  }
  const generated = await generatePlan(supabase, snapshot, parsed.data.scope, parsed.data.startDate);
  revalidatePlanViews();
  if (!generated.planId) {
    return { ok: true, planId: null, message: "Não há atividades pendentes para planejar neste período. 🎉" };
  }
  return {
    ok: true,
    planId: generated.planId,
    message:
      generated.source === "ia"
        ? "Plano proposto pelo planejador e revisado pela IA. Revise e aprove."
        : `Plano proposto pelo planejador local.${generated.aiFallbackReason ? " " + generated.aiFallbackReason : ""} Revise e aprove.`,
  };
}

/** RF24 / RN08 — aplica o plano em uma transação (função approve_plan no banco). */
export async function approvePlanAction(planId: string): Promise<ActionState> {
  const { supabase } = await requireUser();
  const { data, error } = await supabase.rpc("approve_plan", { p_plan_id: planId });
  if (error) {
    return { ok: false, message: error.message.includes("já foi") ? error.message : "Não foi possível aprovar o plano. Tente novamente." };
  }
  const result = data as { applied: number; skipped: { titulo: string; motivo: string }[] };
  revalidatePlanViews();
  const skipped = result.skipped?.length ? ` ${result.skipped.length} item(ns) ignorado(s): ${result.skipped.map((s) => `“${s.titulo}” (${s.motivo})`).join("; ")}` : "";
  return { ok: true, message: `Plano aprovado: ${result.applied} alteração(ões) aplicada(s).${skipped}` };
}

export async function rejectPlanAction(planId: string): Promise<ActionState> {
  const { supabase, user } = await requireUser();
  const { data, error } = await supabase
    .from("plans")
    .update({ status: "rejeitado", decided_at: new Date().toISOString() })
    .eq("id", planId)
    .eq("user_id", user.id)
    .eq("status", "proposto")
    .select("id")
    .maybeSingle();
  if (error || !data) return { ok: false, message: "Este plano não está mais aguardando decisão." };
  await logActivity(supabase, { userId: user.id, event: "plano_rejeitado", planId });
  revalidatePlanViews();
  return { ok: true, message: "Plano rejeitado. Nada foi alterado na sua agenda." };
}
