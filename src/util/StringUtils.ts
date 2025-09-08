import { ClassMap, KarutaClass } from '../types/type';

export const KARUTA_CLASS_COLOR: ClassMap<string> = {
  A: '🟧',
  B: '🟦',
  C: '🟩',
  D: '🟨',
  E: '🟦',
  F: '🟥',
  G: '🟪',
};
export const SEPARATOR = '__________';

export class StringUtils {
  /**
   * 全角英数字を半角英数字に変換する関数
   * @param str 変換したい文字列
   * @returns 変換済み文字列
   */
  static toHalfWidth(str: string): string {
    return str.replace(/[Ａ-Ｚａ-ｚ０-９]/g, (s) => String.fromCharCode(s.charCodeAt(0) - 0xfee0));
  }

  static stripCss(text: string): string {
    return text.replace(/([^\{]+)\s*\{[^}]*}/g, '').replace(/[\n\r]*\s*[\n\r]+/g, '\n');
  }

  static htmlToPlainText(html: string): string {
    return html
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/div>/gi, '\n')
      .replace(/<[^>]+>/g, '')
      .trim();
  }

  /**
   * @param input 級を表す文字列(ABC, G以上, etc..)
   * @returns KarutaClassの配列
   */
  static formatStrictKarutaClass(input: string): KarutaClass[] {
    if (!input) return [];
    const text = input.trim().replace('級', '');
    const ALL_CLASSES = Object.values(KarutaClass) as KarutaClass[];

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
      .map((c) => KarutaClass[c])
      .sort((a, b) => ALL_CLASSES.indexOf(a) - ALL_CLASSES.indexOf(b));
  }

  /**
   * @param input 級を表す文字列(ABC, G以上, etc..)
   * @returns KarutaClassの配列 or 文字列
   */
  static formatKarutaClass(input: string): KarutaClass[] | string {
    const regex = /^(?:[A-G](?:級)?(?:以上)?)+$/;
    return regex.test(input) ? this.formatStrictKarutaClass(input) : input;
  }

  /**
   * @param input KarutaClassの配列 or 文字列
   * @returns 級を表す文字列(ABC, etc..)
   */
  static stringfyKarutaClass(input: KarutaClass[] | string) {
    return Array.isArray(input) ? input.join('') : input;
  }

  /**
   * 文字列からよく使われるカッコ文字をすべて除去する
   * @param input 元の文字列
   * @returns カッコ文字のみ除去した文字列
   */
  static removeBracketSymbols(input: string): string {
    return input.replace(/[()\[\]{}〈〉《》<>＜＞【】（）［］｛｝「」『』]/g, '');
  }
}
