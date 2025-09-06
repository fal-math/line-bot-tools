import { WbgtService } from '../../services/WbgtService';

const sampleCsv = `,,2025062121,2025062124,2025062203,2025062206,2025062209,2025062212,2025062215,2025062218,2025062221,2025062224,2025062303,2025062306,2025062309,2025062312,2025062315,2025062318,2025062321,2025062324
43056,2025/06/21 19:25,240,230,230,230,270,290,310,270,260,250,240,260,280,290,290,270,260,250`;

describe('WbgtAlert クラスのテスト', () => {
  let alert: WbgtService;
  let parsed: any;

  beforeEach(() => {
    alert = new WbgtService();
    // private メソッド parseCsv を any キャストで呼び出し
    parsed = (alert as any).parseCsv(sampleCsv);
  });

  afterEach(() => {
    // タイマーとモックをリセット
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it('parseCsv で正しく Parsed 型にマッピングされる', () => {
    expect(parsed.id).toBe(43056);
    expect(parsed.baseTime).toEqual(new Date('2025-06-21T19:25:00'));
    expect(parsed.measurements).toHaveLength(18);
    expect(parsed.measurements[0]).toMatchObject({
      time: new Date('2025-06-21T21:00:00'),
      predicted: 240,
    });
    expect(parsed.measurements[17]).toMatchObject({
      time: new Date('2025-06-23T24:00:00'),
      predicted: 250,
    });
  });

  it('extractDailyValues で時刻ごとの値を 10 で割って返す', () => {
    const daily: Record<number, number | null> = (alert as any).extractDaily(parsed);
    expect(daily[9]).toBe(27);
    expect(daily[12]).toBe(29);
    expect(daily[15]).toBe(31);
    expect(daily[18]).toBe(27);
  });

  it('formatDailyValuesString が「09時：26」形式で出力される', () => {
    const formatted: string = (alert as any).formatDailyValues(parsed);
    const lines = formatted.split('\n');
    expect(lines).toEqual(['09時：27', '12時：29', '15時：31', '18時：27']);
  });

  describe('getMessage の振る舞い', () => {
    it('シーズン外（例: 1月1日）では空文字を返す', () => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date('2025-01-01T00:00:00'));

      const res = alert.getMessage();
      expect(res).toEqual({ message: '' });
    });

    it('シーズン内（例: 6月22日）ではヘッダー＋値＋values を返す', () => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date('2025-06-22T12:00:00'));

      // UrlFetchApp.fetch をモック
      (global as any).UrlFetchApp = {
        fetch: () => ({
          getContentText: () => sampleCsv,
        }),
      };

      const res = alert.getMessage();
      // メッセージ本文にヘッダーが含まれていること
      expect(res.message).toContain('■今日の暑さ指数(WBGT)・屋外■');
      // フォーマット済み値が含まれていること
      expect(res.message).toContain('09時：27');
      expect(res.message).toContain('12時：29');
      // values が parseCsv の結果と一致すること
      expect(res.values).toEqual(parsed);
    });
  });
});
