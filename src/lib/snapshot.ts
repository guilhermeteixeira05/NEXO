import "server-only";
import { getProfile, requireUser } from "@/lib/auth/session";
import { addDays, localDateString } from "@/lib/dates";
import { fetchHolidaysBetween } from "@/lib/holidays/brasilapi";
import { listActivity } from "@/lib/history/log";
import { listAvailability, listGoals } from "@/lib/profile/queries";
import { listActiveTasks } from "@/lib/tasks/queries";
import type { ActivityLogEntry, AvailabilitySlot, Goal, Holiday, Plan, Profile, Task } from "@/lib/types";

/**
 * Fotografia dos dados do usuário compartilhada pelos módulos (Painel, IA,
 * Planejamento e Insights). Garante que todos trabalhem sobre os MESMOS dados.
 */
export interface UserSnapshot {
  userId: string;
  profile: Profile;
  now: Date;
  today: string;
  tasks: Task[];
  goals: Goal[];
  availability: AvailabilitySlot[];
  activity: ActivityLogEntry[];
  recentPlans: Pick<Plan, "id" | "scope" | "start_date" | "status">[];
  holidays: Holiday[];
  holidaysError: string | null;
}

export async function loadUserSnapshot(opts: { activityDays?: number; holidayDays?: number } = {}): Promise<UserSnapshot> {
  const { supabase, user } = await requireUser();
  const profile = await getProfile();
  const now = new Date();
  const today = localDateString(now, profile.timezone);
  const since = new Date(now.getTime() - (opts.activityDays ?? 30) * 86400000).toISOString();

  const [tasks, goals, availability, activity, plansRes, holidaysRes] = await Promise.all([
    listActiveTasks(supabase, user.id, 7),
    listGoals(supabase, user.id),
    listAvailability(supabase, user.id),
    listActivity(supabase, user.id, { since }),
    supabase
      .from("plans")
      .select("id,scope,start_date,status")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(20),
    fetchHolidaysBetween(today, addDays(today, opts.holidayDays ?? 60)),
  ]);

  return {
    userId: user.id,
    profile,
    now,
    today,
    tasks,
    goals,
    availability,
    activity,
    recentPlans: (plansRes.data ?? []) as UserSnapshot["recentPlans"],
    holidays: holidaysRes.ok ? holidaysRes.holidays : [],
    holidaysError: holidaysRes.ok ? null : holidaysRes.error,
  };
}
