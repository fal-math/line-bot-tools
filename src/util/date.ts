export const DAY_MS = 86_400_000;

export const startOfDay_ = (d: Date = new Date()): Date => {
  const t = new Date(d);
  t.setHours(0, 0, 0, 0);
  return t;
};

export const addDays_ = (d: Date, n: number): Date => new Date(d.getTime() + n * DAY_MS);

/**
 * "5/12" → "2025-05-12"
 * - 半年 (≈183日) より過去の日付は翌年扱い
 */
export function toYMD_(md: string, today: Date = new Date()): string {
  const [mStr, dStr] = md.split('/');
  const m = Number(mStr);
  const d = Number(dStr);
  const year = today.getFullYear();

  const candidate = new Date(year, m - 1, d);
  if (today.getTime() - candidate.getTime() > 183 * DAY_MS) candidate.setFullYear(year + 1);

  const y = candidate.getFullYear();
  const mm = String(candidate.getMonth() + 1).padStart(2, '0');
  const dd = String(candidate.getDate()).padStart(2, '0');
  return `${y}-${mm}-${dd}`;
}

/** "2025-05-12" → "5/12" */
export function toMD_(ymd: string): string {
  const [, month, day] = ymd.split('-');
  return `${Number(month)}/${Number(day)}`;
}
