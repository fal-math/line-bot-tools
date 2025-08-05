import Config from '../config';
import { ClassMap, KarutaClass, ParticipantStatus, Registration } from '../types/type';
import { DateUtils } from '../util/DateUtils';

export class ChouseisanService {
  private csvMap: Record<KarutaClass, string>;

  constructor(csvMap: Record<KarutaClass, string> = Config.Chouseisan.csvs) {
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
  public getSummary(
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

  public backupChouseisanCsv(): void {
    const csvUrlMap = {} as ClassMap<string>;
    (Object.keys(this.csvMap) as KarutaClass[]).forEach(kClass => {
      const rawCsv = this.fetchCsv(this.csvMap[kClass]);
      csvUrlMap[kClass] = rawCsv;
    });

    const spreadsheetId = Config.Chouseisan.spreadsheetId;
    const ss = SpreadsheetApp.openById(spreadsheetId);

    (Object.keys(csvUrlMap) as KarutaClass[]).forEach((kClass) => {
      const rawCsv = csvUrlMap[kClass];
      const sheetName = `${DateUtils.formatYMD(new Date())}${kClass}`;

      let sheet = ss.getSheetByName(sheetName);
      if (!sheet) {
        sheet = ss.insertSheet(sheetName);
      } else {
        sheet.clearContents();
      }

      const rows = rawCsv
        .trim()
        .split(/\r?\n/)
        .map(line => line.split(','));

      if (rows.length === 0) return;

      sheet
        .getRange(1, 1, rows.length, rows[0].length)
        .setValues(rows);
    });
  }
}
