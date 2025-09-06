const DAY_MS = 24 * 60 * 60 * 1000;

export const WEEK_DAYS = ["日", "月", "火", "水", "木", "金", "土"];
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
    const HALF_YEAR_DAYS = 183
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
}
