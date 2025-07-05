import {
  ATTENDANCE_ADDRESS,
  CALENDAR_URL,
  CHOUSEISAN_URLS,
  DRIVE_URL,
  PRACTICE_LOCATIONS,
  CalendarIds
} from '../config';

import { BaseEvent, KarutaClass, MatchEvent, ExternalPracticeEvent, InternalDeadlineEvent, ClubPracticeEvent as ClubPracticeEvent } from '../type';
import { CalendarService, EventType } from '../services/CalendarService';
import { LineService } from '../services/LineService';
import { DateUtils, WEEK_DAYS } from '../util/DateUtils';
import { StringUtils } from '../util/StringUtils';
import { CardShufffle } from '../services/CardShuffle';
import { WbgtAlert } from '../services/WbgtService';

export class Announcer {
  private today = DateUtils.startOfDay();
  private tomorrow = DateUtils.addDays(this.today, 1);
  private oneWeekLater = DateUtils.addDays(this.today, 7);
  private twoWeekLater = DateUtils.addDays(this.today, 14);
  private kaishimeMessage =
    [
      '[大会]',
      '各大会情報については、級別のLINEノート(画面右上≡)を参照してください。',
      '⚠️申込入力URL(調整さん)では、⭕️か❌を期限内にご入力ください。',
      '空欄や△は検討中と判断します。',
      '',
      '[外部練]',
      '申込は、LINEイベントから(会の練習参加と同様)です。',
      `___`,
      ``,
    ].join('\n');

  constructor(
    private readonly lineService: LineService = new LineService(),
    private readonly calendarService: CalendarService = new CalendarService(),
  ) { }

  private groupByClass<T extends BaseEvent>(
    events: T[]
  ): Record<KarutaClass, T[]> {
    const result = (Object.values(KarutaClass) as KarutaClass[]).reduce(
      (acc, klass) => {
        acc[klass] = [];
        return acc;
      },
      {} as Record<KarutaClass, T[]>
    );

    for (const ev of events) {
      const classes: KarutaClass[] = Array.isArray(ev.targetClasses)
        ? ev.targetClasses
        : StringUtils.formatKarutaClass(ev.targetClasses);

      for (const kc of classes) {
        result[kc].push(ev);
      }
    }

    return result;
  }

  private formatDeadlines(
    events: InternalDeadlineEvent[]
  ): string {
    const grouped = this.groupByClass(events);

    return Object.entries(grouped)
      .filter(([, evs]) => evs.length > 0)
      .map(([kc, evs]) => {
        const lines = evs.map(ev => {
          const index = ev.isExternalPractice ? "[外部練]" : "[大　会]";
          return `${index}${ev.title}`;
        });
        return `${kc}級| ${CHOUSEISAN_URLS[kc as KarutaClass]}\n${lines.join('\n')}`;
      })
      .join('\n\n');
  }

  // ==================================================================================
  // 受付〆アナウンス（当日 21 時）
  // ==================================================================================
  public deadlineToday(to: string): void {
    const clubDeadlineEvents = this.calendarService
      .getEvents(EventType.InternalDeadline, this.today, this.tomorrow)
    if (clubDeadlineEvents.length === 0) return;
    const message = this.formatDeadlines(clubDeadlineEvents);

    const base = [
      '❗️本日21時に締切❗️',
      '',
      '次の大会・外部練は、本日21時に受付を締め切ります。',
      '',
      this.kaishimeMessage,
      message
    ].join('\n');

    this.lineService.pushText(to, base);
  }

  // ==================================================================================
  // 受付〆アナウンス（来週分まとめ）
  // ==================================================================================
  public deadlineNextWeek(to: string): void {
    const internalDeadlineEvents = this.calendarService
      .getEvents(EventType.InternalDeadline, this.today, this.oneWeekLater)
    if (internalDeadlineEvents.length === 0) return;
    const message = this.formatDeadlines(internalDeadlineEvents);

    const base = [
      '❗️受付締め切りまで間近❗️',
      '',
      '大会・外部練のリマインドです。',
      '来週中に受付締切です。',
      'ぜひ積極的に参加をご検討ください◎',
      '',
      this.kaishimeMessage,
      message
    ].join('\n');

    this.lineService.pushText(to, base);
  }

  // ==================================================================================
  // 本〆アナウンス（当日）
  // ==================================================================================
  public finalIsToday(to: string, mentionee: string): void {
    const calendar = CalendarApp.getCalendarById(CalendarIds.actualDeadline);
    const events = calendar.getEvents(this.today, this.tomorrow);
    if (events.length === 0) return;

    const formatted = Utilities.formatDate(this.today, 'JST', 'MM/dd');
    const header = `${formatted} {maintainer}さん\n大会本〆リマインダーです。以下の大会の申込を確認してください。\n\n`;
    const schedule = events.map(ev => ev.getTitle()).join('\n');
    const substitution = {
      maintainer: {
        type: 'mention',
        mentionee: { type: 'user', userId: mentionee },
      },
    } as const;

    this.lineService.pushText(to, header + schedule, substitution);
  }

  private clubPracticesToString(
    infos: ClubPracticeEvent[]
  ): {
    clubPracticesString: string;
    practiceLocationsString: string;
  } {
    const clubPracticesString = infos
      .map(({ date, timeRange, location, practiceType, targetClasses }) => {
        const month = date.getMonth() + 1;
        const day = date.getDate();
        const weekday = WEEK_DAYS[date.getDay()];
        const target = Array.isArray(targetClasses)
          ? targetClasses.join("")
          : targetClasses;

        return [
          `・${month}/${day}（${weekday}） ${timeRange}`,
          `　${location.shortenBuildingName}${practiceType}`,
          `　対象：${target}`,
        ].join("\n");
      }).join("\n");

    const uniqueLocs = Array.from(
      new Set(infos.map(info => info.location.shortenBuildingName))
    );
    const practiceLocationsString = uniqueLocs
      .map(shortenBuildingName => {
        const { buildingName, mapUrl: map_url } = PRACTICE_LOCATIONS[shortenBuildingName];
        return [buildingName, map_url].join("\n");
      })
      .join("\n");

    return { clubPracticesString, practiceLocationsString };
  }


  private outerPracticesToString(
    infos: ExternalPracticeEvent[]
  ): string {
    return infos
      .map(({ date, timeRange, title, targetClasses, location }) => {
        const target = Array.isArray(targetClasses)
          ? targetClasses.join("")
          : targetClasses;

        const month = date.getMonth() + 1;
        const day = date.getDate();
        const weekday = WEEK_DAYS[date.getDay()];

        return [
          `${month}/${day}（${weekday}） ${timeRange} ${title}`,
          `対象：${target}`,
          `場所：${location}`,
        ].join("\n");
      }).join("\n");
  }

  private matchesToString(infos: (MatchEvent)[]): string {
    return infos
      .map(({ date, title, targetClasses, location }) => {
        const target = Array.isArray(targetClasses)
          ? targetClasses.join("")
          : targetClasses;

        const month = date.getMonth() + 1;
        const day = date.getDate();
        const weekday = WEEK_DAYS[date.getDay()];

        return `${month}/${day}（${weekday}）${title}${target}`
      }).join("\n");
  }

  // ==================================================================================
  // 木曜定期便
  // ==================================================================================
  public weekly(to: string): void {
    const clubPractices: ClubPracticeEvent[]
      = this.calendarService.getEvents(EventType.ClubPractice, this.today, this.oneWeekLater);
    const { clubPracticesString, practiceLocationsString }
      = this.clubPracticesToString(clubPractices);

    const outerPractices = this.calendarService.getEvents(EventType.ExternalPractice, this.today, this.oneWeekLater)
    const outerPracticesString = this.outerPracticesToString(outerPractices);

    const matches = this.calendarService.getEvents(EventType.Match, this.today, this.twoWeekLater)
    const matchesString = this.matchesToString(matches);

    const lines = [
      '《ちはやふる富士見 木曜定期便》',
      '',
      '🟦今週末の練習🟦',
      clubPracticesString,
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
      ATTENDANCE_ADDRESS,
      '⚠️下記を必ず記載⚠️',
      '題名：名前と級',
      '本文：参加する練習会場、用件(遅刻の場合、到着予定時刻)',
      '※LINEで参加を押すと「初めから参加」の意味になります',
      '',
      '__________',
      '',
      '🟧外部練(要事前申込)🟧',
      outerPracticesString,
      '__________',
      '',
      '🟩今週来週の出場大会🟩',
      matchesString,
      '__________',
      '',
      '◯活動カレンダー',
      CALENDAR_URL,
      '◯周知済み大会情報',
      DRIVE_URL,
      '◯大会申込入力URL(調整さん)',
      `A級| ${CHOUSEISAN_URLS[`A`]}\n`,
      `B級| ${CHOUSEISAN_URLS[`B`]}\n`,
      `C級| ${CHOUSEISAN_URLS[`C`]}\n`,
      `D級| ${CHOUSEISAN_URLS[`D`]}\n`,
      `E級| ${CHOUSEISAN_URLS[`E`]}\n`,
      `F級| ${CHOUSEISAN_URLS[`F`]}\n`,
      `G級| ${CHOUSEISAN_URLS[`G`]}`,
    ];

    this.lineService.pushText(to, lines.join('\n'));
  }

  // ==================================================================================
  // 今日の練習・札分け
  // ==================================================================================
  public todayPractice(to: string): void {
    const practices: ClubPracticeEvent[]
      = this.calendarService.getEvents(EventType.ClubPractice, this.today, this.tomorrow);
    if (!practices.length) return;

    const practiceMsg = practices
      .map(({ location, timeRange, targetClasses }) => {
        return `・${location.shortenBuildingName}(${location.clubName})\n　${timeRange} ${targetClasses}`;
      })
      .join("\n");

    const { clubCardsStr, myCardsStr } = new CardShufffle().do();

    const { message: wbgtAlert } = new WbgtAlert().getMessage();

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
      "=札分けの一覧表=",
      "https://onl.sc/nUb3Qd8",
      wbgtAlert,
    ].join("\n");

    this.lineService.pushText(to, message);
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
