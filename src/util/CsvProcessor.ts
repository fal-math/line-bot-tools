// CsvProcessor.ts
export class CsvProcessor {
  private rows: string[][];

  /**
   * CSVテキストを読み込み、内部表現（2次元配列）として保持する。
   * @param text CSV形式の文字列
   */
  constructor(text: string) {
    this.rows = CsvProcessor.parse(text.replace(/, /g, ',')); // 列間の空白を削除
  }

  // ======================================
  // 静的ユーティリティ（private）
  // ======================================

  /**
   * CSVテキストをパースして2次元配列に変換する（RFC4180の最小限実装）。
   * @param text CSV文字列
   * @returns 行列形式の配列
   */
  private static parse(text: string): string[][] {
    const rows: string[][] = [];
    let row: string[] = [];
    let cell = '';
    let inQuotes = false;

    for (let i = 0; i < text.length; i++) {
      const c = text[i];
      const next = text[i + 1];

      if (inQuotes) {
        if (c === '"' && next === '"') {
          cell += '"';
          i++;
        } else if (c === '"') {
          inQuotes = false;
        } else {
          cell += c;
        }
      } else {
        if (c === '"') {
          inQuotes = true;
        } else if (c === ',') {
          row.push(cell);
          cell = '';
        } else if (c === '\n') {
          row.push(cell);
          rows.push(row);
          row = [];
          cell = '';
        } else if (c === '\r') {
          // ignore
        } else {
          cell += c;
        }
      }
    }

    row.push(cell.trim());
    rows.push(row);
    return rows;
  }

  /**
   * 2次元配列をCSV文字列へ変換する。
   * @param rows 行列形式の配列
   * @returns CSV文字列
   */
  private static stringify(rows: string[][]): string {
    return rows
      .map((cols) =>
        cols
          .map((c) => {
            if (/[",\n]/.test(c)) {
              return `"${c.replace(/"/g, '""')}"`;
            }
            return c;
          })
          .join(',')
      )
      .join('\n');
  }

  /**
   * 現在の内容をCSV文字列として取得する。
   * 指定された headerOrder があれば、その順で列を並べて出力する。
   * headerOrder が部分列でも構わない。存在しない列は無視される。
   *
   * @param headerOrder 出力したいヘッダー名の並び（部分列可）
   * @returns CSV文字列
   */
  public toString(headerOrder?: string[]): string {
    if (!headerOrder || headerOrder.length === 0) {
      return CsvProcessor.stringify(this.rows);
    }

    const header = this.rows[0];
    const indices = headerOrder.map((name) => header.indexOf(name)).filter((idx) => idx >= 0);
    const filteredRows = this.rows.map((row) => indices.map((i) => row[i] ?? ''));
    return CsvProcessor.stringify(filteredRows);
  }

  /**
   * 指定した列名を削除する。
   * 存在しない列名は無視される。
   *
   * @param columnNames 削除したい列名の配列
   * @returns this（メソッドチェーン可能）
   */
  public removeColumns(columnNames: string[]): this {
    const header = this.rows[0];
    const removeIdx = new Set(columnNames.map((n) => header.indexOf(n)));

    this.rows = this.rows.map((r) => r.filter((_, i) => !removeIdx.has(i)));
    return this;
  }

  /**
   * 行フィルタを適用し、条件を満たす行のみを残す。
   * predicate に渡される引数は、ヘッダー名をキーとするオブジェクト。
   *
   * @param predicate 行を残す条件関数（true: 残す, false: 除外）
   * @returns this（メソッドチェーン可能）
   */
  public filterRows(predicate: (rowObj: Record<string, string>) => boolean): this {
    const header = this.rows[0];

    this.rows = [
      header,
      ...this.rows.slice(1).filter((r) => {
        const obj: Record<string, string> = {};
        header.forEach((h, i) => (obj[h] = r[i]));
        return predicate(obj);
      }),
    ];
    return this;
  }

  /**
   * 特定の列に変換関数を適用し、セルを変換する。
   * （例：日付フォーマット変換 "2025年1月2日" → "2025/01/02"）
   *
   * @param colName 変換対象の列名
   * @param convert セル値を受け取り新しい文字列を返す変換関数
   * @returns this（メソッドチェーン可能）
   */
  public transformColumn(colName: string, convert: (value: string) => string): this {
    const header = this.rows[0];
    const idx = header.indexOf(colName);
    if (idx === -1) return this;

    this.rows = this.rows.map((r, i) => {
      if (i === 0) return r; // header
      const newRow = [...r];
      newRow[idx] = convert(r[idx] ?? '');
      return newRow;
    });

    return this;
  }
}
