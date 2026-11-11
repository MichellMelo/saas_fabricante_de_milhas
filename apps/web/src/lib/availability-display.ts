/** Presentation-only formatter for stored availability strings (CSV and WhatsApp).
 * Do not rewrite persisted data; unknown legacy strings are displayed unchanged.
 */
export type AvailabilityMonthGroup = { key: string; label: string; days: string[] };

const MONTH_NAMES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];
const MONTH_ALIASES: Record<string, number> = Object.fromEntries(
  MONTH_NAMES.flatMap((name, i) => [
    [name.toLowerCase(), i + 1],
    [name.slice(0, 3).toLowerCase(), i + 1],
  ]),
);
function normalize(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
}
function monthKey(year: number, month: number) {
  return `${year}-${String(month).padStart(2, "0")}`;
}
function validYearMonth(year: number, month: number) {
  return Number.isInteger(year) && year >= 1900 && year <= 2100 && month >= 1 && month <= 12;
}
function parseMonth(value: string): { key: string; label: string; month: number; year: number } | null {
  const cleaned = value.trim();
  const iso = /^(\d{4})-(\d{1,2})$/.exec(cleaned);
  const numeric = /^(\d{1,2})\/(\d{4})$/.exec(cleaned);
  const textual = /^([A-Za-zÀ-ÿ]+)\s*\/\s*(\d{4})$/.exec(cleaned);
  const year = Number(iso?.[1] ?? numeric?.[2] ?? textual?.[2]);
  const month = iso ? Number(iso[2]) : numeric ? Number(numeric[1]) : textual ? MONTH_ALIASES[normalize(textual[1])] : NaN;
  if (!validYearMonth(year, month)) return null;
  return { key: monthKey(year, month), label: `${MONTH_NAMES[month - 1]}/${year}`, month, year };
}
export function formatAvailableMonths(value: string): string[] {
  if (!value.trim()) return [];
  const pieces = value.split(/[,;|\n]+|\\n/).map((part) => part.trim()).filter(Boolean);
  const known = pieces.map(parseMonth);
  if (known.some((item) => item === null)) return [value];
  const groups = known.filter((item): item is NonNullable<typeof item> => item !== null);
  return [...new Map(groups.map((item) => [item.key, item.label])).entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([, label]) => label);
}
function parseFullDate(input: string): { key: string; day: number } | null {
  const value = input.trim();
  const iso = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  const br = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value);
  if (!iso && !br) return null;
  const year = Number(iso?.[1] ?? br?.[3]);
  const month = Number(iso?.[2] ?? br?.[2]);
  const day = Number(iso?.[3] ?? br?.[1]);
  if (!validYearMonth(year, month) || day < 1 || day > new Date(Date.UTC(year, month, 0)).getUTCDate()) return null;
  return { key: monthKey(year, month), day };
}
function groupFromMap(groups: Map<string, Set<number>>): AvailabilityMonthGroup[] {
  return [...groups.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([key, days]) => {
    const info = parseMonth(key);
    return { key, label: info?.label ?? key, days: [...days].sort((a, b) => a - b).map((day) => String(day).padStart(2, "0")) };
  });
}
/** Returns null for text not confidently understood, so legacy entries remain visible. */
export function groupAvailabilityDays(value: string, monthsAvailable: string): AvailabilityMonthGroup[] | null {
  if (!value.trim()) return [];
  const normalized = value.replace(/\\n/g, "\n").trim();
  const tokens = normalized.split(/[,;\s]+/).filter(Boolean);
  const fullDates = tokens.map(parseFullDate);
  if (fullDates.length && fullDates.every((date) => date !== null)) {
    const groups = new Map<string, Set<number>>();
    for (const date of fullDates) {
      if (!date) continue;
      if (!groups.has(date.key)) groups.set(date.key, new Set());
      groups.get(date.key)?.add(date.day);
    }
    return groupFromMap(groups);
  }
  // Earlier CSV imports store dates as "Nov: 05,06 | Dez: 01,02".
  const months = monthsAvailable.split(/[,;|\n]+|\\n/).map(parseMonth).filter(
    (item): item is NonNullable<typeof item> => item !== null,
  );
  const segments = normalized.split(/\s*\|\s*|\n+/).map((item) => item.trim()).filter(Boolean);
  const groups = new Map<string, Set<number>>();
  for (const segment of segments) {
    const match = /^([A-Za-zÀ-ÿ]+(?:\s*\/\s*\d{4})?|\d{4}-\d{1,2}|\d{1,2}\/\d{4})\s*:\s*(.+)$/.exec(segment);
    if (!match) return null;
    const name = normalize(match[1]);
    const qualified = parseMonth(match[1]);
    const monthNum = MONTH_ALIASES[name];
    const possible = qualified ? [qualified] : months.filter((entry) => entry.month === monthNum);
    if (possible.length !== 1) return null;
    const info = possible[0];
    const daysText = match[2].trim();
    if (!/^\d{1,2}(?:\s*,\s*\d{1,2})*$/.test(daysText)) return null;
    const lastDay = new Date(Date.UTC(info.year, info.month, 0)).getUTCDate();
    const days = daysText.split(",").map((day) => Number(day.trim()));
    if (days.some((day) => day < 1 || day > lastDay)) return null;
    if (!groups.has(info.key)) groups.set(info.key, new Set());
    for (const day of days) groups.get(info.key)?.add(day);
  }
  return groupFromMap(groups);
}
