import Config from '../config/config';
import { Message } from '../message/Message';
import { CalendarService, EventType } from '../services/CalendarService';
import { ChouseisanService } from '../services/ChouseisanService';
import { DriveService } from '../services/DriveService';
import { LineService } from '../services/LineService';
import { ClubPracticeEvent } from '../types/type';
import { DateUtils } from '../util/DateUtils';
import { SEPARATOR } from '../util/StringUtils';

export class Announcer {
  private weekdays = 7;
  private tomorrow = DateUtils.addDays(this.today, 1);
  private oneWeekLater = DateUtils.addDays(this.today, this.weekdays);
  private twoWeekLater = DateUtils.addDays(this.today, 2 * this.weekdays);

  constructor(
    private readonly today: Date = DateUtils.startOfDay(new Date()),
    private readonly testMode: boolean = false,
    private readonly line: LineService = new LineService(),
    private readonly calendar: CalendarService = new CalendarService(),
    private readonly chouseisan: ChouseisanService = new ChouseisanService(),
    private readonly drive: DriveService = new DriveService()
  ) {}

  /**
   * 〆切を取得してLINEに送信する
   * @param lineTo LINEの送信先
   * @param from 〆切を取得したい期間の開始日
   * @param to 〆切を取得したい期間の終了日
   */
  public deadlineFromTo(lineTo: string, from: Date, to: Date, deadlineLabel: string): void {
    // 外部練
    const internalDeadlineEvents = this.calendar.get(EventType.InternalDeadline, from, to);
    const { hasExPractice, message: exPracticeMessage } = Message.deadlineExPractice(
      internalDeadlineEvents,
      {
        header: [
          `🔔${deadlineLabel}の外部練〆切🔔`,
          '外部練申込は、LINEイベントから(会の練習参加と同様)です。',
        ].join('\n'),
      }
    );

    // 大会
    const { summary } = this.chouseisan.getSummary(from, to);
    const { hasMatch, message: matchMessage } = Message.deadlineMatch(summary, {
      header: [
        `🔔${deadlineLabel}の大会〆切🔔`,
        '各大会情報については、級別のLINEノート(画面右上≡)を参照してください。',
        '申込入力URL(調整さん)では、⭕️か❌を期限内にご入力ください。',
        '',
      ].join('\n'),
    });

    if (!hasExPractice && !hasMatch) return;

    const parts: string[] = [];
    if (hasExPractice && exPracticeMessage) parts.push(exPracticeMessage);
    if (hasMatch && matchMessage) parts.push(matchMessage);

    this.line.pushText(lineTo, parts.join('\n\n\n'));
  }

  /**
   * 受付〆アナウンス（当日 21 時）
   * @param to メッセージの送信先(LINE)
   */
  public deadlineToday(to: string): void {
    this.deadlineFromTo(to, this.today, this.tomorrow, '本日');
  }

  /**
   * 受付〆アナウンス（来週分まとめ）
   * @param to メッセージの送信先(LINE)
   */
  public deadlineNextWeek(to: string): void {
    this.deadlineFromTo(to, this.today, this.oneWeekLater, '近日');
  }

  /**
   * 会練の会場案内を取得する関数
   * @param infos 会練のリスト
   * @returns リストに含まれる会場案内の文字列
   */
  private getPracticeLocations(infos: ClubPracticeEvent[]): string {
    const uniqueLocs = Array.from(new Set(infos.map((info) => info.location.shortenBuildingName)));
    const practiceLocationsString = uniqueLocs
      .map((shortName) => {
        const { buildingName, mapUrl } = Config.PRACTICE_LOCATIONS[shortName];
        return `・${buildingName}\n${mapUrl}`;
      })
      .join('\n');
    return practiceLocationsString;
  }

  /**
   * 木曜定期便アナウンス
   * @param to メッセージの送信先(LINE)
   */
  public weekly(to: string): void {
    const clubPractices = this.calendar.get(EventType.ClubPractice, this.today, this.oneWeekLater);
    const practiceLocationsString = this.getPracticeLocations(clubPractices);
    const clubPracticeMessage = Message.clubPractice(clubPractices, {
      header: '🔵今週の練習🔵',
      showPersonInCharge: false,
    });

    const externalPractices = this.calendar.get(
      EventType.ExternalPractice,
      this.today,
      this.oneWeekLater
    );
    const externalPracticeMessage = Message.exPractice(externalPractices, {
      header: '🟠今週の外部練🟠',
      showDescription: true,
    });
    let externalPracticesString = '';
    if (externalPracticeMessage.length > 0) {
      externalPracticesString = [SEPARATOR, '', externalPracticeMessage].join('\n');
    }

    const matches = this.calendar.get(EventType.Match, this.today, this.twoWeekLater);
    const matchMessage = Message.match(matches, {
      header: '🟢今週・来週の出場大会🟢',
    });
    let matchString = '';
    if (matchMessage.length > 0) {
      matchString = [SEPARATOR, '', matchMessage].join('\n');
    }

    const lines = [
      '《ちはやふる富士見 木曜定期便》',
      '',
      clubPracticeMessage,
      '',
      '📍会練会場案内',
      practiceLocationsString,
      '',
      '📒練習持ち物',
      '・マイ札',
      '・かるたノート',
      '・上達カード(基本級～F級)',
      '・スタートアップガイド',
      '',
      '📧会練遅刻欠席連絡',
      'あらかじめ遅参が分かっている時、または当日の遅刻欠席する時の連絡メールアドレス',
      Config.Mail.attendance,
      '⚠️下記を必ず記載⚠️',
      '題名：名前と級',
      '本文：参加する練習会場、用件(遅刻の場合、到着予定時刻)',
      '※LINEで参加を押すと「初めから参加」の意味になります',
      externalPracticesString,
      matchString,
      SEPARATOR,
      '',
      '◯活動カレンダー',
      Config.Calendar.url,
    ];
    if (this.testMode) {
      lines.unshift('[テスト投稿]');
    }

    this.line.pushText(to, lines.join('\n'));

    const clubPracticeTypeImageId = '1nVYjeTLb57LtbV6kNd3lcCPpCtuM0tar';
    const image = this.drive.getImageUrls(clubPracticeTypeImageId);
    if (image) this.line.pushImage(to, image);
  }
}

// ==================================================================================
// カレンダー画像生成&送信
// ==================================================================================
// public sendMonthlyCalendar_(to: string): void {
//   const result = generateMonthlyCalendar_();
//   if (!result) { Logger.log("canceled"); return; }
//   const { original, preview } = result;
//   pushImage_(to, original, preview);
// }
