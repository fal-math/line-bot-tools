const DAY_MS = 86_400_000;
export const WEEK_DAYS = ["日", "月", "火", "水", "木", "金", "土"];
export class DateUtils {
  static startOfDay(d?: Date): Date {
    const date = d ? new Date(d) : new Date();
    date.setHours(0, 0, 0, 0);
    return date;
  }

  static addDays(d: Date, n: number): Date {
    const date = new Date(d);
    date.setDate(date.getDate() + n);
    return date;
  }

  static parseYMD(ymd: string): Date {
    const [year, month, day] = ymd.split('-').map(Number);
    return new Date(year, month - 1, day);
  }

  static formatYMD(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  static parseMD(md: string): Date {
    const [month, day] = md.split('/').map(Number);
    const m = Number(month);
    const d = Number(day);
    const y = new Date().getFullYear();

    const candidate = new Date(y, m - 1, d);
    if (new Date().getTime() - candidate.getTime() > 183 * DAY_MS)
      candidate.setFullYear(y + 1);
    return candidate;
  }

  static formatMD(date: Date): string {
    const m = date.getMonth() + 1;
    const d = date.getDate();
    return `${m}/${d}`;
  }
}
