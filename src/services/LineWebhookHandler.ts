import { LineService } from '../services/LineService';
import { CalendarService } from '../services/CalendarService';
import { DateUtils } from '../util/DateUtils';
import Config from '../config';

export class LineWebhookHandler {
  private line = new LineService();
  private calendar = new CalendarService();
  private key = {
    date: "日付(例.9/13)",
    time: "時間(例.0900-1900)",
    practiceName: "練習名(例.和光練)",
    location: "場所",
    targetClasses: "対象級(例.ABC/G以上)",
    deadline: "〆切(例.8/20)",
  }

  public handle(text: string, to: string) {
    if (text === '外部練追加') {
      this.line.pushText(
        to,
        '★外部練追加フォーマット★\n' +
        this.key.date + `：` + '\n' +
        this.key.time + `：` + '\n' +
        this.key.practiceName + `：` + '\n' +
        this.key.location + `：` + '\n' +
        this.key.targetClasses + `：` + '\n' +
        this.key.deadline + `：` + '\n' +
        '↑埋めて返信してください↑'
      );
      return;
    }

    if (text.trim().includes('外部練追加フォーマット')) {
      this.line.pushText(to, '外部練追加作業を行います。少々お待ちください。');

      const parsed = this.parseExternalPractice(text);
      if (!parsed) {
        this.line.pushText(to, 'フォーマットが正しくありません。再度ご確認ください。');
        return;
      }

      try {
        this.calendar.createCalenderEvent({
          start: parsed.start,
          location: parsed.location,
          summary: `外部${parsed.practiceName}${parsed.timeRange} ${parsed.targetClasses}:${DateUtils.formatMD(parsed.deadline)}〆(参加ポチ)`,
          description: `〆切：${parsed.deadline.toLocaleDateString()}`
        }, Config.Calendar.id.externalPractice);
      } catch (e) {
        this.line.pushError((e as Error).message);
      }
      try {
        this.calendar.createCalenderEvent({
          start: parsed.deadline,
          summary: `〆${parsed.targetClasses}|外部${parsed.practiceName}${parsed.start.toLocaleDateString()}`,
          description: `グループLINE内「イベント」から参加ポチ`
        }, Config.Calendar.id.internalDeadline);
      } catch (e) {
        this.line.pushError((e as Error).message);
      }

      this.line.pushText(
        to,
        `✅ 外部練習・締切日を登録しました\n` +
        `日付：${parsed.date.toLocaleDateString()}\n` +
        `時間：${parsed.timeRange}\n` +
        `練習名：${parsed.practiceName}\n` +
        `対象級：${parsed.targetClasses}\n` +
        `〆切：${parsed.deadline.toLocaleDateString()}\n` +
        `場所:${parsed.location}`
      );
      return;
    }
  }

  private parseExternalPractice(text: string): {
    date: Date;
    start: Date;
    end: Date;
    timeRange: string;
    practiceName: string;
    targetClasses: string;
    location: string;
    deadline: Date;
  } | null {
    // 行ごとに key：value を抽出
    const lines = text.split('\n')
      .map(l => l.trim())
      .filter(l => l.includes('：') && !l.startsWith('★'));
    const data: Record<string, string> = {};
    for (const line of lines) {
      const [key, ...rest] = line.split('：');
      data[key] = rest.join('：').trim();
    }
    try {
      const date = DateUtils.parseMD(data[this.key.date]);
      const start = date;
      const end = date;
      const deadline = DateUtils.parseMD(data[this.key.deadline]);
      return {
        date,
        start,
        end,
        timeRange: data[this.key.time],
        practiceName: data[this.key.practiceName],
        targetClasses: data[this.key.targetClasses],
        location: data[this.key.location],
        deadline
      };
    } catch {
      return null;
    }
  }
}
