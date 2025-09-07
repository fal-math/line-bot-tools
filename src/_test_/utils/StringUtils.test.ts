import { KarutaClass } from '../../types/type';
import { StringUtils } from '../../util/StringUtils';

describe('formatStrictKarutaClass', () => {
  it('単独級の記載', () => {
    const text = 'B';
    const kcArray = [KarutaClass.B];
    expect(StringUtils.formatStrictKarutaClass(text)).toStrictEqual(kcArray);
  });
  it('単独級の記載、「級」', () => {
    const text = 'B級';
    const kcArray = [KarutaClass.B];
    expect(StringUtils.formatStrictKarutaClass(text)).toStrictEqual(kcArray);
  });
  it('複数級の記載', () => {
    const text = 'DBC';
    const kcArray = [KarutaClass.B, KarutaClass.C, KarutaClass.D];
    expect(StringUtils.formatStrictKarutaClass(text)).toStrictEqual(kcArray);
  });
  it('以上', () => {
    const text = 'D以上';
    const kcArray = [KarutaClass.A, KarutaClass.B, KarutaClass.C, KarutaClass.D];
    expect(StringUtils.formatStrictKarutaClass(text)).toStrictEqual(kcArray);
  });
  it('級以上', () => {
    const text = 'D級以上';
    const kcArray = [KarutaClass.A, KarutaClass.B, KarutaClass.C, KarutaClass.D];
    expect(StringUtils.formatStrictKarutaClass(text)).toStrictEqual(kcArray);
  });
});

describe('formatKarutaClass', () => {
  it('単独級の記載', () => {
    const text = 'B';
    const kcArray = [KarutaClass.B];
    expect(StringUtils.formatKarutaClass(text)).toStrictEqual(kcArray);
  });
  it('単独級の記載、「級」', () => {
    const text = 'B級';
    const kcArray = [KarutaClass.B];
    expect(StringUtils.formatStrictKarutaClass(text)).toStrictEqual(kcArray);
  });
  it('複数級の記載', () => {
    const text = 'DBC';
    const kcArray = [KarutaClass.B, KarutaClass.C, KarutaClass.D];
    expect(StringUtils.formatKarutaClass(text)).toStrictEqual(kcArray);
  });
  it('以上', () => {
    const text = 'D以上';
    const kcArray = [KarutaClass.A, KarutaClass.B, KarutaClass.C, KarutaClass.D];
    expect(StringUtils.formatKarutaClass(text)).toStrictEqual(kcArray);
  });
  it('級以上', () => {
    const text = 'D級以上';
    const kcArray = [KarutaClass.A, KarutaClass.B, KarutaClass.C, KarutaClass.D];
    expect(StringUtils.formatStrictKarutaClass(text)).toStrictEqual(kcArray);
  });
  it('キャスト不可能な例', () => {
    const text = 'G級①②③以上';
    expect(StringUtils.formatKarutaClass(text)).toStrictEqual(text);
  });
});

describe('toHalfWidth', () => {
  it('半角英数字はそのまま残す', () => {
    expect(StringUtils.toHalfWidth('ABC123')).toBe('ABC123');
  });

  it('全角英数字を半角に変換する', () => {
    expect(StringUtils.toHalfWidth('ＡＢＣ１２３')).toBe('ABC123');
  });

  it('漢字・ひらがな・カタカナはそのまま残す', () => {
    expect(StringUtils.toHalfWidth('漢字かなカナ')).toBe('漢字かなカナ');
  });

  it('混在している場合は英数字だけ変換する', () => {
    expect(StringUtils.toHalfWidth('今日は２０２５年９月７日')).toBe('今日は2025年9月7日');
  });

  it('記号はそのまま残す（！＠＃は対象外）', () => {
    expect(StringUtils.toHalfWidth('！＠＃')).toBe('！＠＃');
  });
});
