import { toYMD, toMD } from '../../src/util/date';

describe('date util', () => {
  it('toYMD converts M/D to YYYY-MM-DD with rollover', () => {
    const date = new Date('2025-08-08'); // 固定日付
    expect(toYMD('5/10', date)).toBe('2025-05-10');
    expect(toYMD('1/1', date)).toBe('2026-01-01');    // 半年を超える場合は翌年
  });

  it('toMD converts YYYY-MM-DD to M/D', () => {
    expect(toMD('2025-05-08')).toBe('5/8');
  });
});
