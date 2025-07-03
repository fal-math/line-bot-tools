import { parseCsv, Parsed, WbgtAlert } from './WbgtService';

describe('parseCsv', () => {
  const csv = `
,,2025062121,2025062124,2025062203,2025062206,2025062209,2025062212,2025062215,2025062218,2025062221,2025062224,2025062303,2025062306,2025062309,2025062312,2025062315,2025062318,2025062321,2025062324
43056,2025/06/21 19:25,240,230,230,230,270,290,310,270,260,250,240,260,280,290,290,270,260,250
`.trim();

  it('should parse id and baseTime correctly', () => {
    const result: Parsed = parseCsv(csv);
    expect(result.id).toBe(43056);
    // Compare timestamps
    expect(result.baseTime.getTime()).toBe(new Date('2025-06-21T19:25:00').getTime());
  });

  it('should produce the correct number of measurements', () => {
    const result = parseCsv(csv);
    expect(result.measurements).toHaveLength(19);
  });

  it('should parse the first and last measurements correctly', () => {
    const result = parseCsv(csv);
    const first = result.measurements[0];
    expect(first.time.getTime()).toBe(new Date('2025-06-21T21:00:00').getTime());
    expect(first.value).toBe(240);

    const last = result.measurements[result.measurements.length - 1];
    expect(last.time.getTime()).toBe(new Date('2025-06-23T24:00:00').getTime());
    expect(last.value).toBe(250);
  });
});
