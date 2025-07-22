import {
  ATTENDANCE_ADDRESS,
  CALENDAR_URL,
  CalendarIds,
  CHOUSEISAN_URLS,
  DRIVE_URL,
  MANAGERS_PORTAL_URL,
  PRACTICE_LOCATIONS
} from '../config';

import { CalendarService, EventType } from '../services/CalendarService';
import { CardShufffleService } from '../services/CardShuffle';
import { ChouseisanService } from '../services/ChouseisanService';
import { LineService } from '../services/LineService';
import { WbgtService } from '../services/WbgtService';
import { ClubPracticeEvent, ExternalPracticeEvent, KarutaClass, MatchEvent } from '../types/type';
import { DateUtils, WEEK_DAYS } from '../util/DateUtils';
import { KARUTA_CLASS_COLOR } from '../util/StringUtils';

export class Announcer {
  private weekdays = 7;
  private today = DateUtils.startOfDay();
  private tomorrow = DateUtils.addDays(this.today, 1);
  private oneWeekLater = DateUtils.addDays(this.today, this.weekdays);
  private twoWeekLater = DateUtils.addDays(this.today, 2 * this.weekdays);
  private oneWeekAgo = DateUtils.addDays(this.today, -this.weekdays);

  private kaishimeMessage =
    [
      '[大会]',
      '各大会情報については、級別のLINEノート(画面右上≡)を参照してください。',
      '⚠️申込入力URL(調整さん)では、⭕️か❌を期限内にご入力ください。',
      '空欄や△は検討中と判断します。',
      '',
      '[外部練]',
      '申込は、LINEイベントから(会の練習参加と同様)です。',
      `_________`,
    ].join('\n');

  constructor(
    private readonly line: LineService = new LineService(),
    private readonly calendar: CalendarService = new CalendarService(),
    private readonly chouseisan: ChouseisanService = new ChouseisanService(),
  ) { }

  private buildDeadlineSummaryByClass(start: Date, end: Date): string | null {
    const internalDeadlineEvents = this.calendar.get(EventType.InternalDeadline, start, end);
    if (internalDeadlineEvents.length === 0) return null;
    const groupedEvents = CalendarService.groupByClass(internalDeadlineEvents);

    const attendanceSummaries = this.chouseisan.getSummary(start, end);

    const sections: string[] = [];

    for (const [kClass, summaryText] of Object.entries(attendanceSummaries) as [KarutaClass, string][]) {
      const events = groupedEvents[kClass] || [];

      const externalPracticeText = events
        .filter(ev => ev.isExternalPractice)
        .map(ev => `[外部練]${ev.title}`)
        .join('\n');

      const fullText = [summaryText, externalPracticeText].filter(Boolean).join('\n');
      if (!fullText) continue;

      const header = `${KARUTA_CLASS_COLOR[kClass]}${kClass}級｜${CHOUSEISAN_URLS[kClass]}`;

      sections.push(`\n${header}\n\n${fullText}`);
    }

    return sections.length > 0 ? sections.join('') : null;
  }

  // ==================================================================================
  // 受付〆アナウンス（当日 21 時）
  // ==================================================================================
  public deadlineToday(to: string): void {
    const message = this.buildDeadlineSummaryByClass(this.today, this.tomorrow);
    if (!message) return;

    const base = [
      '❗️本日21時に締切❗️',
      '',
      '次の大会・外部練は、本日21時に受付を締め切ります。',
      '',
      this.kaishimeMessage,
      message
    ].join('\n');

    this.line.pushText(to, base);
  }

  // ==================================================================================
  // 受付〆アナウンス（来週分まとめ）
  // ==================================================================================
  public deadlineNextWeek(to: string): void {
    const message = this.buildDeadlineSummaryByClass(this.today, this.oneWeekLater);
    if (!message) return;

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

    this.line.pushText(to, base);
  }

  // ==================================================================================
  // 調整さんまとめのみ
  // ==================================================================================
  public chouseisanWeekly(to: string): void {
    const lastWeek = this.buildDeadlineSummaryByClass(this.oneWeekAgo, this.today);
    const thisWeek = this.buildDeadlineSummaryByClass(this.today, this.oneWeekLater);

    if (!lastWeek && !thisWeek) return;
    const message = `先週分\n\n${lastWeek}\n\n今週分\n\n${thisWeek}`;
    this.line.pushText(to, message);
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

    this.line.pushText(to, header + schedule, substitution);
  }

  private formatClubPracticeSummary(
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
        const target = Array.isArray(targetClasses) ? targetClasses.join("") : targetClasses;

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
      .map(shortName => {
        const { buildingName, mapUrl } = PRACTICE_LOCATIONS[shortName];
        return `${buildingName}\n${mapUrl}`;
      }).join("\n");

    return { clubPracticesString, practiceLocationsString };
  }

  private formatExternalPracticeSummary(
    infos: ExternalPracticeEvent[]
  ): string {
    return infos
      .map(({ date, timeRange, title, targetClasses, location }) => {
        const month = date.getMonth() + 1;
        const day = date.getDate();
        const weekday = WEEK_DAYS[date.getDay()];
        const target = Array.isArray(targetClasses) ? targetClasses.join("") : targetClasses;

        return [
          `${month}/${day}（${weekday}） ${timeRange}`,
          `${title}`,
          `対象：${target}`,
          `場所：${location}`,
        ].join("\n");
      }).join("\n");
  }

  private formatMatchSummary(
    infos: MatchEvent[]
  ): string {
    return infos
      .map(({ date, title, targetClasses, location }) => {
        const month = date.getMonth() + 1;
        const day = date.getDate();
        const weekday = WEEK_DAYS[date.getDay()];
        const target = Array.isArray(targetClasses) ? targetClasses.join("") : targetClasses;

        return `${month}/${day}（${weekday}）${title}${target}`;
      }).join("\n");
  }

  // ==================================================================================
  // 木曜定期便
  // ==================================================================================
  public weekly(to: string): void {
    const clubPractices = this.calendar.get(EventType.ClubPractice, this.today, this.oneWeekLater);
    const { clubPracticesString, practiceLocationsString }
      = this.formatClubPracticeSummary(clubPractices);

    const externalPractices = this.calendar.get(EventType.ExternalPractice, this.today, this.oneWeekLater)
    let externalPracticesString = '';
    if (externalPractices.length > 0) {
      externalPracticesString = [
        '__________',
        '',
        '🟧外部練(要事前申込)🟧',
        this.formatExternalPracticeSummary(externalPractices),
      ].join('\n');
    }

    const matches = this.calendar.get(EventType.Match, this.today, this.twoWeekLater)
    const matchesString = this.formatMatchSummary(matches);

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
      externalPracticesString,
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
      `A級|`,
      ` ${CHOUSEISAN_URLS[`A`]}`,
      `B級|`,
      ` ${CHOUSEISAN_URLS[`B`]}`,
      `C級|`,
      ` ${CHOUSEISAN_URLS[`C`]}`,
      `D級|`,
      ` ${CHOUSEISAN_URLS[`D`]}`,
      `E級|`,
      ` ${CHOUSEISAN_URLS[`E`]}`,
      `F級|`,
      ` ${CHOUSEISAN_URLS[`F`]}`,
      `G級|`,
      ` ${CHOUSEISAN_URLS[`G`]}`,
    ];

    this.line.pushText(to, lines.join('\n'));
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
