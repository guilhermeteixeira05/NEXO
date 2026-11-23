import { expect, test } from "@playwright/test";
import { axeScan, horizontalOverflow, smallTouchTargets, VIEWPORTS } from "./helpers";

/**
 * Páginas públicas — executáveis sem credenciais.
 * Quando o Supabase não está configurado, as rotas de acesso levam a /configurar.
 */
const PAGES = [
  { path: "/", name: "apresentacao", h1: /Sua rotina organizada/ },
  { path: "/configurar", name: "configurar", h1: /Configurar o NEXO/ },
  { path: "/pagina-que-nao-existe", name: "404", h1: /Página não encontrada/ },
];

test.describe("estrutura e semântica", () => {
  test("idioma, título, meta viewport e link para pular conteúdo", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("html")).toHaveAttribute("lang", "pt-BR");
    await expect(page).toHaveTitle(/NEXO/);
    await expect(page.locator('meta[name="viewport"]')).toHaveAttribute("content", /width=device-width, initial-scale=1/);
    await page.keyboard.press("Tab");
    await expect(page.getByRole("link", { name: "Pular para o conteúdo" })).toBeFocused();
    await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
  });

  test("rotas protegidas não abrem sem sessão", async ({ page }) => {
    for (const path of ["/painel", "/tarefas", "/assistente"]) {
      await page.goto(path);
      await expect(page).toHaveURL(/\/(entrar|configurar)/);
    }
  });

  test("APIs exigem autenticação", async ({ request }) => {
    const chat = await request.post("/api/assistente", { data: { message: "oi" } });
    expect(chat.status()).toBe(401);
    const notif = await request.post("/api/notificacoes");
    expect(notif.status()).toBe(401);
  });

  test("cabeçalhos de segurança", async ({ request }) => {
    const res = await request.get("/");
    expect(res.headers()["x-content-type-options"]).toBe("nosniff");
    expect(res.headers()["x-frame-options"]).toBe("DENY");
    expect(res.headers()["x-powered-by"]).toBeUndefined();
  });
});

for (const p of PAGES) {
  test.describe(`responsividade — ${p.name}`, () => {
    for (const vp of VIEWPORTS) {
      test(`${vp.name}: sem rolagem horizontal${vp.width <= 768 ? " e alvos de toque ≥ 44 px" : ""}`, async ({ page }) => {
        await page.setViewportSize({ width: vp.width, height: vp.height });
        await page.goto(p.path);
        await expect(page.getByRole("heading", { level: 1 })).toHaveText(p.h1);
        expect(await horizontalOverflow(page)).toBeLessThanOrEqual(0);
        if (vp.width <= 768) expect(await smallTouchTargets(page)).toEqual([]);
        await page.screenshot({ path: `test-results/screens/${p.name}-${vp.name}.png`, fullPage: true });
      });
    }
  });

  test.describe(`acessibilidade WCAG 2.1 AA (axe) — ${p.name}`, () => {
    for (const scheme of ["light", "dark"] as const) {
      test(`tema ${scheme === "light" ? "claro" : "escuro"}`, async ({ page }) => {
        await page.emulateMedia({ colorScheme: scheme });
        await page.setViewportSize({ width: 375, height: 812 });
        await page.goto(p.path);
        const results = await axeScan(page, `${p.name}-${scheme}`);
        const serious = results.violations.filter((v) => v.impact === "serious" || v.impact === "critical");
        expect(serious.map((v) => `${v.id}: ${v.help} (${v.nodes.length})`)).toEqual([]);
      });
    }
  });
}

test("zoom de texto a 200% mantém o conteúdo sem sobreposição horizontal (WCAG 1.4.4/1.4.10)", async ({ page }) => {
  await page.setViewportSize({ width: 640, height: 900 }); // 1280 px a 200%
  await page.goto("/");
  await page.evaluate(() => (document.documentElement.style.fontSize = "200%"));
  expect(await horizontalOverflow(page)).toBeLessThanOrEqual(0);
});
