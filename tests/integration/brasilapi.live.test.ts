import { describe, expect, it } from "vitest";
import { fetchHolidays } from "@/lib/holidays/brasilapi";

/**
 * Teste de integração REAL com a BrasilAPI (requer internet).
 * Pule com SKIP_LIVE=1 em ambientes sem rede.
 */
describe.skipIf(process.env.SKIP_LIVE === "1")("BrasilAPI (chamada real)", () => {
  it("retorna os feriados nacionais de 2026", async () => {
    const r = await fetchHolidays(2026);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.holidays.length).toBeGreaterThanOrEqual(10);
      expect(r.holidays).toContainEqual(expect.objectContaining({ date: "2026-12-25", name: "Natal" }));
      expect(r.holidays).toContainEqual(expect.objectContaining({ date: "2026-11-20" }));
    }
  });
});
