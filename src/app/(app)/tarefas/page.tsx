import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/Misc";
import { TaskBoard } from "@/components/tasks/TaskBoard";
import { getProfile, requireUser } from "@/lib/auth/session";
import { localDateString } from "@/lib/dates";
import { listGoals } from "@/lib/profile/queries";
import { listActiveTasks } from "@/lib/tasks/queries";
import { isOverdue } from "@/lib/tasks/rules";

export const metadata: Metadata = { title: "Tarefas" };

export default async function TasksPage() {
  const { supabase, user } = await requireUser();
  const profile = await getProfile();
  const [tasks, goals] = await Promise.all([listActiveTasks(supabase, user.id, 7), listGoals(supabase, user.id, { status: "ativo" })]);
  const now = new Date();
  const pending = tasks.filter((t) => t.status === "pendente");
  const overdue = pending.filter((t) => isOverdue(t, now, profile.timezone)).length;
  return (
    <>
      <PageHeader
        title="Tarefas"
        subtitle={`${pending.length} pendente${pending.length === 1 ? "" : "s"}${overdue ? ` · ${overdue} atrasada${overdue === 1 ? "" : "s"}` : ""}`}
      />
      <TaskBoard
        tasks={tasks}
        goals={goals.map((g) => ({ id: g.id, title: g.title }))}
        tz={profile.timezone}
        today={localDateString(now, profile.timezone)}
        nowIso={now.toISOString()}
      />
    </>
  );
}
