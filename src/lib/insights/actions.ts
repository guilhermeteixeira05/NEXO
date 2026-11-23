"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth/session";
import { isValidDateStr, startOfWeekMonday } from "@/lib/dates";
import { createWeeklySummary, getBriefing } from "@/lib/insights/service";
import { loadUserSnapshot } from "@/lib/snapshot";
import type { ActionState } from "@/lib/types";

export async function refreshBriefingAction(): Promise<ActionState> {
  const { supabase } = await requireUser();
  const snapshot = await loadUserSnapshot();
  const b = await getBriefing(supabase, snapshot, { refresh: true });
  revalidatePath("/painel");
  if (!b) return { ok: false, message: "O assistente proativo está desligado nas Configurações." };
  return { ok: true, message: b.source === "ia" ? "Briefing atualizado pela IA." : "Briefing atualizado (regras locais)." };
}

export async function generateWeeklySummaryAction(weekStart: string): Promise<ActionState> {
  const { supabase } = await requireUser();
  const snapshot = await loadUserSnapshot({ activityDays: 45 });
  const start = isValidDateStr(weekStart) ? startOfWeekMonday(weekStart) : startOfWeekMonday(snapshot.today);
  const s = await createWeeklySummary(supabase, snapshot, start);
  revalidatePath("/insights");
  return {
    ok: true,
    message: s.source === "ia" ? "Resumo semanal gerado pela IA." : "Resumo semanal gerado pelas regras locais (IA não configurada).",
  };
}
