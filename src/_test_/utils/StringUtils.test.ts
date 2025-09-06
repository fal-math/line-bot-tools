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
