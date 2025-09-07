export const DAY_LABELS_JA = ['日', '月', '火', '水', '木', '金', '土'] as const;


export function ymdKey(d: Date): string {
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

export function groupByYmd<T extends { date: Date }>(evs: T[]): Map<string, T[]> {
  const m = new Map<string, T[]>();
  for (const ev of evs) {
    const k = ymdKey(ev.date);
    const arr = m.get(k);
    if (arr) arr.push(ev);
    else m.set(k, [ev]);
  }
  return m;
}

export function parseStartMinutes(timeRange: string): number {
  // "9:00-12:00" / "0900-1200" / "9-12" 等を許容
  const m = timeRange?.match?.(/(\d{1,2})(?::?(\d{2}))?/);
  if (!m) return Number.MAX_SAFE_INTEGER;
  const h = parseInt(m[1], 10);
  const min = m[2] ? parseInt(m[2], 10) : 0;
  return h * 60 + min;
}

export function compareByDateThenStart(
  a: { date: Date; timeRange?: string },
  b: { date: Date; timeRange?: string }
): number {
  const ad = a.date.getTime(),
    bd = b.date.getTime();
  if (ad !== bd) return ad - bd;
  const am = parseStartMinutes(a.timeRange ?? '');
  const bm = parseStartMinutes(b.timeRange ?? '');
  if (am !== bm) return am - bm;
  return 0;
}

export class MessageBase {
  private lines: string[] = [];
  add(line?: string | null): this {
    if (line != null && line !== '') this.lines.push(line);
    return this;
  }
  blank(): this {
    this.lines.push('');
    return this;
  }
  section(title: string): this {
    if (this.lines.length) this.blank();
    this.add(`【${title}】`);
    return this;
  }
  bullet(text: string, bullet = '・'): this {
    this.add(`${bullet}${text}`);
    return this;
  }
  indent(text: string, prefix = '  '): this {
    this.add(`${prefix}${text}`);
    return this;
  }
  toString(): string {
    return this.lines.join('\n');
  }
}
