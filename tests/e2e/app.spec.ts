import { expect, test, type BrowserContext, type Page } from "@playwright/test";
import { axeScan, horizontalOverflow, smallTouchTargets, VIEWPORTS } from "./helpers";

/**
 * Fluxos autenticados de ponta a ponta. Exigem um projeto Supabase de TESTE configurado
 * no .env.local (com a migração aplicada e a confirmação de e-mail DESATIVADA em
 * Authentication → Providers → Email), para que o cadastro entre direto.
 *
 *   E2E_SUPABASE=1 npx playwright test tests/e2e/app.spec.ts
 *
 * Cada execução cria uma conta de teste nova (e-mail com timestamp).
 */
test.skip(!process.env.E2E_SUPABASE, "Defina E2E_SUPABASE=1 com um Supabase de teste configurado no .env.local");
test.describe.configure({ mode: "serial" });

const stamp = Date.now();
const email = `nexo.e2e.${stamp}@teste.dev`;
const password = `Teste-${stamp}`;
let context: BrowserContext;
let page: Page;

test.beforeAll(async ({ browser }) => {
  context = await browser.newContext({ locale: "pt-BR", timezoneId: "America/Sao_Paulo" }); // o axe exige um contexto explícito
  page = await context.newPage();
});
test.afterAll(async () => context.close());

test("cadastro e configuração inicial (RF01, RF03, RF07)", async () => {
  await page.goto("/cadastro");
  await page.getByLabel("Nome").fill("Camila Teste");
  await page.getByLabel("E-mail").fill(email);
  await page.getByLabel("Senha").fill(password);
  await page.getByRole("button", { name: "Criar conta" }).click();
  await expect(page).toHaveURL(/configuracao-inicial/, { timeout: 20_000 });
  await page.getByRole("button", { name: "Continuar" }).click();
  await page.getByRole("button", { name: "Continuar" }).click();
  await expect(page.getByRole("heading", { name: "Quando você tem tempo livre?" })).toBeVisible();
  await page.getByRole("button", { name: "Continuar" }).click();
  await page.getByRole("textbox", { name: /^Objetivo/ }).fill("Treinar 3 vezes por semana");
  await page.getByRole("button", { name: "Concluir" }).click();
  await expect(page).toHaveURL(/painel/, { timeout: 20_000 });
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Camila");
});

test("criar, concluir e adiar atividades (RF09, RF12, RF13) — dados compartilhados entre módulos", async () => {
  await page.goto("/tarefas");
  for (const title of ["Estudar inglês", "Revisar relatório"]) {
    await page.getByRole("button", { name: "Nova atividade" }).first().click();
    const dialog = page.getByRole("dialog");
    await dialog.getByLabel("Título").fill(title);
    await dialog.getByRole("button", { name: "Criar atividade" }).click();
    // espera o salvamento terminar: o diálogo fecha e a atividade aparece na lista
    await expect(dialog).toBeHidden({ timeout: 20_000 });
    await expect(page.getByRole("button", { name: `Concluir “${title}”` })).toBeVisible({ timeout: 20_000 });
  }
  await page.reload(); // persistência: continua lá depois de recarregar
  await expect(page.getByRole("button", { name: "Concluir “Estudar inglês”" })).toBeVisible();
  await page.getByRole("button", { name: "Concluir “Revisar relatório”" }).click();
  await expect(page.getByText("“Revisar relatório” concluída.")).toBeVisible({ timeout: 20_000 });
  await page.getByLabel("Ações para “Estudar inglês”").click(); // <summary> do menu nativo
  await page.getByRole("button", { name: "Para amanhã" }).click();
  await expect(page.getByText(/adiada para/)).toBeVisible({ timeout: 20_000 });
  // o histórico (Módulo 6) registra conclusão e adiamento
  await page.goto("/insights?historico=todos");
  await expect(page.getByText("Concluída").first()).toBeVisible();
  await expect(page.getByText(/Adiada: Estudar inglês/)).toBeVisible();
});

test("planejamento: gerar e aprovar plano (RF26, RF24)", async () => {
  await page.goto("/planejamento?escopo=semanal");
  await page.getByRole("button", { name: "Gerar plano" }).click();
  await expect(page.getByText(/Plano proposto/)).toBeVisible({ timeout: 60_000 });
  await page.reload();
  const approve = page.getByRole("button", { name: "Aprovar" }).first();
  if (await approve.isEnabled()) {
    await approve.click();
    await expect(page.getByText(/Plano aprovado/)).toBeVisible({ timeout: 20_000 });
  }
});

test("lembrete e central de notificações (RF33, RF38)", async () => {
  await page.goto("/lembretes");
  await page.getByRole("button", { name: "Novo lembrete" }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Título").fill("Beber água");
  await dialog.getByLabel("Repetição").selectOption("diaria");
  await dialog.getByRole("button", { name: "Criar lembrete" }).click();
  await expect(dialog).toBeHidden({ timeout: 20_000 });
  await expect(page.getByText("Beber água", { exact: true })).toBeVisible({ timeout: 20_000 });
});

test("calendário mostra feriados da BrasilAPI (RF45)", async () => {
  await page.goto("/calendario?mes=2026-12&dia=2026-12-25");
  await expect(page.getByText("Feriado nacional: Natal")).toBeVisible();
});

test("assistente: responde com IA real ou informa que não está configurada (RF19)", async () => {
  await page.goto("/assistente");
  const notConfigured = page.getByText(/A IA ainda não está configurada/);
  if (await notConfigured.isVisible()) return; // sem chave: nenhuma resposta simulada
  await page.getByLabel("Mensagem para o NEXO").fill("Quais tarefas ainda preciso concluir?");
  await page.getByRole("button", { name: "Enviar mensagem" }).click();
  await expect(page.locator(".bubble").last()).not.toHaveText(/NEXO está pensando/, { timeout: 60_000 });
  await expect(page.getByText(/Estudar inglês/).last()).toBeVisible({ timeout: 60_000 });
});

test("telas autenticadas: responsividade e acessibilidade", async () => {
  for (const path of ["/painel", "/tarefas", "/calendario", "/planejamento", "/assistente", "/objetivos", "/lembretes", "/insights", "/perfil", "/configuracoes"]) {
    for (const vp of [VIEWPORTS[0], VIEWPORTS[3], VIEWPORTS[6]]) {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto(path);
      expect(await horizontalOverflow(page), `${path} @ ${vp.name}`).toBeLessThanOrEqual(0);
      if (vp.width <= 768) expect(await smallTouchTargets(page), `${path} @ ${vp.name}`).toEqual([]);
    }
    const results = await axeScan(page, `app${path.replace(/\//g, "-")}`);
    expect(results.violations.filter((v) => v.impact === "serious" || v.impact === "critical").map((v) => v.id), path).toEqual([]);
  }
});
