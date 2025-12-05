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
export const SEPARATOR = '-'.repeat(30);

const PAREN_MAP: Record<string, string> = {
  // 丸括弧
  '（': '(',
  '）': ')',
  // 角括弧
  '［': '[',
  '］': ']',
  // 波括弧
  '｛': '{',
  '｝': '}',
  // 山括弧
  '＜': '<',
  '＞': '>',
  '〈': '<',
  '〉': '>',
  '《': '<',
  '》': '>',
  // 装飾括弧
  '【': '[',
  '】': ']',
};

export class StringUtils {
  /**
   * 全角英数字を半角英数字に変換する関数
   * @param str 変換したい文字列
   * @returns 変換済み文字列
   */
  static toHalfWidth(str: string): string {
    return str.replace(/[Ａ-Ｚａ-ｚ０-９]/g, (s) => String.fromCharCode(s.charCodeAt(0) - 0xfee0));
  }

  /**
   * 文字列の先頭が指定のものの場合、取り除く
   * @param input 入力
   * @param removed 取り除く文字列
   * @returns 除去済み文字列
   */
  static removeLeading(input: string, removed: string): string {
    if (removed !== '' && input.startsWith(removed)) {
      return input.slice(removed.length);
    }
    return input;
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
   * 括弧類を半角に正規化する
   *
   * @param input 入力文字列
   * @returns 正規化後の文字列
   */
  static normalizeBrackets(input: string): string {
    if (!input) return input;
    return input.replace(
      new RegExp(`[${Object.keys(PAREN_MAP).join('')}]`, 'g'),
      (c) => PAREN_MAP[c] || c
    );
  }

  /**
   * 括弧類を削除する
   *
   * @param input 入力文字列
   * @returns 括弧を削除した文字列
   */
  static removeBracketSymbols(input: string): string {
    return input.replace(/[()\[\]{}〈〉《》<>＜＞【】（）［］｛｝「」『』]/g, '');
  }
}
