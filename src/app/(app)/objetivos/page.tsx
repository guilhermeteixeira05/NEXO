import type { Metadata } from "next";
import { GoalCard, NewGoalButton } from "@/components/goals/GoalCard";
import { EmptyState, PageHeader } from "@/components/ui/Misc";
import { requireUser } from "@/lib/auth/session";
import { listGoals } from "@/lib/profile/queries";

export const metadata: Metadata = { title: "Objetivos" };

export default async function GoalsPage() {
  const { supabase, user } = await requireUser();
  const [goals, { data: linked }] = await Promise.all([
    listGoals(supabase, user.id),
    supabase.from("tasks").select("goal_id,status").eq("user_id", user.id).not("goal_id", "is", null),
  ]);
  const stats = new Map<string, { done: number; total: number }>();
  for (const t of (linked ?? []) as { goal_id: string; status: string }[]) {
    const s = stats.get(t.goal_id) ?? { done: 0, total: 0 };
    s.total++;
    if (t.status === "concluida") s.done++;
    stats.set(t.goal_id, s);
  }
  return (
    <>
      <PageHeader
        title="Objetivos"
        subtitle="Metas que orientam a priorização das suas atividades. Vincule tarefas a um objetivo ao criá-las."
        actions={<NewGoalButton />}
      />
      {goals.length ? (
        <ul className="cards" role="list">
          {goals.map((g) => (
            <GoalCard key={g.id} goal={g} linkedDone={stats.get(g.id)?.done ?? 0} linkedTotal={stats.get(g.id)?.total ?? 0} />
          ))}
        </ul>
      ) : (
        <EmptyState title="Você ainda não tem objetivos.">
          Crie o primeiro objetivo — por exemplo, “Treinar 3 vezes por semana” — e vincule atividades a ele.
        </EmptyState>
      )}
    </>
  );
}
