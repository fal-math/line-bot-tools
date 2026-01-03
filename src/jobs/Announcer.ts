import Config from '../config/config';
import { Message } from '../message/Message';
import { MessageTemplates } from '../message/MessageTemplates';
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
   * @param deadlineLabel 見出し（例：「今週」「来週」など）
   * @param includeExPractice 外部練を含めるか（default: true）
   * @param includeMatch 大会を含めるか（default: true）
   */
  public deadlineFromTo(
    lineTo: string,
    from: Date,
    to: Date,
    deadlineLabel: string,
    includeExPractice: boolean = true,
    includeMatch: boolean = true
  ): void {
    const parts: string[] = [];

    // --- 外部練 ------------------------------------------------------------
    if (includeExPractice) {
      const internalDeadlineEvents = this.calendar.get(EventType.InternalDeadline, from, to);
      const { hasExPractice, message: exPracticeMessage } = MessageTemplates.deadlineExPractice(
        internalDeadlineEvents,
        {
          header: [
            `🔔${deadlineLabel}の外部練〆切🔔`,
            '外部練申込は、LINEイベントから(会の練習参加と同様)です。',
          ].join('\n'),
        }
      );
      if (hasExPractice && exPracticeMessage) parts.push(exPracticeMessage);
    }

    // --- 大会 --------------------------------------------------------------
    if (includeMatch) {
      const { summary } = this.chouseisan.getSummary(from, to);
      const { hasMatch, message: matchMessage } = MessageTemplates.buildClasswiseDeadlineMessage(summary, {
        header: [
          `🔔${deadlineLabel}の大会〆切🔔`,
          '各大会情報については、級別のLINEノート(画面右上≡)を参照してください。',
          '申込入力URL(調整さん)では、⭕️か❌を期限内にご入力ください。',
          '',
          '准会員向け：',
          '「会から申込」を希望する場合は、髙田まで別途個別に連絡ください。'
        ]
        .join('\n'),
      });
      if (hasMatch && matchMessage) parts.push(matchMessage);
    }

    // --- どちらも空なら送信しない ---------------------------------------
    if (parts.length === 0) return;

    this.line.pushText(lineTo, parts.join('\n\n\n'));
  }

  /**
   * 受付〆アナウンス（当日 21 時）: 大会情報のみ
   * @param to メッセージの送信先(LINE)
   */
  public deadlineToday(to: string): void {
    this.deadlineFromTo(to, this.today, this.tomorrow, '本日', false, true);
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
    const uniqueLocs = Array.from(new Set(infos.map((info) => info.location.shortName)));
    const practiceLocationsString = uniqueLocs
      .map((shortName) => {
        const { name, mapUrl } = Config.Venues[shortName];
        return `・${name}\n${mapUrl}`;
      })
      .join('\n');
    return practiceLocationsString;
  }

  /**
   * 木曜定期便アナウンス
   * @param to メッセージの送信先(LINE)
   */
  public weekly(to: string): void {
    // 会練を取得
    const clubPractices = this.calendar.get(EventType.ClubPractice, this.today, this.oneWeekLater);
    const practiceLocationsString = this.getPracticeLocations(clubPractices);
    const clubPracticeMessage = MessageTemplates.clubPractice(clubPractices, {
      header: '🔵今週の練習🔵',
      showPersonInCharge: false,
    });

    // 外部練情報を取得
    const externalPractices = this.calendar.get(
      EventType.ExternalPractice,
      this.today,
      this.oneWeekLater
    );
    const externalPracticeMessage = MessageTemplates.exPractice(externalPractices, {
      header: '🟠今週の外部練🟠',
      showDescription: true,
    });

    // 大会情報を取得
    const matches = this.calendar.get(EventType.Match, this.today, this.twoWeekLater);
    const matchMessage = MessageTemplates.match(matches, {
      header: '🟢今週・来週の出場大会🟢',
    });

    const message = new Message();

    if (this.testMode) {
      message.add('[テスト投稿]').blank();
    }
    message.add('《ちはやふる富士見 木曜定期便》').blank();
    message.add(clubPracticeMessage).blank();
    message.add('📍会練会場案内').add(practiceLocationsString).blank();

    message.add('📒練習持ち物');
    message.bullet('マイ札');
    message.bullet('かるたノート');
    message.bullet('上達カード(基本級～F級)');
    message.bullet('スタートアップガイド');
    message.blank();
    message.add('📧会練遅刻欠席連絡');
    message.add('当日・事前の遅刻欠席連絡メールアドレス');
    message.add(Config.Mail.attendance);
    message.add('⚠️下記を必ず記載⚠️');
    message.add('題名：名前と級');
    message.add('本文：参加する練習会場、用件(遅刻の場合、到着予定時刻)');
    message.add('※LINEで参加を押すと「初めから参加」の意味になります');
    message.add(SEPARATOR);

    if (externalPracticeMessage.length > 0) message.add(externalPracticeMessage).add(SEPARATOR);
    if (matchMessage.length > 0) message.add(matchMessage).add(SEPARATOR);
    message.add('⚫活動カレンダー⚫').add(Config.Calendar.url);
    this.line.pushText(to, message.toString());
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
