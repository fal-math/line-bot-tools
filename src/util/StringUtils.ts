import { KarutaClass } from "../type";
const ALL_CLASSES = Object.values(KarutaClass) as KarutaClass[];

export class StringUtils {
  static stripCss(text: string): string {
    return text.replace(/([^\{]+)\s*\{[^}]*}/g, '').replace(/[\n\r]*\s*[\n\r]+/g, '\n')
  };

  static formatKarutaClass(input: string): KarutaClass[] {
    if (!input) return [];
    const text = input.trim();

    // 「X以上」のパターンを優先処理
    const m = text.match(/^([A-G])以上$/);
    if (m) {
      const limit = m[1] as KarutaClass;
      const idx = ALL_CLASSES.indexOf(limit);
      return idx >= 0 ? ALL_CLASSES.slice(0, idx + 1) : [];
    }

    // 個別のクラス指定（A, CDE など）は [A-G] 抽出→重複除去→順序付け
    const chars = text.match(/[A-G]/g) ?? [];
    const unique = Array.from(new Set(chars)) as (keyof typeof KarutaClass)[];
    return unique
      .map(c => KarutaClass[c])
      .sort((a, b) => ALL_CLASSES.indexOf(a) - ALL_CLASSES.indexOf(b));
  }
}