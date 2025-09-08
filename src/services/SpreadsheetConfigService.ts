import { PracticeConfigRow } from '../types/type';

type Header = 'name' | 'description';

export class SpreadsheetConfigService {
  constructor(private sheetId: string, private sheetName: string) {}

  /**
   * 外部練の一覧を得る
   * @returns 
   */
  getAll(): Map<string, PracticeConfigRow> {
    const sheet = SpreadsheetApp.openById(this.sheetId).getSheetByName(this.sheetName);
    if (!sheet) throw new Error(`Sheet not found: ${this.sheetName}`);

    const values = sheet.getDataRange().getDisplayValues(); // 文字列でOK
    if (values.length < 2) return new Map();

    const header = values[0].map((s) => s.trim());
    const colIndex: Record<Header, number> = {
      name: header.findIndex((h) => /^name$/i.test(h)),
      description: header.findIndex((h) => /^description$/i.test(h)),
    };
    this.assertHeader(colIndex, header);

    const map = new Map<string, PracticeConfigRow>();
    for (let r = 1; r < values.length; r++) {
      const row = values[r];
      if (row.every((c) => c === '')) continue;

      const item: PracticeConfigRow = {
        name: (row[colIndex.name] ?? '').trim(),
        description: (row[colIndex.description] ?? '').trim(),
      };

      if (!this.isValid(item)) {
        throw new Error(`Invalid row at R${r + 1}: ${JSON.stringify(item)}`);
      }
      if (map.has(item.name)) {
        throw new Error(`Duplicate name "${item.name}" at R${r + 1}`);
      }
      map.set(item.name, item);
    }
    return map;
  }

  /**
   * 外部練の注意事項を取得
   * @param name 外部練の名称
   * @returns 外部練の注意事項/見つからない場合は空文字
   */
  getDescription(name: string): string {
    return this.getAll().get(name)?.description || '';
  }

  /**
   * 外部練の全種別をリストで取得
   * @returns 外部練の全種別
   */
  list(): PracticeConfigRow[] {
    return Array.from(this.getAll().values());
  }

  /**
   * すべての外部練の名称をリストで取得
   * @returns すべての外部練の名称のリスト
   */
  names(): string[] {
    return this.list().map((r) => r.name);
  }

  /**
   * 外部練を名前から取得
   * @param name 外部練の名称
   * @returns 外部練/見つからない場合はnull
   */
  getByName(name: string): PracticeConfigRow | null {
    const hit = this.list().find((r) => r.name === name);
    return hit ?? null;
  }

  private assertHeader(idx: Record<Header, number>, header: string[]): void {
    const missing = Object.entries(idx)
      .filter(([, i]) => i < 0)
      .map(([k]) => k);
    if (missing.length) {
      throw new Error(
        `Missing required columns: ${missing.join(', ')}. header=${JSON.stringify(header)}`
      );
    }
  }

  private isValid(x: PracticeConfigRow): x is PracticeConfigRow {
    return x.name.length > 0;
  }
}
