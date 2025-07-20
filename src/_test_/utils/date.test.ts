import { DateUtils } from "../../util/DateUtils";

describe('date util', () => {
  it('toYMD converts M/D to YYYY-MM-DD with rollover', () => {
    const today = new Date("2025/08/08");
    expect(DateUtils.parseMD('5/10').getTime()).toBe(new Date("2025/05/10").getTime());
    expect(DateUtils.parseMD('1/1').getTime()).toBe(new Date("2026/01/01").getTime());
  });

  it('toYMD converts M/D to YYYY-MM-DD with rollover', () => {
    const today = new Date("2025/04/08");
    expect(DateUtils.parseMD('5/10').getTime()).toBe(new Date("2025/05/10").getTime());
    expect(DateUtils.parseMD('1/1').getTime()).toBe(new Date("2025/01/01").getTime());
  });
});
