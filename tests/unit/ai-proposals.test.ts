import { describe, expect, it } from "vitest";
import { validateProposal } from "@/lib/ai/proposals";
import { buildContextData, buildContextText } from "@/lib/ai/context";
import { brt, makeTask, slot } from "./factories";

const TZ = "America/Sao_Paulo";
const NOW = brt("2026-11-23", "14:00");
const ingles = makeTask({ id: "11111111-1111-4111-8111-111111111111", title: "Estudar inglês", postponed_count: 3, duration_minutes: 60 });
const treino = makeTask({
  id: "22222222-2222-4222-8222-222222222222",
  title: "Treino de peito",
  kind: "compromisso",
  start_at: brt("2026-11-24", "18:30").toISOString(),
  end_at: brt("2026-11-24", "19:30").toISOString(),
});
const feita = makeTask({ id: "33333333-3333-4333-8333-333333333333", title: "Feita", status: "concluida", completed_at: NOW.toISOString() });
const ctx = { tasks: [ingles, treino, feita], tz: TZ, now: NOW, defaultMinutes: 30 };

describe("RNF05/RN08 — validação das propostas da IA antes de gravar", () => {
  it("aceita um reagendamento válido e guarda o estado anterior para a prévia", () => {
    const v = validateProposal(
      {
        titulo: "Reorganização",
        justificativa: "Inglês foi adiado 3 vezes.",
        escopo: "reorganizacao",
        itens: [{ acao: "reagendar", tarefa_id: ingles.id, data: "2026-11-24", inicio: "20:00", motivo: "Horário livre após o treino" }],
      },
      ctx,
    );
    expect(v.ok).toBe(true);
    if (v.ok) {
      expect(v.items[0].action).toBe("reagendar");
      expect(v.items[0].start_at).toBe("2026-11-24T23:00:00.000Z"); // 20h BRT
      expect(v.items[0].end_at).toBe("2026-11-25T00:00:00.000Z"); // + 60 min
      expect(v.items[0].previous).toMatchObject({ due_date: null, start_at: null });
      expect(v.plan.start_date).toBe("2026-11-24");
    }
  });

  it("rejeita id de atividade inexistente (ou de outro usuário)", () => {
    const v = validateProposal(
      { titulo: "x", justificativa: "y", escopo: "sugestao", itens: [{ acao: "reagendar", tarefa_id: "99999999-9999-4999-8999-999999999999", data: "2026-11-24", motivo: "z" }] },
      ctx,
    );
    expect(v.ok).toBe(false);
    if (!v.ok) expect(v.errors.join()).toMatch(/inexistente/);
  });

  it("rejeita mover compromisso fixo, atividade concluída e datas no passado", () => {
    const v = validateProposal(
      {
        titulo: "x",
        justificativa: "y",
        escopo: "sugestao",
        itens: [
          { acao: "reagendar", tarefa_id: treino.id, data: "2026-11-25", inicio: "18:00", motivo: "a" },
          { acao: "reagendar", tarefa_id: feita.id, data: "2026-11-25", motivo: "b" },
          { acao: "criar", titulo: "Nova", data: "2026-11-20", motivo: "c" },
        ],
      },
      ctx,
    );
    expect(v.ok).toBe(false);
    if (!v.ok) {
      expect(v.errors.join(" ")).toMatch(/compromisso fixo/);
      expect(v.errors.join(" ")).toMatch(/não está pendente/);
      expect(v.errors.join(" ")).toMatch(/já passou/);
    }
  });

  it("rejeita horário que conflita com compromisso existente", () => {
    const v = validateProposal(
      { titulo: "x", justificativa: "y", escopo: "diario", itens: [{ acao: "reagendar", tarefa_id: ingles.id, data: "2026-11-24", inicio: "19:00", fim: "20:00", motivo: "a" }] },
      ctx,
    );
    expect(v.ok).toBe(false);
    if (!v.ok) expect(v.errors.join()).toMatch(/conflito/);
  });

  it("aceita criar atividade e mudar prioridade", () => {
    const v = validateProposal(
      {
        titulo: "Ajustes",
        justificativa: "Prazo próximo.",
        escopo: "sugestao",
        itens: [
          { acao: "priorizar", tarefa_id: ingles.id, prioridade: "alta", motivo: "Adiada muitas vezes" },
          { acao: "criar", titulo: "Revisar vocabulário", categoria: "estudos", data: "2026-11-25", duracao_minutos: 20, motivo: "Bloco curto" },
        ],
      },
      ctx,
    );
    expect(v.ok).toBe(true);
    if (v.ok) {
      expect(v.items.map((i) => i.action)).toEqual(["priorizar", "criar"]);
      expect(v.items[1].new_task).toMatchObject({ kind: "tarefa", category: "estudos" });
    }
  });

  it("rejeita formato inválido (sem itens / ação desconhecida)", () => {
    expect(validateProposal({ titulo: "x", justificativa: "y", escopo: "diario", itens: [] }, ctx).ok).toBe(false);
    expect(validateProposal({ titulo: "x", justificativa: "y", escopo: "diario", itens: [{ acao: "excluir", motivo: "z" }] }, ctx).ok).toBe(false);
  });
});

describe("RNF07 — contexto enviado à IA", () => {
  const input = {
    profile: { full_name: "Camila Souza", occupation: "Analista", timezone: TZ, focus_period: "manha" as const, default_task_minutes: 30 },
    now: NOW,
    tasks: [ingles, treino, feita],
    goals: [],
    availability: [slot(1, "18:00", "22:00")],
    activity: [],
    holidays: [{ date: "2026-12-25", name: "Natal", type: "national" }],
  };
  it("inclui atividades, disponibilidade, feriados e alertas", () => {
    const data = buildContextData(input);
    expect(data.atividades_pendentes.map((t) => t.titulo)).toEqual(["Estudar inglês", "Treino de peito"]);
    expect(data.disponibilidade_semanal).toEqual({ segunda: ["18:00-22:00"] });
    expect(data.feriados_nacionais_proximos[0]).toEqual({ data: "2026-12-25", nome: "Natal" });
    expect(data.alertas_detectados.join(" ")).toMatch(/adiada/);
  });
  it("não contém e-mail nem identificadores de autenticação", () => {
    const text = buildContextText(input);
    expect(text).not.toMatch(/@/);
    expect(text).not.toContain("user_id");
    expect(text).not.toContain("u1");
  });
});
