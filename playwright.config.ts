import { defineConfig, devices } from "@playwright/test";

/**
 * Testes de interface (E2E), responsividade e acessibilidade.
 * Usa o Google Chrome instalado (channel "chrome"); em CI pode-se usar o Chromium
 * do Playwright com `npx playwright install chromium` e PW_CHANNEL="" .
 */
const PORT = Number(process.env.E2E_PORT ?? 3100);
/** Para testar o site publicado: E2E_BASE_URL=https://nexo-a3.vercel.app (não sobe servidor local). */
const BASE_URL = process.env.E2E_BASE_URL;

export default defineConfig({
  testDir: "tests/e2e",
  timeout: 60_000,
  fullyParallel: false,
  workers: 1,
  reporter: [["list"], ["json", { outputFile: "test-results/e2e-report.json" }]],
  use: {
    baseURL: BASE_URL ?? `http://localhost:${PORT}`,
    channel: process.env.PW_CHANNEL ?? "chrome",
    locale: "pt-BR",
    timezoneId: "America/Sao_Paulo",
    trace: "retain-on-failure",
  },
  projects: [{ name: "chrome", use: { ...devices["Desktop Chrome"], channel: process.env.PW_CHANNEL ?? "chrome" } }],
  webServer: BASE_URL
    ? undefined
    : {
        command: `npm run start -- -p ${PORT}`,
        url: `http://localhost:${PORT}`,
        reuseExistingServer: true,
        timeout: 120_000,
      },
});
