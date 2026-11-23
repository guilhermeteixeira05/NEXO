"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/session";
import { logActivity } from "@/lib/history/log";
import {
  availabilitySchema,
  fieldErrorsOf,
  goalSchema,
  passwordSchema,
  preferencesSchema,
  profileSchema,
  themeSchema,
} from "@/lib/validation/schemas";
import type { ActionState } from "@/lib/types";
import { THEME_COOKIE } from "@/lib/constants";

function parseAvailability(raw: FormDataEntryValue | null) {
  try {
    return availabilitySchema.safeParse(JSON.parse(String(raw ?? "[]")));
  } catch {
    return availabilitySchema.safeParse(null);
  }
}

export async function updateProfileAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const { supabase, user } = await requireUser();
  const parsed = profileSchema.safeParse({
    fullName: formData.get("fullName"),
    occupation: formData.get("occupation"),
    timezone: formData.get("timezone") || "America/Sao_Paulo",
  });
  if (!parsed.success) return { ok: false, message: "Revise os campos destacados.", fieldErrors: fieldErrorsOf(parsed.error) };
  const { error } = await supabase
    .from("profiles")
    .update({ full_name: parsed.data.fullName, occupation: parsed.data.occupation ?? null, timezone: parsed.data.timezone })
    .eq("id", user.id);
  if (error) return { ok: false, message: "Não foi possível salvar o perfil. Tente novamente." };
  revalidatePath("/", "layout");
  return { ok: true, message: "Perfil salvo." };
}

export async function updatePreferencesAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const { supabase, user } = await requireUser();
  const parsed = preferencesSchema.safeParse({
    focusPeriod: formData.get("focusPeriod"),
    defaultTaskMinutes: formData.get("defaultTaskMinutes"),
    reminderLeadMinutes: formData.get("reminderLeadMinutes"),
    proactiveEnabled: formData.get("proactiveEnabled") === "on",
  });
  if (!parsed.success) return { ok: false, message: "Revise os campos destacados.", fieldErrors: fieldErrorsOf(parsed.error) };
  const { error } = await supabase
    .from("profiles")
    .update({
      focus_period: parsed.data.focusPeriod,
      default_task_minutes: parsed.data.defaultTaskMinutes,
      reminder_lead_minutes: parsed.data.reminderLeadMinutes,
      proactive_enabled: parsed.data.proactiveEnabled,
    })
    .eq("id", user.id);
  if (error) return { ok: false, message: "Não foi possível salvar as preferências." };
  revalidatePath("/", "layout");
  return { ok: true, message: "Preferências salvas." };
}

async function replaceAvailability(
  supabase: Awaited<ReturnType<typeof requireUser>>["supabase"],
  userId: string,
  slots: { weekday: number; start: string; end: string }[],
): Promise<boolean> {
  const del = await supabase.from("availability").delete().eq("user_id", userId);
  if (del.error) return false;
  if (slots.length === 0) return true;
  const ins = await supabase
    .from("availability")
    .insert(slots.map((s) => ({ user_id: userId, weekday: s.weekday, start_time: s.start, end_time: s.end })));
  return !ins.error;
}

export async function saveAvailabilityAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const { supabase, user } = await requireUser();
  const parsed = parseAvailability(formData.get("slots"));
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message ?? "Horários inválidos." };
  const ok = await replaceAvailability(supabase, user.id, parsed.data);
  if (!ok) return { ok: false, message: "Não foi possível salvar a disponibilidade." };
  revalidatePath("/", "layout");
  return { ok: true, message: "Disponibilidade salva. O planejamento passa a usar estes horários." };
}

export async function setThemeAction(theme: string): Promise<ActionState> {
  const { supabase, user } = await requireUser();
  const parsed = themeSchema.safeParse(theme);
  if (!parsed.success) return { ok: false, message: "Tema inválido." };
  await supabase.from("profiles").update({ theme: parsed.data }).eq("id", user.id);
  const store = await cookies();
  store.set(THEME_COOKIE, parsed.data, { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax" });
  revalidatePath("/", "layout");
  return { ok: true, message: "Tema atualizado." };
}

export async function setProactiveAction(enabled: boolean): Promise<ActionState> {
  const { supabase, user } = await requireUser();
  const { error } = await supabase.from("profiles").update({ proactive_enabled: Boolean(enabled) }).eq("id", user.id);
  if (error) return { ok: false, message: "Não foi possível alterar o assistente proativo." };
  revalidatePath("/", "layout");
  return { ok: true, message: enabled ? "Assistente proativo ativado." : "Assistente proativo desligado." };
}

export async function changePasswordAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const { supabase } = await requireUser();
  const parsed = passwordSchema.safeParse({ password: formData.get("password"), confirm: formData.get("confirm") });
  if (!parsed.success) return { ok: false, message: "Revise os campos destacados.", fieldErrors: fieldErrorsOf(parsed.error) };
  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) return { ok: false, message: "Não foi possível alterar a senha. Entre novamente e tente outra vez." };
  return { ok: true, message: "Senha alterada com sucesso." };
}

/** Configuração inicial (RF03): todas as etapas são opcionais. */
export async function completeOnboardingAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const { supabase, user } = await requireUser();
  const profile = profileSchema.safeParse({
    fullName: formData.get("fullName"),
    occupation: formData.get("occupation"),
    timezone: formData.get("timezone") || "America/Sao_Paulo",
  });
  const prefs = preferencesSchema.safeParse({
    focusPeriod: formData.get("focusPeriod") || "manha",
    defaultTaskMinutes: formData.get("defaultTaskMinutes") || 30,
    reminderLeadMinutes: formData.get("reminderLeadMinutes") || 15,
    proactiveEnabled: formData.get("proactiveEnabled") === "on",
  });
  const slots = parseAvailability(formData.get("slots"));
  const goalTitle = String(formData.get("goalTitle") ?? "").trim();
  const goal = goalTitle
    ? goalSchema.safeParse({
        title: goalTitle,
        category: formData.get("goalCategory") || "pessoal",
        targetDate: formData.get("goalTargetDate"),
        status: "ativo",
        progress: 0,
      })
    : null;

  const errors = {
    ...(profile.success ? {} : fieldErrorsOf(profile.error)),
    ...(prefs.success ? {} : fieldErrorsOf(prefs.error)),
    ...(goal && !goal.success ? Object.fromEntries(Object.entries(fieldErrorsOf(goal.error)).map(([k, v]) => [`goal.${k}`, v])) : {}),
  };
  if (!slots.success) errors.slots = [slots.error.issues[0]?.message ?? "Horários inválidos."];
  if (Object.keys(errors).length > 0) return { ok: false, message: "Revise as informações destacadas.", fieldErrors: errors };

  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: profile.data!.fullName,
      occupation: profile.data!.occupation ?? null,
      timezone: profile.data!.timezone,
      focus_period: prefs.data!.focusPeriod,
      default_task_minutes: prefs.data!.defaultTaskMinutes,
      reminder_lead_minutes: prefs.data!.reminderLeadMinutes,
      proactive_enabled: prefs.data!.proactiveEnabled,
      onboarding_completed: true,
    })
    .eq("id", user.id);
  if (error) return { ok: false, message: "Não foi possível salvar sua configuração. Tente novamente." };
  if (slots.data!.length > 0) await replaceAvailability(supabase, user.id, slots.data!);
  if (goal?.success) {
    await supabase.from("goals").insert({
      user_id: user.id,
      title: goal.data.title,
      category: goal.data.category,
      target_date: goal.data.targetDate ?? null,
    });
  }
  revalidatePath("/", "layout");
  redirect("/painel?bemvindo=1");
}

export async function skipOnboardingAction(): Promise<void> {
  const { supabase, user } = await requireUser();
  await supabase.from("profiles").update({ onboarding_completed: true }).eq("id", user.id);
  revalidatePath("/", "layout");
  redirect("/painel");
}

// ----------------------------------------------------------------------------
// Objetivos (RF06)
// ----------------------------------------------------------------------------
function goalFromForm(formData: FormData) {
  return goalSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description"),
    category: formData.get("category"),
    targetDate: formData.get("targetDate"),
    status: formData.get("status") || "ativo",
    progress: formData.get("progress") ?? 0,
  });
}

export async function saveGoalAction(goalId: string | null, _prev: ActionState, formData: FormData): Promise<ActionState> {
  const { supabase, user } = await requireUser();
  const parsed = goalFromForm(formData);
  if (!parsed.success) return { ok: false, message: "Revise os campos destacados.", fieldErrors: fieldErrorsOf(parsed.error) };
  const row = {
    title: parsed.data.title,
    description: parsed.data.description ?? null,
    category: parsed.data.category,
    target_date: parsed.data.targetDate ?? null,
    status: parsed.data.status,
    progress: parsed.data.status === "concluido" ? 100 : parsed.data.progress,
  };
  if (goalId) {
    const { data: before } = await supabase.from("goals").select("status").eq("id", goalId).eq("user_id", user.id).maybeSingle();
    const { error } = await supabase.from("goals").update(row).eq("id", goalId).eq("user_id", user.id);
    if (error) return { ok: false, message: "Não foi possível salvar o objetivo." };
    if (before && before.status !== "concluido" && row.status === "concluido") {
      await logActivity(supabase, { userId: user.id, event: "objetivo_concluido", title: row.title, category: row.category });
    }
  } else {
    const { error } = await supabase.from("goals").insert({ ...row, user_id: user.id });
    if (error) return { ok: false, message: "Não foi possível criar o objetivo." };
  }
  revalidatePath("/objetivos");
  revalidatePath("/painel");
  return { ok: true, message: goalId ? "Objetivo atualizado." : "Objetivo criado." };
}

export async function deleteGoalAction(goalId: string): Promise<ActionState> {
  const { supabase, user } = await requireUser();
  const { error } = await supabase.from("goals").delete().eq("id", goalId).eq("user_id", user.id);
  if (error) return { ok: false, message: "Não foi possível excluir o objetivo." };
  revalidatePath("/objetivos");
  revalidatePath("/painel");
  return { ok: true, message: "Objetivo excluído. As atividades vinculadas foram mantidas." };
}
