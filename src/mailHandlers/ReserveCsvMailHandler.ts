import Config from '../config/config';
import { LineService } from '../services/LineService';
import { CsvProcessor } from '../util/CsvProcessor';
import { StringUtils } from '../util/StringUtils';
import { MailHandler } from './MailHandler';

export class ReserveCsvMailHandler implements MailHandler {
  constructor(private readonly line = new LineService(), private readonly config = Config) {}

  handle(msg: GoogleAppsScript.Gmail.GmailMessage): void {
    const body = this.buildLineNotice(StringUtils.stripCss(msg.getPlainBody()));
    const notice = ['【さいたま市予約一覧】', this.formatSchedule(body)].join('\n');
    this.line.pushText(this.config.Line.id.reserve, notice);
  }

  private buildLineNotice(mailBody: string): string {
    return new CsvProcessor(mailBody)
      .filterRows((row) => row['状態'] === '予約')
      .toString(['日付', '曜日', '時間帯', '館名', '予約ID'])
      .replace(/(\d{4})\/(\d{2})\/(\d{2}),(.),(.+)/g, '$2/$3$4,$5')
      .replace(/-12:00 13:00/g, '')
      .replace(/-15:00 15:00/g, '')
      .replace(/-17:00 18:00/g, '')
      .replace(/9:00/g, '9')
      .replace(/12:00/g, '12')
      .replace(/13:00/g, '13')
      .replace(/15:00/g, '15')
      .replace(/17:00/g, '17')
      .replace(/18:00/g, '18')
      .replace(/21:30/g, '21.5')
      .split('\n')
      .slice(1) // ヘッダー行を除去
      .join('\n');
  }

  private formatSchedule(text: string): string {
    // 行ごとに [日付, 時間帯, 館名, ID] を抽出
    const rows = text
      .trim()
      .split('\n')
      .map((line) => line.split(','))
      .map(([date, time, place, id]) => ({ date, time, place, id }));

    // 日付ごとにグルーピング
    const grouped: Record<string, { time: string; place: string; id: string }[]> = {};

    for (const r of rows) {
      if (!grouped[r.date]) grouped[r.date] = [];
      grouped[r.date].push({ time: r.time, place: r.place, id: r.id });
    }

    // 出力整形
    return Object.entries(grouped)
      .map(([date, items]) => {
        const body = items.map((r) => `・${r.place} ${r.time} (${r.id})`).join('\n');
        return `${date}\n${body}`;
      })
      .join('\n\n');
  }
}
