import {
  CalendarIds,
  DEBUG_MODE,
  MANAGERS_PORTAL_URL,
} from '../config';
import { ClubPracticeEvent, KarutaClass, Registration } from '../types/type';
import { CalendarService, EventType } from '../services/CalendarService';
import { CardShufffleService } from '../services/CardShuffle';
import { ChouseisanService } from '../services/ChouseisanService';
import { LineService } from '../services/LineService';
import { WbgtService } from '../services/WbgtService';
import { DateUtils } from '../util/DateUtils';
import { KARUTA_CLASS_COLOR } from '../util/StringUtils';

export class Notify {
  private weekdays = 7;
  private today = DateUtils.startOfDay();
  private tomorrow = DateUtils.addDays(this.today, 1);
  private oneWeekLater = DateUtils.addDays(this.today, this.weekdays);
  private oneWeekAgo = DateUtils.addDays(this.today, -this.weekdays);

  constructor(
    private readonly line: LineService = new LineService(),
    private readonly calendar: CalendarService = new CalendarService(),
    private readonly chouseisan: ChouseisanService = new ChouseisanService(),
  ) { }

  // ==================================================================================
  // 受付〆アナウンス（当日 21 時）
  // ==================================================================================
  public deadlineToday(to: string, mentionee: string): void {
    const start = this.today;
    const end = this.tomorrow;
    const internalDeadlineEvents = this.calendar.get(EventType.InternalDeadline, start, end);
    if (internalDeadlineEvents.length === 0) return;

    const attendanceSummaries = this.chouseisan.getSummary(start, end);
    let message: string = "";
    for (const [kClass, registrations] of Object.entries(attendanceSummaries) as [KarutaClass, Registration[]][]) {
      if (registrations.length > 0) {
        message += `${KARUTA_CLASS_COLOR[kClass]}${kClass}級\n`;
        registrations.forEach(ev => {
          message += `🔹${DateUtils.formatMD(ev.eventDate)}${ev.title}（${DateUtils.formatMD(ev.deadline)}〆切）\n`;
          if (ev.participants.undecided.length > 0) {
            message += `❓未回答:\n`;
            message += ev.participants.undecided.join('\n') + '\n';
          }
        });
        message += `\n`;
      }
    }
    if (message == "") return;

    const header = `{receiver}さん\n本日〆切の大会があります。未回答者に声掛けをお願いします。\n\n`;
    const substitution = {
      receiver: {
        type: 'mention',
        mentionee: { type: 'user', userId: mentionee },
      },
    } as const;
    this.line.pushText(to, header + message, substitution);
  }

  // ==================================================================================
  // 調整さんまとめのみ
  // ==================================================================================
  public chouseisanWeekly(to: string): void {
    const summaries = this.chouseisan.getSummary(this.oneWeekAgo, this.oneWeekLater);

    let lastWeek = "";
    let thisWeek = "";
    for (const [kClass, registrations] of Object.entries(summaries) as [KarutaClass, Registration[]][]) {
      lastWeek += `${KARUTA_CLASS_COLOR[kClass]}${kClass}級\n`;
      thisWeek += `${KARUTA_CLASS_COLOR[kClass]}${kClass}級\n`;
      if (registrations.length > 0) {
        registrations.forEach(ev => {
          let body = ``;
          body += `🔹${DateUtils.formatMD(ev.eventDate)}${ev.title}（${DateUtils.formatMD(ev.deadline)}〆切）\n`;
          body += `⭕参加:\n`;
          if (ev.participants.attending.length > 0) {
            body += ev.participants.attending.join('\n') + '\n';
          }
          if (ev.participants.undecided.length > 0) {
            body += `❓未回答:\n`;
            body += ev.participants.undecided.join('\n') + '\n';
          }
          if (this.oneWeekAgo <= ev.deadline && ev.deadline < this.today) { lastWeek += body }
          else if (this.today <= ev.deadline && ev.deadline <= this.oneWeekLater) { thisWeek += body }
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
    const calendar = CalendarApp.getCalendarById(CalendarIds.actualDeadline);
    const events = calendar.getEvents(this.today, this.tomorrow);
    if (events.length === 0) return;

    const header = `{maintainer}さん\n大会本〆リマインダーです。以下の大会の申込を確認してください。\n\n`;
    const schedule = events.map(ev => ev.getTitle()).join('\n');
    const substitution = {
      maintainer: {
        type: 'mention',
        mentionee: { type: 'user', userId: mentionee },
      },
    } as const;

    this.line.pushText(to, header + schedule, substitution);
  }

  // ==================================================================================
  // 今日の練習・札分け
  // ==================================================================================
  public todayPractice(to: string): void {
    const practices: ClubPracticeEvent[]
      = this.calendar.get(EventType.ClubPractice, this.today, this.tomorrow);
    if (!practices.length) return;

    const practiceMsg = practices
      .map(({ location, timeRange, targetClasses }) => {
        return `・${location.shortenBuildingName}(${location.clubName})\n　${timeRange} ${targetClasses}`;
      })
      .join("\n");

    const { clubCardsStr, myCardsStr } = new CardShufffleService().do();

    const { message: wbgtAlert } = new WbgtService().getMessage();

    const message = [
      "■今日の練習■",
      practiceMsg,
      "",
      "=会札=",
      clubCardsStr,
      "",
      "=マイ札=",
      myCardsStr,
      "",
      "=運営ポータル=",
      MANAGERS_PORTAL_URL,
      "",
      wbgtAlert,
    ].join("\n");

    this.line.pushText(to, message);
  }

  public sendDebugBanner():void{
    if(!DEBUG_MODE) return;
    this.line.pushError("[line-bot-tooks]\nATTENTION: DEBUG MODE IS ON.")
  }
}
