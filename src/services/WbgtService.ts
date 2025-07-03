type Measurement = {
  time: Date;
  predicted: number;
};

type Parsed = {
  id: number;
  baseTime: Date;
  measurements: Measurement[];
};

export class WbgtAlert {
  private url = "https://www.wbgt.env.go.jp/prev15WG/dl/yohou_43241.csv";

  /**
   * 4/23〜10/22 の期間内のみフォーマット済み文字列を返す
   * 期間外は空文字
   */
  public getMessage(): string {
    const today = new Date();
    const year = today.getFullYear();

    const start = new Date(year, 3, 23); // 4月23日 00:00
    const end = new Date(year, 9, 22, 23, 59, 59); // 10月22日 23:59:59
    if (today < start || today > end) return '';

    const raw = UrlFetchApp.fetch(this.url).getContentText('UTF-8');
    const parsedCsv = this.parseCsv(raw);
    const predictedValues = this.formatDailyValuesString(parsedCsv);

    const message = [
      "",
      "■今日の暑さ指数(WBGT)・屋外■",
      predictedValues,
      "",
      "=値の読み方=",
      "↑で提供されている値は屋外の値のため、参考程度にしてください",
      "31以上:運動は原則中止",
      "28-31:厳重警戒, 10～20分おきに休憩をとり水分・塩分の補給を行う",
      "25-28:警戒, 積極的に休憩をとり適宜、水分・塩分を補給する",
      "21-25:注意, 運動の合間に積極的に水分・塩分を補給する",
    ].join('\n'); 
    return message;
  }

  private parseCsv(input: string): Parsed {
    const lines = input.trim().split('\n');
    const headerItems = lines[0].split(',').map(s => s.trim());
    const dataItems = lines[1].split(',').map(s => s.trim());

    const id = Number(dataItems[0]);
    const baseTime = new Date(dataItems[1].replace(/-/g, '/'));

    const times = headerItems.slice(2);
    const values = dataItems.slice(2).map(Number);

    const measurements: Measurement[] = times.map((ts, i) => {
      const year = ts.slice(0, 4);
      const month = ts.slice(4, 6);
      const day = ts.slice(6, 8);
      const hour = ts.slice(8, 10);
      const date = new Date(`${year}-${month}-${day}T${hour}:00:00`);
      return { time: date, predicted: values[i] };
    });

    return { id, baseTime, measurements };
  }

  private extractDailyValues(
    parsed: Parsed,
    hours: number[] = [9, 12, 15, 18]
  ): Record<number, number | null> {
    const result: Record<number, number | null> = {};
    hours.forEach(h => {
      const measurement = parsed.measurements.find(m => m.time.getHours() === h);
      result[h] = measurement ? measurement.predicted / 10 : null;
    });
    return result;
  }

  private formatDailyValuesString(
    parsed: Parsed,
    hours: number[] = [9, 12, 15, 18]
  ): string {
    const values = this.extractDailyValues(parsed, hours);
    return hours
      .map(h => {
        const hh = String(h).padStart(2, '0');
        return `${hh}時：${values[h] !== null ? values[h] : '-'}`;
      }).join('\n');
  }
}