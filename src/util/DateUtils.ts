export const DAY_MS = 24 * 60 * 60 * 1000;
export const WEEK_DAYS = ['日', '月', '火', '水', '木', '金', '土'];

/**
 * 日付ユーティリティクラス
 */
export class DateUtils {
  /**
   * 指定日の 00:00:00 に設定した Date オブジェクトを返す
   * @param d 対象日付（省略時は現在日付）
   * @returns 当該日の始まりの Date
   */
  static startOfDay(d?: Date): Date {
    const date = d ? new Date(d) : new Date();
    date.setHours(0, 0, 0, 0);
    return date;
  }

  /**
   * 日付に指定日数を加算した Date オブジェクトを返す
   * @param d 元の日付
   * @param n 加算する日数（負数で減算）
   * @returns 加算後の Date
   */
  static addDays(d: Date, n: number): Date {
    const date = new Date(d);
    date.setDate(date.getDate() + n);
    return date;
  }

  /**
   * "YYYY-MM-DD" 形式の文字列をパースして Date を返す
   * @param ymd 年月日文字列（例: "2025-07-12"）
   * @returns パース結果の Date
   */
  static parseYMD(ymd: string): Date {
    const [year, month, day] = ymd.split('-').map(Number);
    return new Date(year, month - 1, day);
  }

  /**
   * Date を "YYYY-MM-DD" 形式の文字列にフォーマットして返す
   * @param date 対象の Date
   * @returns フォーマット済み文字列（例: "2025-07-12"）
   */
  static formatYMD(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  /**
   * "M/D" 形式の文字列をパースして 適切なDate を返す
   * @param md 月日文字列（例: "7/12"）
   * @returns パース結果の Date
   */
  static parseMD(md: string, today: Date = new Date()): Date {
    const HALF_YEAR_DAYS = 183;
    const [month, day] = md.split('/').map(Number);
    const y = today.getFullYear();
    const candidate = new Date(y, month - 1, day);
    // 今日から過去183日以上前なら翌年として扱う
    if (today.getTime() - candidate.getTime() > HALF_YEAR_DAYS * DAY_MS) {
      candidate.setFullYear(y + 1);
    }
    return candidate;
  }

  /**
   * Date を "M/D" 形式の文字列にフォーマットして返す
   * @param date 対象の Date
   * @returns フォーマット済み文字列（例: "7/12"）
   */
  static formatMD(date: Date): string {
    const m = date.getMonth() + 1;
    const d = date.getDate();
    return `${m}/${d}`;
  }

  /**
   * Date を "M/D(D)" 形式の文字列にフォーマットして返す
   * @param date 対象の Date
   * @returns フォーマット済み文字列（例: "7/12(火)"）
   */
  static formatMDD(d: Date, dayLabels: readonly string[] = WEEK_DAYS): string {
    return `${this.formatMD(d)}(${dayLabels[d.getDay()]})`;
  }

  /**
   * timeRange"0900-1200"から, 開始時刻を0時からの経過分数で取得
   * @param timeRange "0900-1200"のような文字列
   * @returns 開始時刻の0時からの経過分数
   */
  static parseStartMinutes(timeRange: string): number {
    // "9:00-12:00" / "0900-1200" / "9-12" 等を許容
    const m = timeRange?.match?.(/(\d{1,2})(?::?(\d{2}))?/);
    if (!m) return Number.MAX_SAFE_INTEGER;
    const h = parseInt(m[1], 10);
    const min = m[2] ? parseInt(m[2], 10) : 0;
    return h * 60 + min;
  }

  /**
   * DateとtimeRangeを持つ2つのデータを比較し, 大小関係を返す
   * @param a 日付Dateと時間帯timeRange
   * @param b 日付Dateと時間帯timeRange
   * @returns aの方が早ければ負の数, 同じなら0, 遅ければ正の数
   */
  static compareByDateThenStart(
    a: { date: Date; timeRange?: string },
    b: { date: Date; timeRange?: string }
  ): number {
    const ad = a.date.getTime(),
      bd = b.date.getTime();
    if (ad !== bd) return ad - bd;
    const am = DateUtils.parseStartMinutes(a.timeRange ?? '');
    const bm = DateUtils.parseStartMinutes(b.timeRange ?? '');
    if (am !== bm) return am - bm;
    return 0;
  }

  /**
   * 同じ日付のイベントをグループ化する
   * @param evs eventの配列
   * @returns (日付,eventの配列)のマップ
   */
  // static groupByYmd<T extends { date: Date }>(evs: T[]): Map<string, T[]> {
  // const m = new Map<string, T[]>();
  // for (const ev of evs) {
  //   const k = DateUtils.formatYMD(ev.date);
  //   const arr = m.get(k);
  //   if (arr) arr.push(ev);
  //   else m.set(k, [ev]);
  // }
  // return m;
  // }
}
