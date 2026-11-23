-- =============================================================================
-- NEXO — Assistente Pessoal Inteligente
-- Migração inicial: tabelas, restrições, índices, gatilhos, RLS e funções.
--
-- Como aplicar: Supabase Dashboard → SQL Editor → colar e executar este arquivo
-- (ou `supabase db push` com a CLI). Ver docs/arquitetura-aplicacao.md.
--
-- Segurança: TODAS as tabelas têm Row Level Security. Cada usuário só lê e
-- altera as próprias linhas (user_id = auth.uid()). Referências entre tabelas
-- (ex.: tarefa → objetivo) também são verificadas contra o dono.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Utilitário: atualizar updated_at
-- -----------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- -----------------------------------------------------------------------------
-- Módulo 1 — Usuários e perfil
-- -----------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null default '' check (char_length(full_name) <= 120),
  occupation text check (char_length(occupation) <= 120),
  timezone text not null default 'America/Sao_Paulo' check (char_length(timezone) <= 64),
  focus_period text not null default 'manha' check (focus_period in ('manha', 'tarde', 'noite')),
  default_task_minutes integer not null default 30 check (default_task_minutes between 5 and 480),
  reminder_lead_minutes integer not null default 15 check (reminder_lead_minutes between 0 and 1440),
  proactive_enabled boolean not null default true,
  theme text not null default 'sistema' check (theme in ('sistema', 'claro', 'escuro')),
  onboarding_completed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger profiles_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();

-- Cria o perfil automaticamente quando uma conta é criada no Supabase Auth.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(left(new.raw_user_meta_data ->> 'full_name', 120), ''));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create table public.goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  title text not null check (char_length(title) between 1 and 120),
  description text check (char_length(description) <= 1000),
  category text not null default 'pessoal'
    check (category in ('trabalho', 'estudos', 'pessoal', 'saude', 'casa', 'financas', 'outros')),
  target_date date,
  status text not null default 'ativo' check (status in ('ativo', 'concluido', 'pausado')),
  progress integer not null default 0 check (progress between 0 and 100),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index goals_user_idx on public.goals (user_id, status);
create trigger goals_updated_at before update on public.goals
  for each row execute function public.set_updated_at();

create table public.availability (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  weekday smallint not null check (weekday between 0 and 6), -- 0 = domingo
  start_time time not null,
  end_time time not null,
  created_at timestamptz not null default now(),
  constraint availability_time_order check (end_time > start_time)
);
create index availability_user_idx on public.availability (user_id, weekday);

-- -----------------------------------------------------------------------------
-- Módulo 2 — Tarefas e organização
-- -----------------------------------------------------------------------------
create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  goal_id uuid references public.goals (id) on delete set null,
  series_id uuid, -- agrupa as ocorrências de uma atividade recorrente
  title text not null check (char_length(title) between 1 and 160),
  description text check (char_length(description) <= 2000),
  kind text not null default 'tarefa' check (kind in ('tarefa', 'compromisso', 'habito')),
  category text not null default 'pessoal'
    check (category in ('trabalho', 'estudos', 'pessoal', 'saude', 'casa', 'financas', 'outros')),
  priority text not null default 'media' check (priority in ('baixa', 'media', 'alta', 'urgente')),
  status text not null default 'pendente' check (status in ('pendente', 'concluida', 'cancelada')),
  due_date date,
  start_at timestamptz,
  end_at timestamptz,
  duration_minutes integer check (duration_minutes between 5 and 720),
  recurrence text not null default 'nenhuma'
    check (recurrence in ('nenhuma', 'diaria', 'dias_uteis', 'semanal', 'mensal')),
  recurrence_until date,
  postponed_count integer not null default 0 check (postponed_count >= 0),
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint tasks_time_order check (start_at is null or end_at is null or end_at > start_at),
  constraint tasks_appointment_has_time check (kind <> 'compromisso' or (start_at is not null and end_at is not null)),
  constraint tasks_completed_at check ((status = 'concluida') = (completed_at is not null))
);
create index tasks_user_status_idx on public.tasks (user_id, status, due_date);
create index tasks_user_start_idx on public.tasks (user_id, start_at);
create trigger tasks_updated_at before update on public.tasks
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- Módulo 6 — Histórico (usado por todos os módulos)
-- -----------------------------------------------------------------------------
create table public.activity_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  task_id uuid references public.tasks (id) on delete set null,
  plan_id uuid,
  event text not null check (event in (
    'criada', 'editada', 'concluida', 'reaberta', 'adiada', 'reagendada', 'excluida',
    'plano_aprovado', 'plano_rejeitado', 'objetivo_concluido'
  )),
  task_title text check (char_length(task_title) <= 160),
  category text,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index activity_log_user_idx on public.activity_log (user_id, created_at desc);

-- -----------------------------------------------------------------------------
-- Módulo 3 — Assistente com IA
-- -----------------------------------------------------------------------------
create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  title text not null default 'Nova conversa' check (char_length(title) <= 120),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index conversations_user_idx on public.conversations (user_id, updated_at desc);
create trigger conversations_updated_at before update on public.conversations
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- Módulo 4 — Planejamento (planos e propostas da IA)
-- -----------------------------------------------------------------------------
create table public.plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  scope text not null check (scope in ('diario', 'semanal', 'reorganizacao', 'sugestao')),
  start_date date not null,
  end_date date not null,
  status text not null default 'proposto' check (status in ('proposto', 'aprovado', 'rejeitado', 'descartado')),
  source text not null default 'local' check (source in ('ia', 'local')),
  summary text check (char_length(summary) <= 2000),
  notes jsonb not null default '[]'::jsonb,        -- sugestões de melhoria
  conflicts jsonb not null default '[]'::jsonb,    -- conflitos detectados
  unscheduled jsonb not null default '[]'::jsonb,  -- atividades que não couberam
  created_at timestamptz not null default now(),
  decided_at timestamptz,
  constraint plans_date_order check (end_date >= start_date)
);
create index plans_user_idx on public.plans (user_id, status, created_at desc);

create table public.plan_items (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references public.plans (id) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  task_id uuid references public.tasks (id) on delete set null,
  action text not null check (action in ('agendar', 'reagendar', 'priorizar', 'criar')),
  title text not null check (char_length(title) between 1 and 160),
  start_at timestamptz,
  end_at timestamptz,
  due_date date,
  priority text check (priority in ('baixa', 'media', 'alta', 'urgente')),
  new_task jsonb,   -- dados da atividade quando action = 'criar'
  previous jsonb,   -- estado anterior (para a prévia "antes → depois")
  note text check (char_length(note) <= 500),
  position integer not null default 0,
  created_at timestamptz not null default now(),
  constraint plan_items_time_order check (start_at is null or end_at is null or end_at > start_at)
);
create index plan_items_plan_idx on public.plan_items (plan_id, position);

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null check (char_length(content) between 1 and 12000),
  plan_id uuid references public.plans (id) on delete set null,
  created_at timestamptz not null default now()
);
create index messages_conversation_idx on public.messages (conversation_id, created_at);

-- -----------------------------------------------------------------------------
-- Módulo 5 — Lembretes e notificações
-- -----------------------------------------------------------------------------
create table public.reminders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  task_id uuid references public.tasks (id) on delete cascade,
  title text not null check (char_length(title) between 1 and 160),
  remind_at timestamptz not null,
  recurrence text not null default 'nenhuma' check (recurrence in ('nenhuma', 'diaria', 'semanal')),
  status text not null default 'agendado' check (status in ('agendado', 'enviado', 'dispensado')),
  created_at timestamptz not null default now()
);
create index reminders_due_idx on public.reminders (user_id, status, remind_at);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  kind text not null check (kind in ('lembrete', 'atraso', 'proativo', 'sistema')),
  title text not null check (char_length(title) <= 160),
  body text check (char_length(body) <= 1000),
  link text check (link is null or link like '/%'), -- apenas rotas internas
  dedupe_key text,
  read_at timestamptz,
  created_at timestamptz not null default now(),
  constraint notifications_dedupe unique (user_id, dedupe_key)
);
create index notifications_user_idx on public.notifications (user_id, read_at, created_at desc);

-- -----------------------------------------------------------------------------
-- Módulo 6 — Insights (resumos semanais e briefings gerados)
-- -----------------------------------------------------------------------------
create table public.insights (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  kind text not null check (kind in ('resumo_semanal', 'briefing')),
  period_start date not null,
  period_end date not null,
  title text not null check (char_length(title) <= 160),
  content jsonb not null,
  metrics jsonb not null default '{}'::jsonb,
  source text not null check (source in ('ia', 'regras')),
  created_at timestamptz not null default now(),
  constraint insights_unique_period unique (user_id, kind, period_start)
);

-- =============================================================================
-- Row Level Security
-- =============================================================================
alter table public.profiles enable row level security;
alter table public.goals enable row level security;
alter table public.availability enable row level security;
alter table public.tasks enable row level security;
alter table public.activity_log enable row level security;
alter table public.conversations enable row level security;
alter table public.messages enable row level security;
alter table public.plans enable row level security;
alter table public.plan_items enable row level security;
alter table public.reminders enable row level security;
alter table public.notifications enable row level security;
alter table public.insights enable row level security;

-- Perfil: somente o próprio usuário (a criação é feita pelo gatilho).
create policy "perfil: ler o próprio" on public.profiles
  for select to authenticated using (id = (select auth.uid()));
create policy "perfil: atualizar o próprio" on public.profiles
  for update to authenticated using (id = (select auth.uid())) with check (id = (select auth.uid()));

-- Tabelas simples (dono = user_id)
create policy "objetivos: dono" on public.goals
  for all to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "disponibilidade: dono" on public.availability
  for all to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "conversas: dono" on public.conversations
  for all to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "insights: dono" on public.insights
  for all to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "notificações: dono" on public.notifications
  for all to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

-- Tarefas: dono e, se houver objetivo vinculado, o objetivo também precisa ser do dono.
create policy "tarefas: dono" on public.tasks
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (
    user_id = (select auth.uid())
    and (goal_id is null or exists (
      select 1 from public.goals g where g.id = goal_id and g.user_id = (select auth.uid())
    ))
  );

-- Histórico: o usuário pode ler e inserir; não pode editar nem apagar registros.
create policy "histórico: ler o próprio" on public.activity_log
  for select to authenticated using (user_id = (select auth.uid()));
create policy "histórico: registrar o próprio" on public.activity_log
  for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and (task_id is null or exists (
      select 1 from public.tasks t where t.id = task_id and t.user_id = (select auth.uid())
    ))
  );

-- Mensagens: dono e conversa do próprio dono.
create policy "mensagens: dono" on public.messages
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (
    user_id = (select auth.uid())
    and exists (select 1 from public.conversations c where c.id = conversation_id and c.user_id = (select auth.uid()))
    and (plan_id is null or exists (select 1 from public.plans p where p.id = plan_id and p.user_id = (select auth.uid())))
  );

-- Planos: dono.
create policy "planos: dono" on public.plans
  for all to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

-- Itens de plano: dono, plano do dono e tarefa do dono.
create policy "itens de plano: dono" on public.plan_items
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (
    user_id = (select auth.uid())
    and exists (select 1 from public.plans p where p.id = plan_id and p.user_id = (select auth.uid()))
    and (task_id is null or exists (
      select 1 from public.tasks t where t.id = task_id and t.user_id = (select auth.uid())
    ))
  );

-- Lembretes: dono e, se vinculado, tarefa do dono.
create policy "lembretes: dono" on public.reminders
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (
    user_id = (select auth.uid())
    and (task_id is null or exists (
      select 1 from public.tasks t where t.id = task_id and t.user_id = (select auth.uid())
    ))
  );

-- Permissões de tabela: apenas usuários autenticados (o RLS restringe as linhas).
revoke all on all tables in schema public from anon;
grant select, insert, update, delete on all tables in schema public to authenticated;
revoke update, delete on public.activity_log from authenticated;
revoke insert, delete on public.profiles from authenticated;

-- =============================================================================
-- Aprovação de plano/proposta em uma única transação (RN08)
-- security invoker: executa com as permissões do usuário, então o RLS vale.
-- =============================================================================
create or replace function public.approve_plan(p_plan_id uuid)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_plan public.plans%rowtype;
  v_item public.plan_items%rowtype;
  v_task public.tasks%rowtype;
  v_applied integer := 0;
  v_skipped jsonb := '[]'::jsonb;
  v_new_id uuid;
begin
  select * into v_plan from public.plans
   where id = p_plan_id and user_id = auth.uid()
   for update;

  if not found then
    raise exception 'Plano não encontrado.' using errcode = 'P0002';
  end if;
  if v_plan.status <> 'proposto' then
    raise exception 'Este plano já foi %.', v_plan.status using errcode = 'P0001';
  end if;

  for v_item in
    select * from public.plan_items where plan_id = p_plan_id order by position
  loop
    if v_item.action = 'criar' then
      insert into public.tasks (user_id, title, kind, category, priority, due_date, start_at, end_at, duration_minutes)
      values (
        auth.uid(),
        v_item.title,
        coalesce(v_item.new_task ->> 'kind', 'tarefa'),
        coalesce(v_item.new_task ->> 'category', 'pessoal'),
        coalesce(v_item.priority, v_item.new_task ->> 'priority', 'media'),
        v_item.due_date,
        v_item.start_at,
        v_item.end_at,
        nullif(v_item.new_task ->> 'duration_minutes', '')::integer
      )
      returning id into v_new_id;
      insert into public.activity_log (user_id, task_id, plan_id, event, task_title, category, details)
      values (auth.uid(), v_new_id, p_plan_id, 'criada', v_item.title, coalesce(v_item.new_task ->> 'category', 'pessoal'),
              jsonb_build_object('origem', 'proposta'));
      v_applied := v_applied + 1;
      continue;
    end if;

    select * into v_task from public.tasks
     where id = v_item.task_id and user_id = auth.uid() and status = 'pendente'
     for update;
    if not found then
      v_skipped := v_skipped || jsonb_build_object('titulo', v_item.title, 'motivo', 'A atividade não está mais pendente ou foi excluída.');
      continue;
    end if;

    if v_item.action = 'priorizar' then
      update public.tasks set priority = coalesce(v_item.priority, priority) where id = v_task.id;
      insert into public.activity_log (user_id, task_id, plan_id, event, task_title, category, details)
      values (auth.uid(), v_task.id, p_plan_id, 'editada', v_task.title, v_task.category,
              jsonb_build_object('prioridade_anterior', v_task.priority, 'prioridade', v_item.priority, 'origem', 'proposta'));
    else
      -- agendar / reagendar: compromissos fixos não são movidos por propostas
      if v_task.kind = 'compromisso' and v_item.start_at is distinct from v_task.start_at then
        v_skipped := v_skipped || jsonb_build_object('titulo', v_task.title, 'motivo', 'Compromissos fixos não são movidos automaticamente.');
        continue;
      end if;
      update public.tasks
         set start_at = v_item.start_at,
             end_at = v_item.end_at,
             due_date = coalesce(v_item.due_date, v_task.due_date),
             priority = coalesce(v_item.priority, v_task.priority)
       where id = v_task.id;
      insert into public.activity_log (user_id, task_id, plan_id, event, task_title, category, details)
      values (auth.uid(), v_task.id, p_plan_id, 'reagendada', v_task.title, v_task.category,
              jsonb_build_object('de', v_task.start_at, 'para', v_item.start_at, 'origem', 'proposta'));
    end if;
    v_applied := v_applied + 1;
  end loop;

  update public.plans set status = 'aprovado', decided_at = now() where id = p_plan_id;
  insert into public.activity_log (user_id, plan_id, event, details)
  values (auth.uid(), p_plan_id, 'plano_aprovado', jsonb_build_object('aplicados', v_applied, 'ignorados', jsonb_array_length(v_skipped)));

  return jsonb_build_object('applied', v_applied, 'skipped', v_skipped);
end;
$$;

revoke all on function public.approve_plan(uuid) from public, anon;
grant execute on function public.approve_plan(uuid) to authenticated;
