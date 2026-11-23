import AxeBuilder from "@axe-core/playwright";
import type { Page } from "@playwright/test";
import { mkdirSync, writeFileSync } from "node:fs";

/** Faixas da apostila (seção 3.1) + extremos. */
export const VIEWPORTS = [
  { name: "mobile-320", width: 320, height: 640 },
  { name: "mobile-375", width: 375, height: 812 },
  { name: "mobile-480", width: 480, height: 854 },
  { name: "tablet-768", width: 768, height: 1024 },
  { name: "desktop-p-1024", width: 1024, height: 768 },
  { name: "desktop-1200", width: 1200, height: 800 },
  { name: "grande-1440", width: 1440, height: 900 },
  { name: "grande-1920", width: 1920, height: 1080 },
];

export async function horizontalOverflow(page: Page): Promise<number> {
  return page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
}

/** Controles interativos visíveis menores que 44×44 px (exceto links dentro de texto corrido). */
export async function smallTouchTargets(page: Page): Promise<string[]> {
  return page.evaluate(() => {
    const out: string[] = [];
    const els = document.querySelectorAll<HTMLElement>("button, a, input:not([type=hidden]), select, textarea, summary, [role=button]");
    els.forEach((el) => {
      const style = getComputedStyle(el);
      if (style.visibility === "hidden" || style.display === "none" || el.closest("[hidden], dialog:not([open])")) return;
      // Conteúdo de <details> fechado (content-visibility: hidden) não está visível para o usuário
      if (typeof el.checkVisibility === "function" && !el.checkVisibility({ contentVisibilityAuto: true, visibilityProperty: true })) return;
      let r = el.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) return;
      // Para campos, a área de toque inclui o <label> associado (clicar no rótulo aciona o campo)
      const labels = el instanceof HTMLInputElement && el.labels ? Array.from(el.labels) : [];
      for (const label of labels) {
        const lr = label.getBoundingClientRect();
        if (lr.width * lr.height > r.width * r.height && lr.width >= r.width && lr.height >= r.height) r = lr;
      }
      if (el.classList.contains("skip-link") || el.classList.contains("sr-only")) return;
      // Links dentro de uma frase (texto corrido) são isentos do tamanho mínimo de alvo
      const parentText = el.parentElement?.textContent?.trim().length ?? 0;
      const ownText = el.textContent?.trim().length ?? 0;
      const inlineText = el.tagName === "A" && !el.className && parentText > ownText + 10;
      if (inlineText) return;
      if (r.width < 44 - 0.5 || r.height < 44 - 0.5) out.push(`${el.tagName.toLowerCase()}${el.className ? "." + String(el.className).split(" ")[0] : ""} "${(el.textContent || el.getAttribute("aria-label") || "").trim().slice(0, 30)}" ${Math.round(r.width)}×${Math.round(r.height)}`);
    });
    return out;
  });
}

export async function axeScan(page: Page, label: string) {
  const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
  mkdirSync("test-results/axe", { recursive: true });
  writeFileSync(
    `test-results/axe/${label}.json`,
    JSON.stringify(
      {
        url: page.url(),
        violations: results.violations.map((v) => ({ id: v.id, impact: v.impact, help: v.help, nodes: v.nodes.length, targets: v.nodes.slice(0, 5).map((n) => n.target) })),
        passes: results.passes.length,
        incomplete: results.incomplete.map((i) => ({ id: i.id, nodes: i.nodes.length })),
      },
      null,
      2,
    ),
  );
  return results;
}
