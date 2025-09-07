import Config from '../config/config';
import { ClubPracticeEvent, KarutaClass, Registration, SubstitutionMap } from '../types/type';
import { CalendarService, EventType } from '../services/CalendarService';
import { CardShufffleService } from '../services/CardShuffle';
import { ChouseisanService } from '../services/ChouseisanService';
import { LineService } from '../services/LineService';
import { DateUtils } from '../util/DateUtils';
import { KARUTA_CLASS_COLOR } from '../util/StringUtils';
import { Message } from '../message/Message';

export class Notify {
  private weekdays = 7;
  private today = DateUtils.startOfDay();
  private tomorrow = DateUtils.addDays(this.today, 1);
  private oneWeekLater = DateUtils.addDays(this.today, this.weekdays);
  private oneWeekAgo = DateUtils.addDays(this.today, -this.weekdays);

  constructor(
    private readonly line: LineService = new LineService(),
    private readonly calendar: CalendarService = new CalendarService(),
    private readonly chouseisan: ChouseisanService = new ChouseisanService()
  ) {}

  // ==================================================================================
  // 受付〆アナウンス（当日 21 時）
  // ==================================================================================
  public deadlineToday(lineTo: string, mentionee: string): void {
    const from = this.today;
    const to = this.tomorrow;
    const internalDeadlineEvents = this.calendar.get(EventType.InternalDeadline, from, to);
    if (internalDeadlineEvents.length === 0) return;

    const attendanceSummaries = this.chouseisan.getSummary(from, to);
    const message = Message.deadlineMatch(attendanceSummaries, {
      header: `{receiver}さん\n本日〆切の大会があります。未回答者に声掛けをお願いします。\n\n`,
      showAttending: false,
    });
    if (!message) return;

    const substitution = {
      receiver: {
        type: 'mention',
        mentionee: { type: 'user', userId: mentionee },
      },
    } as SubstitutionMap;
    this.line.pushText(lineTo, message, substitution);
  }

  // ==================================================================================
  // 調整さんまとめのみ
  // ==================================================================================
  public chouseisanWeekly(to: string): void {
    const summaries = this.chouseisan.getSummary(this.oneWeekAgo, this.oneWeekLater);

    let lastWeek = '';
    let thisWeek = '';
    for (const [kClass, registrations] of Object.entries(summaries) as [
      KarutaClass,
      Registration[]
    ][]) {
      lastWeek += `${KARUTA_CLASS_COLOR[kClass]}${kClass}級\n`;
      thisWeek += `${KARUTA_CLASS_COLOR[kClass]}${kClass}級\n`;
      if (registrations.length > 0) {
        registrations.forEach((ev) => {
          let body = ``;
          body += `🔹${DateUtils.formatMD(ev.eventDate)}${ev.title}（${DateUtils.formatMD(
            ev.deadline
          )}〆切）\n`;
          body += `⭕参加:\n`;
          if (ev.participants.attending.length > 0) {
            body += ev.participants.attending.join('\n') + '\n';
          }
          if (ev.participants.undecided.length > 0) {
            body += `❓未回答:\n`;
            body += ev.participants.undecided.join('\n') + '\n';
          }
          if (this.oneWeekAgo <= ev.deadline && ev.deadline < this.today) {
            lastWeek += body;
          } else if (this.today <= ev.deadline && ev.deadline <= this.oneWeekLater) {
            thisWeek += body;
          }
        });
      }
    }

    this.line.pushText(to, `先週分\n\n${lastWeek}`);
    this.line.pushText(to, `今週分\n\n${thisWeek}`);
  }

  // ==================================================================================
  // 本〆アナウンス（当日）
  // ==================================================================================
  public finalIsToday(to: string, mentionee: string): void {
    const calendar = CalendarApp.getCalendarById(Config.Calendar.id.actualDeadline);
    const events = calendar.getEvents(this.today, this.tomorrow);
    if (events.length === 0) return;

    const header = `{maintainer}さん\n大会本〆リマインダーです。以下の大会の申込を確認してください。\n\n`;
    const schedule = events.map((ev) => ev.getTitle()).join('\n');
    const substitution = {
      maintainer: {
        type: 'mention',
        mentionee: { type: 'user', userId: mentionee },
      },
    } as SubstitutionMap;

    this.line.pushText(to, header + schedule, substitution);
  }

  // ==================================================================================
  // 今週来週の練習と運営担当
  // 毎週月曜日 送信
  // ==================================================================================
  public weeklyPractice(to: string): void {
    const twoWeekLater = DateUtils.addDays(this.today, 2 * this.weekdays + 1);
    const practices: ClubPracticeEvent[] = this.calendar.get(
      EventType.ClubPractice,
      this.tomorrow,
      twoWeekLater
    );
    if (!practices.length) return;

    const practiceMessage = Message.clubPractice(practices, {
      header: '🔵今週来週の担当🔵\n全体LINEの参加ポチも忘れずにお願いします！',
      showTargetClasses: false,
    });
    const message = [practiceMessage, '', '=運営ポータル=', Config.MANAGERS_PORTAL_URL].join('\n');

    this.line.pushText(to, message);
  }

  // ==================================================================================
  // 今日の練習・札分け
  // ==================================================================================
  public todayPractice(to: string): void {
    const practices: ClubPracticeEvent[] = this.calendar.get(
      EventType.ClubPractice,
      this.today,
      this.tomorrow
    );
    if (!practices.length) return;
    const practiceMsg = Message.clubPractice(practices, {
      header: '🔵今日の練習🔵',
      showTargetClasses: false,
      showPersonInCharge: true,
    });

    const { clubCardsStr, myCardsStr } = new CardShufffleService().do();

    const message = [
      practiceMsg,
      '',
      '=会札=',
      clubCardsStr,
      '',
      '=マイ札=',
      myCardsStr,
      '',
      '=アルファベットの札分け=',
      '札の長さでグループ分けされています。',
      '  AB : 1・2枚札(むすめふさほせ・うつしもゆ・あいあしあけ)、',
      '  CDE : 2字、',
      '  FGH : 3字、',
      '  IJ : 4・5・6字の札。',
      '',
      '=記号の札分け=',
      '音でグループ分けされています。',
      '  ◯ あいう、さしすせ、な（34枚）',
      '  △ かきこ、たちつ、みむめも（33枚）',
      '  ◆ お、はひふほ、やゆよ、わ（33枚）',
      '記号で札分けし、10枚ずつ自陣に持ち試合をすると20枚ミニゲームができます。',
      '同じ記号内の33枚(34枚)を全て読むと空札数もちょうどよいです。',
      '',
      '=運営ポータル=',
      Config.MANAGERS_PORTAL_URL,
    ].join('\n');

    this.line.pushText(to, message);
  }

  public sendDebugBanner(): void {
    if (!Config.DEBUG_MODE) return;
    this.line.pushError('[line-bot-tools]\nATTENTION: DEBUG MODE IS ON.');
  }
}
