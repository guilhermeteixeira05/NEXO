"use client";

import { useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { WEEKDAY_NAMES } from "@/lib/dates";

export interface Slot {
  weekday: number;
  start: string;
  end: string;
}

const ORDER = [1, 2, 3, 4, 5, 6, 0]; // segunda a domingo

/**
 * Editor de disponibilidade semanal (RF07). O resultado vai em um campo oculto
 * "slots" (JSON), validado no servidor.
 */
export function AvailabilityEditor({ initial, name = "slots" }: { initial: Slot[]; name?: string }) {
  const [slots, setSlots] = useState<Slot[]>(initial);

  const update = (index: number, patch: Partial<Slot>) => setSlots((s) => s.map((x, i) => (i === index ? { ...x, ...patch } : x)));
  const remove = (index: number) => setSlots((s) => s.filter((_, i) => i !== index));
  const add = (weekday: number) => setSlots((s) => [...s, { weekday, start: "18:00", end: "21:00" }]);

  return (
    <div className="availability">
      <input type="hidden" name={name} value={JSON.stringify(slots)} />
      {ORDER.map((wd) => {
        const daySlots = slots.map((s, i) => ({ s, i })).filter(({ s }) => s.weekday === wd);
        const dayName = WEEKDAY_NAMES[wd];
        return (
          <fieldset key={wd} className="availability__day">
            <div className="availability__head">
              <legend style={{ margin: 0 }}>{dayName}</legend>
              <button type="button" className="link-btn" onClick={() => add(wd)} disabled={daySlots.length >= 4}>
                <Icon name="adicionar" size={18} />
                <span>Adicionar horário</span>
                <span className="sr-only"> em {dayName}</span>
              </button>
            </div>
            {daySlots.length === 0 ? <p className="small muted">Sem horário livre.</p> : null}
            {daySlots.map(({ s, i }, n) => (
              <div key={i} className="availability__slot">
                <label className="sr-only" htmlFor={`inicio-${wd}-${n}`}>
                  Início da janela {n + 1} de {dayName}
                </label>
                <input id={`inicio-${wd}-${n}`} type="time" className="input" value={s.start} onChange={(e) => update(i, { start: e.target.value })} />
                <span aria-hidden="true">até</span>
                <label className="sr-only" htmlFor={`fim-${wd}-${n}`}>
                  Fim da janela {n + 1} de {dayName}
                </label>
                <input
                  id={`fim-${wd}-${n}`}
                  type="time"
                  className="input"
                  value={s.end}
                  aria-invalid={s.end <= s.start ? true : undefined}
                  onChange={(e) => update(i, { end: e.target.value })}
                />
                <button type="button" className="btn btn--icon btn--ghost" onClick={() => remove(i)} aria-label={`Remover janela ${n + 1} de ${dayName}`}>
                  <Icon name="excluir" size={20} />
                </button>
                {s.end <= s.start ? (
                  <p className="field__error" style={{ gridColumn: "1 / -1" }}>
                    <Icon name="alerta" size={16} /> O fim precisa ser depois do início.
                  </p>
                ) : null}
              </div>
            ))}
          </fieldset>
        );
      })}
    </div>
  );
}
