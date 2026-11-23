/**
 * Utilitários de data e fuso horário (sem dependências externas).
 *
 * Convenções:
 * - "dateStr" é uma data local no formato YYYY-MM-DD.
 * - "timeStr" é um horário local no formato HH:mm.
 * - Instantes são objetos Date (UTC internamente) e são gravados como timestamptz.
 */

export const DEFAULT_TZ = "America/Sao_Paulo";
export const LOCALE = "pt-BR";

export interface LocalParts {
  year: number;
  month: number; // 1-12
  day: number;
  hour: number;
  minute: number;
  weekday: number; // 0 = domingo
}

const partsFormatterCache = new Map<string, Intl.DateTimeFormat>();
function partsFormatter(tz: string): Intl.DateTimeFormat {
  let f = partsFormatterCache.get(tz);
  if (!f) {
    f = new Intl.DateTimeFormat("en-US", {
      timeZone: tz,
      hourCycle: "h23",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      weekday: "short",
    });
    partsFormatterCache.set(tz, f);
  }
  return f;
}

const WEEKDAYS: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };

export function toLocalParts(date: Date, tz: string = DEFAULT_TZ): LocalParts {
  const parts = partsFormatter(tz).formatToParts(date);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "0";
  return {
    year: Number(get("year")),
    month: Number(get("month")),
    day: Number(get("day")),
    hour: Number(get("hour")) % 24,
    minute: Number(get("minute")),
    weekday: WEEKDAYS[get("weekday")] ?? 0,
  };
}

const pad = (n: number) => String(n).padStart(2, "0");

export function localDateString(date: Date, tz: string = DEFAULT_TZ): string {
  const p = toLocalParts(date, tz);
  return `${p.year}-${pad(p.month)}-${pad(p.day)}`;
}

export function localTimeString(date: Date, tz: string = DEFAULT_TZ): string {
  const p = toLocalParts(date, tz);
  return `${pad(p.hour)}:${pad(p.minute)}`;
}

export function isValidDateStr(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [y, m, d] = value.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d;
}

export function isValidTimeStr(value: string): boolean {
  return /^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/.test(value);
}

/** Diferença (em minutos) entre o horário local do fuso e o UTC no instante informado. */
export function tzOffsetMinutes(date: Date, tz: string = DEFAULT_TZ): number {
  const p = toLocalParts(date, tz);
  const asUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute);
  const truncated = Math.floor(date.getTime() / 60000) * 60000;
  return Math.round((asUtc - truncated) / 60000);
}

/** Converte data + hora locais de um fuso para o instante UTC correspondente. */
export function zonedToUtc(dateStr: string, timeStr: string, tz: string = DEFAULT_TZ): Date {
  const [y, m, d] = dateStr.split("-").map(Number);
  const [hh, mm] = timeStr.split(":").map(Number);
  const guess = Date.UTC(y, m - 1, d, hh, mm);
  let offset = tzOffsetMinutes(new Date(guess), tz);
  let result = guess - offset * 60000;
  // Segunda iteração para fusos com horário de verão
  const offset2 = tzOffsetMinutes(new Date(result), tz);
  if (offset2 !== offset) {
    offset = offset2;
    result = guess - offset * 60000;
  }
  return new Date(result);
}

export function addDays(dateStr: string, days: number): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + days));
  return `${dt.getUTCFullYear()}-${pad(dt.getUTCMonth() + 1)}-${pad(dt.getUTCDate())}`;
}

export function addMonthsClamped(dateStr: string, months: number): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const target = new Date(Date.UTC(y, m - 1 + months, 1));
  const lastDay = new Date(Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0)).getUTCDate();
  return `${target.getUTCFullYear()}-${pad(target.getUTCMonth() + 1)}-${pad(Math.min(d, lastDay))}`;
}

export function weekdayOf(dateStr: string): number {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}

export function diffDays(fromDateStr: string, toDateStr: string): number {
  const [y1, m1, d1] = fromDateStr.split("-").map(Number);
  const [y2, m2, d2] = toDateStr.split("-").map(Number);
  return Math.round((Date.UTC(y2, m2 - 1, d2) - Date.UTC(y1, m1 - 1, d1)) / 86400000);
}

/** Segunda-feira da semana da data (semanas de segunda a domingo, usadas nos insights). */
export function startOfWeekMonday(dateStr: string): string {
  const wd = weekdayOf(dateStr);
  return addDays(dateStr, wd === 0 ? -6 : 1 - wd);
}

export function dateRange(startDateStr: string, days: number): string[] {
  return Array.from({ length: days }, (_, i) => addDays(startDateStr, i));
}

export function timeToMinutes(timeStr: string): number {
  const [h, m] = timeStr.split(":").map(Number);
  return h * 60 + m;
}

/** Converte minutos desde a meia-noite em HH:mm (limitado a 00:00–23:59). */
export function minutesToTime(minutes: number): string {
  const m = Math.max(0, Math.min(24 * 60 - 1, Math.round(minutes)));
  return `${pad(Math.floor(m / 60))}:${pad(m % 60)}`;
}

/** Minutos desde a meia-noite local para um instante. */
export function localMinutesOfDay(date: Date, tz: string = DEFAULT_TZ): number {
  const p = toLocalParts(date, tz);
  return p.hour * 60 + p.minute;
}

// ----------------------------------------------------------------------------
// Formatação em português
// ----------------------------------------------------------------------------

function dateFromDateStr(dateStr: string): Date {
  const [y, m, d] = dateStr.split("-").map(Number);
  // Meio-dia UTC evita mudança de dia em qualquer fuso brasileiro
  return new Date(Date.UTC(y, m - 1, d, 12));
}

export function formatDateLong(dateStr: string): string {
  return new Intl.DateTimeFormat(LOCALE, {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "UTC",
  }).format(dateFromDateStr(dateStr));
}

export function formatDateShort(dateStr: string): string {
  return new Intl.DateTimeFormat(LOCALE, { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "UTC" }).format(
    dateFromDateStr(dateStr),
  );
}

export function formatDayMonth(dateStr: string): string {
  return new Intl.DateTimeFormat(LOCALE, { day: "2-digit", month: "2-digit", timeZone: "UTC" }).format(dateFromDateStr(dateStr));
}

export function formatWeekdayShort(dateStr: string): string {
  return new Intl.DateTimeFormat(LOCALE, { weekday: "short", timeZone: "UTC" }).format(dateFromDateStr(dateStr)).replace(".", "");
}

export function formatMonthYear(year: number, month: number): string {
  const s = new Intl.DateTimeFormat(LOCALE, { month: "long", year: "numeric", timeZone: "UTC" }).format(
    new Date(Date.UTC(year, month - 1, 15)),
  );
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function formatTime(date: Date | string, tz: string = DEFAULT_TZ): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return localTimeString(d, tz);
}

export function formatDateTime(date: Date | string, tz: string = DEFAULT_TZ): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return `${formatDayMonth(localDateString(d, tz))} às ${localTimeString(d, tz)}`;
}

export function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

export function greeting(date: Date, tz: string = DEFAULT_TZ): string {
  const h = toLocalParts(date, tz).hour;
  if (h < 5) return "Boa noite";
  if (h < 12) return "Bom dia";
  if (h < 18) return "Boa tarde";
  return "Boa noite";
}

export const WEEKDAY_NAMES = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];
export const WEEKDAY_INITIALS = ["D", "S", "T", "Q", "Q", "S", "S"];
