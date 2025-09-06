/**
 * 設定値（ScriptProperties 等）を起動時に検証するユーティリティ。
 * 外部ライブラリ無し・例外メッセージは「どのキーが欠落/不正か」を明示。
 */
export class ConfigValidator {
  static requireNonEmptyString(value: unknown, keyPath: string): string {
    if (typeof value !== 'string') {
      throw new Error(`[Config] ${keyPath} が string ではありません（type=${typeof value}）`);
    }
    if (value.trim() === '') {
      throw new Error(`[Config] ${keyPath} が空文字です`);
    }
    return value;
  }

  static optionalNonEmptyString(value: unknown, keyPath: string): string | undefined {
    // 未設定(undefined/null)や空文字("")は許容（テンプレで空を入れる想定）
    if (value === undefined || value === null || value === '') return undefined;
    if (typeof value !== 'string') {
      throw new Error(`[Config] ${keyPath} が string ではありません（type=${typeof value}）`);
    }
    return value;
  }
  static requireObject<T extends Record<string, unknown>>(value: unknown, keyPath: string): T {
    if (typeof value !== 'object' || value === null || Array.isArray(value)) {
      throw new Error(`[Config] ${keyPath} はオブジェクトではありません`);
    }
    return value as T;
  }

  /**
   * Line の送信先 ID 群（グループ/ユーザ）の最低限検証
   */
  static validateLineGroupIds(obj: unknown, keyPath = 'LineConfig.id') {
    const o = this.requireObject<Record<string, unknown>>(obj, keyPath);
    // 必須キー（最低限）
    const required = ['apply', 'operations', 'shift', 'all', 'test', 'reserve'];
    for (const k of required) {
      this.requireNonEmptyString(o[k], `${keyPath}.${k}`);
    }
    // 任意キー（存在すれば検証）
    const optional = ['userT', 'userF', 'userI', 'userK'];
    for (const k of optional) {
      this.optionalNonEmptyString(o[k], `${keyPath}.${k}`);
    }
  }

  /**
   * カレンダー関連の最低限検証
   */
  static validateCalendarConfig(obj: unknown, keyPath = 'CalendarConfig.id') {
    const o = this.requireObject<Record<string, unknown>>(obj, keyPath);
    this.requireNonEmptyString(o['url'], `${keyPath}.url`);
    const id = this.requireObject<Record<string, unknown>>(o['id'], `${keyPath}.id`);
    const required = [
      'match',
      'clubPractice',
      'internalDeadline',
      'actualDeadline',
      'externalPractice',
    ];
    for (const k of required) this.requireNonEmptyString(id[k], `${keyPath}.id.${k}`);
  }

  /**
   * 調整さん/スプレッドシート関連
   */
  static validateChouseisanConfig(obj: unknown, keyPath = 'ChouseisanConfig') {
    const o = this.requireObject<Record<string, unknown>>(obj, keyPath);
    this.requireNonEmptyString(o['spreadsheetId'], `${keyPath}.spreadsheetId`);
  }

  static validatePracticeLocations(obj: unknown, keyPath = 'PRACTICE_LOCATIONS') {
    const o = this.requireObject<Record<string, unknown>>(obj, keyPath);
    for (const [name, v] of Object.entries(o)) {
      const loc = this.requireObject<Record<string, unknown>>(v, `${keyPath}.${name}`);
      this.requireNonEmptyString(loc['clubName'], `${keyPath}.${name}.clubName`);
      this.requireNonEmptyString(loc['mapUrl'], `${keyPath}.${name}.mapUrl`);
      this.requireNonEmptyString(loc['buildingName'], `${keyPath}.${name}.buildingName`);
      this.requireNonEmptyString(
        loc['shortenBuildingName'],
        `${keyPath}.${name}.shortenBuildingName`
      );
    }
  }
}
