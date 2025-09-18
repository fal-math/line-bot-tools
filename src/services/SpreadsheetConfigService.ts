import { HeaderMap } from "../types/type";

// 外部練
export interface PracticeConfigRow {
  name: string;
  description: string;
}

// 例: { name: "会場名", shortName: "会場名（短縮）", ... }

export class SpreadsheetConfigService<T extends Record<string, any>> {
  constructor(
    private sheetId: string,
    private sheetName: string,
    private headerMap: HeaderMap<T>, // 英語→日本語
    private keyField: keyof T        // Map のキーに使うプロパティ
  ) {}

  getAll(): Map<string, T> {
    const sheet = SpreadsheetApp.openById(this.sheetId).getSheetByName(this.sheetName);
    if (!sheet) throw new Error(`Sheet not found: ${this.sheetName}`);

    const values = sheet.getDataRange().getDisplayValues();
    if (values.length < 2) return new Map();

    const header = values[0].map((s) => s.trim());

    // 日本語→列番号
    const colIndex: Record<string, number> = {};
    for (const jp of Object.values(this.headerMap)) {
      const idx = header.findIndex((h) => h === jp);
      if (idx < 0) throw new Error(`Missing required column "${jp}" in ${this.sheetName}`);
      colIndex[jp] = idx;
    }

    const map = new Map<string, T>();
    for (let r = 1; r < values.length; r++) {
      const row = values[r];
      if (row.every((c) => c === '')) continue;

      const item: Partial<T> = {};
      for (const [en, jp] of Object.entries(this.headerMap)) {
        let v = row[colIndex[jp]] ?? '';
        if (typeof (item as any)[en] === 'number') {
          (item as any)[en] = Number(v);
        } else {
          (item as any)[en] = v.trim();
        }
      }

      const key = (item[this.keyField] as string).trim();
      if (!key) throw new Error(`Empty key at R${r + 1}`);
      if (map.has(key)) throw new Error(`Duplicate key "${key}" at R${r + 1}`);
      map.set(key, item as T);
    }
    return map;
  }

  list(): T[] {
    return Array.from(this.getAll().values());
  }

  names(): string[] {
    return Array.from(this.getAll().keys());
  }

  getByName(name: string): T | null {
    return this.getAll().get(name) ?? null;
  }
}
