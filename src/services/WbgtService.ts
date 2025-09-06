type Measurement = {
  time: Date;
  predicted: number;
};

type Parsed = {
  id: number;
  baseTime: Date;
  measurements: Measurement[];
};

// static データはクラスの外でまとめて定義
export const WbgtConfig = {
  START_MD: { month: 4, day: 23 } as const,
  END_MD: { month: 10, day: 22 } as const,
  HOURS: [9, 12, 15, 18] as const,
};

export class WbgtService {
  /** CSV URL */
  private url = 'https://www.wbgt.env.go.jp/prev15WG/dl/yohou_43241.csv';

  constructor() {}
  /**
   * 4/23〜10/22 の期間内のみフォーマット済み文字列を返す
   * 期間外は空文字
   */
  public getMessage(): { message: string; values?: Parsed } {
    if (!this.isInSeason(new Date())) {
      return { message: '' };
    }

    const raw = UrlFetchApp.fetch(this.url).getContentText('UTF-8');
    const parsed = this.parseCsv(raw);
    const body = this.formatDailyValues(parsed);

    const header = [
      '■今日の暑さ指数(WBGT)・屋外■',
      body,
      '',
      '=値の読み方=',
      '↑で提供されている値は屋外の値のため、参考程度にしてください',
      '31以上:運動は原則中止',
      '28-31:厳重警戒, 10～20分おきに休憩をとり水分・塩分の補給を行う',
      '25-28:警戒, 積極的に休憩をとり適宜、水分・塩分を補給する',
      '21-25:注意, 運動の合間に積極的に水分・塩分を補給する',
    ];

    return { message: header.join('\n'), values: parsed };
  }

  /** 今日が 4/23〜10/22 の間かどうか */
  private isInSeason(today: Date): boolean {
    const { START_MD, END_MD } = WbgtConfig;
    const y = today.getFullYear();
    const start = new Date(y, START_MD.month - 1, START_MD.day);
    const end = new Date(y, END_MD.month - 1, END_MD.day, 23, 59, 59);
    return today >= start && today <= end;
  }

  private parseCsv(csv: string): Parsed {
    const [header, data] = csv.trim().split('\n');
    const colsH = header.split(',').map((s) => s.trim());
    const colsD = data.split(',').map((s) => s.trim());

    const id = +colsD[0];
    const baseTime = new Date(colsD[1].replace(/-/g, '/'));
    const times = colsH.slice(2);
    const values = colsD.slice(2).map(Number);

    const measurements = times.map((ts, i) => {
      const yyyy = ts.slice(0, 4);
      const mm = ts.slice(4, 6);
      const dd = ts.slice(6, 8);
      const hh = ts.slice(8, 10);
      return {
        time: new Date(`${yyyy}-${mm}-${dd}T${hh}:00:00`),
        predicted: values[i],
      };
    });

    return { id, baseTime, measurements };
  }

  private extractDaily(parsed: Parsed) {
    const { HOURS } = WbgtConfig;
    return HOURS.reduce<Record<number, number | null>>((acc, h) => {
      const m = parsed.measurements.find((x) => x.time.getHours() === h);
      // 提供データはWBGT値*10の形式
      acc[h] = m ? m.predicted / 10 : null;
      return acc;
    }, {});
  }

  private formatDailyValues(parsed: Parsed): string {
    const { HOURS } = WbgtConfig;
    const daily = this.extractDaily(parsed);
    return HOURS.map((h) => `${String(h).padStart(2, '0')}時：${daily[h] ?? '-'}`).join('\n');
  }
}
