/**
 * Testes REAIS do banco: aplica a migração em um PostgreSQL embutido (PGlite)
 * com um "stub" mínimo do Supabase (schema auth, auth.uid() e papéis) e verifica
 * restrições, Row Level Security e a função approve_plan.
 */
import { readFileSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";
import { beforeAll, describe, expect, it } from "vitest";

const MIGRATION = readFileSync("supabase/migrations/20261123000000_nexo_schema.sql", "utf8");
const SUPABASE_STUB = `
  create role anon nologin;
  create role authenticated nologin;
  create schema auth;
  create table auth.users (id uuid primary key, email text, raw_user_meta_data jsonb not null default '{}'::jsonb);
  create function auth.uid() returns uuid language sql stable
    as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
  grant usage on schema auth to anon, authenticated;
  grant usage on schema public to anon, authenticated;
`;

const A = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const B = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
let db: PGlite;

async function as<T>(uid: string, fn: () => Promise<T>): Promise<T> {
  await db.exec(`set role authenticated; set request.jwt.claim.sub = '${uid}';`);
  try {
    return await fn();
  } finally {
    await db.exec(`reset role; reset request.jwt.claim.sub;`);
  }
}
const q = async (sql: string, params: unknown[] = []) => (await db.query<Record<string, unknown>>(sql, params)).rows;

beforeAll(async () => {
  db = new PGlite();
  await db.exec(SUPABASE_STUB);
  await db.exec(MIGRATION);
  await db.query(`insert into auth.users (id, email, raw_user_meta_data) values ($1, 'a@teste.dev', '{"full_name":"Usuária A"}'), ($2, 'b@teste.dev', '{"full_name":"Usuário B"}')`, [A, B]);
});

describe("migração e gatilhos", () => {
  it("aplica a migração e cria o perfil automaticamente no cadastro", async () => {
    const rows = await q(`select id, full_name, timezone, onboarding_completed from public.profiles order by full_name`);
    expect(rows).toEqual([
      { id: A, full_name: "Usuária A", timezone: "America/Sao_Paulo", onboarding_completed: false },
      { id: B, full_name: "Usuário B", timezone: "America/Sao_Paulo", onboarding_completed: false },
    ]);
  });

  it("restrições: compromisso exige horário e término > início", async () => {
    await as(A, async () => {
      await expect(q(`insert into tasks (title, kind) values ('Sem horário', 'compromisso')`)).rejects.toThrow(/tasks_appointment_has_time/);
      await expect(
        q(`insert into tasks (title, start_at, end_at) values ('Invertido', '2026-11-24T20:00:00Z', '2026-11-24T19:00:00Z')`),
      ).rejects.toThrow(/tasks_time_order/);
      await expect(q(`insert into tasks (title, status) values ('Concluída sem data', 'concluida')`)).rejects.toThrow(/tasks_completed_at/);
      await expect(q(`insert into notifications (kind, title, link) values ('sistema', 'x', 'https://externo.com')`)).rejects.toThrow(/check/);
    });
  });
});

describe("Row Level Security — isolamento entre usuários", () => {
  let taskA: string;
  let goalA: string;

  beforeAll(async () => {
    await as(A, async () => {
      goalA = (await q(`insert into goals (title) values ('Objetivo da A') returning id`))[0].id as string;
      taskA = (await q(`insert into tasks (title, goal_id, due_date) values ('Tarefa da A', $1, '2026-11-24') returning id`, [goalA]))[0].id as string;
    });
  });

  it("o dono lê as próprias linhas; o default user_id = auth.uid() é aplicado", async () => {
    const rows = await as(A, () => q(`select title, user_id from tasks`));
    expect(rows).toEqual([{ title: "Tarefa da A", user_id: A }]);
  });

  it("outro usuário não vê, não altera e não exclui dados da A", async () => {
    await as(B, async () => {
      expect(await q(`select * from tasks`)).toEqual([]);
      expect(await q(`select * from goals`)).toEqual([]);
      expect(await q(`select * from profiles`)).toHaveLength(1); // só o próprio perfil
      expect(await q(`update tasks set title = 'invadido' where id = $1 returning id`, [taskA])).toEqual([]);
      expect(await q(`delete from tasks where id = $1 returning id`, [taskA])).toEqual([]);
    });
    const still = await as(A, () => q(`select title from tasks where id = $1`, [taskA]));
    expect(still).toEqual([{ title: "Tarefa da A" }]);
  });

  it("não é possível gravar em nome de outro usuário nem vincular objetivo alheio", async () => {
    await as(B, async () => {
      await expect(q(`insert into tasks (user_id, title) values ($1, 'forjada')`, [A])).rejects.toThrow(/row-level security/);
      await expect(q(`insert into tasks (title, goal_id) values ('vínculo alheio', $1)`, [goalA])).rejects.toThrow(/row-level security/);
      await expect(q(`insert into reminders (title, remind_at, task_id) values ('x', now(), $1)`, [taskA])).rejects.toThrow(/row-level security/);
    });
  });

  it("histórico é somente inserção (sem editar ou apagar registros)", async () => {
    await as(A, async () => {
      await q(`insert into activity_log (event, task_id, task_title) values ('concluida', $1, 'Tarefa da A')`, [taskA]);
      await expect(q(`update activity_log set event = 'adiada'`)).rejects.toThrow(/permission denied/);
      await expect(q(`delete from activity_log`)).rejects.toThrow(/permission denied/);
    });
  });

  it("perfil: o usuário atualiza o próprio, mas não cria nem apaga perfis", async () => {
    await as(A, async () => {
      expect(await q(`update profiles set occupation = 'Analista' where id = $1 returning occupation`, [A])).toEqual([{ occupation: "Analista" }]);
      expect(await q(`update profiles set occupation = 'x' where id = $1 returning id`, [B])).toEqual([]);
      await expect(q(`delete from profiles where id = $1`, [A])).rejects.toThrow(/permission denied/);
    });
  });

  it("visitante sem login (anon) não acessa nenhuma tabela", async () => {
    await db.exec(`set role anon;`);
    try {
      await expect(q(`select * from tasks`)).rejects.toThrow(/permission denied/);
    } finally {
      await db.exec(`reset role;`);
    }
  });
});

describe("approve_plan — aprovação transacional das propostas (RN08)", () => {
  let task: string;
  let appointment: string;
  let plan: string;

  beforeAll(async () => {
    await as(A, async () => {
      task = (await q(`insert into tasks (title, priority, postponed_count) values ('Estudar inglês', 'media', 3) returning id`))[0].id as string;
      appointment = (
        await q(`insert into tasks (title, kind, start_at, end_at) values ('Treino', 'compromisso', '2026-11-24T21:30:00Z', '2026-11-24T22:30:00Z') returning id`)
      )[0].id as string;
      plan = (await q(`insert into plans (scope, start_date, end_date, source, summary) values ('reorganizacao', '2026-11-24', '2026-11-25', 'ia', 'Teste') returning id`))[0].id as string;
      await q(
        `insert into plan_items (plan_id, task_id, action, title, start_at, end_at, due_date, position) values
           ($1, $2, 'reagendar', 'Estudar inglês', '2026-11-24T23:00:00Z', '2026-11-25T00:00:00Z', '2026-11-24', 0),
           ($1, $3, 'reagendar', 'Treino', '2026-11-25T21:30:00Z', '2026-11-25T22:30:00Z', '2026-11-25', 1)`,
        [plan, task, appointment],
      );
      await q(`insert into plan_items (plan_id, action, title, priority, new_task, due_date, position) values ($1, 'criar', 'Revisar vocabulário', 'alta', '{"category":"estudos","kind":"tarefa","duration_minutes":20}', '2026-11-25', 2)`, [plan]);
      await q(`insert into plan_items (plan_id, task_id, action, title, priority, position) values ($1, $2, 'priorizar', 'Estudar inglês', 'urgente', 3)`, [plan, task]);
    });
  });

  it("outro usuário não consegue aprovar o plano", async () => {
    await expect(as(B, () => q(`select approve_plan($1)`, [plan]))).rejects.toThrow(/Plano não encontrado/);
  });

  it("aplica reagendamentos, criação e prioridade; não move compromisso fixo", async () => {
    const [{ approve_plan: result }] = await as(A, () => q(`select approve_plan($1)`, [plan]));
    expect(result).toMatchObject({ applied: 3 });
    expect((result as { skipped: { titulo: string }[] }).skipped.map((s) => s.titulo)).toEqual(["Treino"]);

    const rows = await as(A, () => q(`select title, priority, due_date::text as due, start_at::text as start, category from tasks order by title`));
    expect(rows).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ title: "Estudar inglês", priority: "urgente", due: "2026-11-24" }),
        expect.objectContaining({ title: "Revisar vocabulário", priority: "alta", category: "estudos" }),
        expect.objectContaining({ title: "Treino", start: expect.stringContaining("2026-11-24") }),
      ]),
    );
    const status = await as(A, () => q(`select status from plans where id = $1`, [plan]));
    expect(status).toEqual([{ status: "aprovado" }]);
    const events = await as(A, () => q(`select event from activity_log where plan_id = $1 order by created_at`, [plan]));
    expect(events.map((e) => e.event)).toEqual(expect.arrayContaining(["reagendada", "criada", "editada", "plano_aprovado"]));
  });

  it("não permite aprovar duas vezes", async () => {
    await expect(as(A, () => q(`select approve_plan($1)`, [plan]))).rejects.toThrow(/já foi aprovado/);
  });
});
