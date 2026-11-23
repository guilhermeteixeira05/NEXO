import "server-only";
import type { ServerSupabase } from "@/lib/supabase/server";
import type { AvailabilitySlot, Goal } from "@/lib/types";

export async function listAvailability(supabase: ServerSupabase, userId: string): Promise<AvailabilitySlot[]> {
  const { data } = await supabase
    .from("availability")
    .select("*")
    .eq("user_id", userId)
    .order("weekday")
    .order("start_time");
  return (data ?? []) as AvailabilitySlot[];
}

export async function listGoals(
  supabase: ServerSupabase,
  userId: string,
  opts: { status?: Goal["status"] } = {},
): Promise<Goal[]> {
  let q = supabase.from("goals").select("*").eq("user_id", userId);
  if (opts.status) q = q.eq("status", opts.status);
  const { data } = await q.order("status").order("target_date", { ascending: true, nullsFirst: false }).order("created_at");
  return (data ?? []) as Goal[];
}
