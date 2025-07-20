import { CHOUSEISAN_CSVS } from '../config';
import { ParticipantStatus, KarutaClass, Registration, ClassMap } from '../types/type';
import { DateUtils } from '../util/DateUtils';

export class ChouseisanService {
  private csvMap: Record<KarutaClass, string>;

  constructor(csvMap: Record<KarutaClass, string> = CHOUSEISAN_CSVS) {
    this.csvMap = csvMap;
  }

  /**
   * CSV を取得してプレーンテキストとして返す
   */
  private fetchCsv(url: string): string {
    return UrlFetchApp
      .fetch(url, { headers: { accept: 'text/plain' } })
      .getContentText('UTF-8');
  }

  /**
   * CSV 文字列を ChouseisanEvent の配列にパース
   */
  private formatData(rawCsv: string): Registration[] {
    const rows = rawCsv.trim().split(/\r?\n/).map(line => line.split(','));
    const members = this.extractMembers(rows);
    const events: Registration[] = [];

    rows.forEach(row => {
      const ev = this.parseRow(row, members);
      if (ev) events.push(ev);
    });

    return events;
  }

  /**
   * CSV のヘッダー行から参加者名リストを抽出
   */
  private extractMembers(rows: string[][]): string[] {
    const header = rows.find(r => r[0] === '日程');
    return header ? header.slice(1) : [];
  }

  /**
   * 1 行分のデータを ChouseisanEvent に変換
   */
  private parseRow(
    row: string[], members: string[]
  ): Registration | null {
    const [first, ...rest] = row;
    const regex = /^\(?(\d{1,2}\/\d{1,2})(?:[日月火水木金土](?:祝)?)?\.(.+?)\(〆(\d{1,2}\/\d{1,2})(?:[日月火水木金土](?:祝)?)?\)$/;
    const m = first.match(regex);
    if (!m) {
      Logger.log(`Invalid row format: ${first}`);
      return null;
    }

    const [, eventDateMD, title, deadlineMD] = m;
    const eventDate = DateUtils.parseMD(eventDateMD);
    const deadline = DateUtils.parseMD(deadlineMD);
    const participants: ParticipantStatus = { attending: [], notAttending: [], undecided: [] };

    members.forEach((member, i) => {
      const status = rest[i];
      if (status === '◯') participants.attending.push(member);
      else if (status === '×') participants.notAttending.push(member);
      else participants.undecided.push(member);
    });

    return { title, eventDate, deadline, participants };
  }

  /**
   * 締切範囲でフィルタ
   */
  private filterByDeadline(
    events: Registration[],
    start: Date,
    end: Date
  ): Registration[] {
    return events.filter(ev => ev.deadline >= start && ev.deadline <= end);
  }

  /**
   * 各クラスごとに締切をチェックし、Registration列を返す
   */
  public getSummaryByClass(
    start: Date,
    end: Date
  ): ClassMap<Registration[]> {
    const result = {} as ClassMap<Registration[]>;

    (Object.keys(this.csvMap) as KarutaClass[]).forEach(kClass => {
      const rawCsv = this.fetchCsv(this.csvMap[kClass]);
      const events = this.formatData(rawCsv);
      const filtered = this.filterByDeadline(events, start, end);
      result[kClass] = filtered;
    });

    return result;
  }

  /**
   * 各クラスごとに締切をチェックし、stringを返す
   */
  public getSummary(start: Date, end: Date): ClassMap<string> {
    const summaries = this.getSummaryByClass(start, end);
    const result = {} as ClassMap<string>;
    Logger.log(`summaries:${summaries}`)

    for (const [kClass, registrations] of Object.entries(summaries) as [KarutaClass, Registration[]][]) {
      if (registrations.length === 0) {
        result[kClass] = "";
      } else {
        let body = ``;
        registrations.forEach(ev => {
          body += `🔹${DateUtils.formatMD(ev.eventDate)}${ev.title}（${DateUtils.formatMD(ev.deadline)}〆切）\n`;
          body += `⭕参加:\n`;
          if (ev.participants.attending.length > 0) {
            body += ev.participants.attending.join('\n') + '\n';
          }
          if (ev.participants.undecided.length > 0) {
            body += `❓未回答:\n`;
            body += ev.participants.undecided.join('\n') + '\n';
          }
        });
        result[kClass] = body;
      }
    }
    return result;
  }
}
