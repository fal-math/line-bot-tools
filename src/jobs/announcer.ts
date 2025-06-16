import {
  ATTENDANCE_ADDRESS,
  CALENDER_URL,
  CHOUSEISAN_URLS,
  DRIVE_URL,
  GOOGLE_CALENDER_ID_HONSHIME,
  GOOGLE_CALENDER_ID_KAIRENSHU,
  GOOGLE_CALENDER_ID_KAISHIME,
  GOOGLE_CALENDER_ID_TAIKAI,
  LINE_CHANNEL_ACCESS_TOKEN,
  PRACTICE_LOCATIONS
} from '../config';

import { formatToTeamPracticeInfo_ } from '../services/calenderImage';
import { buildGroupMessages_, createGroups_, getGroupedEvents_, kaishimeMessage, } from '../services/kaishimeHelper';
import { TeamPracticeInfo } from '../type';

import { LineService } from '../services/LineService';
import { ChouseisanService } from '../services/ChouseisanService';
import { DateUtils } from '../util/DateUtils';

export class Announcer {
  // ==================================================================================
  // 受付〆アナウンス（当日 21 時）
  // ==================================================================================
  public deadlineToday(to: string): void {
    const today = DateUtils.startOfDay();
    const tomorrow = DateUtils.addDays(today, 1);
    const groups = createGroups_();
    getGroupedEvents_(today, tomorrow, groups, GOOGLE_CALENDER_ID_KAISHIME);

    const base = [
      '❗️本日21時に大会受付締切❗️',
      '',
      '次の大会は、本日21時に受付を締め切ります。',
      '申込入力URL（調整さん）上で、⭕️か❌になっているか、いま一度ご確認ください。',
      '',
      kaishimeMessage,
    ].join('\n');

    const { message, totalEvents } = buildGroupMessages_(base, groups);

    if (totalEvents > 0) {
      const lineService = new LineService(LINE_CHANNEL_ACCESS_TOKEN);
      lineService.pushText(to, message);
    }
  }

  // ==================================================================================
  // 受付〆アナウンス（来週分まとめ）
  // ==================================================================================
  public deadlineNextWeek(to: string): void {
    const today = DateUtils.startOfDay();
    const oneWeekLater = DateUtils.addDays(today, 7);
    const groups = createGroups_();
    getGroupedEvents_(today, oneWeekLater, groups, GOOGLE_CALENDER_ID_KAISHIME);

    const base = [
      '❗️大会受付締め切りまで間近❗️',
      '',
      '受付締め切りが近い大会のリマインド案内になります。',
      '来週中に受付締切です。',
      'ぜひ積極的に参加をご検討ください◎',
      '',
      kaishimeMessage,
    ].join('\n');

    const { message, totalEvents } = buildGroupMessages_(base, groups);

    if (totalEvents > 0) {
      const lineService = new LineService(LINE_CHANNEL_ACCESS_TOKEN);
      lineService.pushText(to, message);
    }
  }

  // ==================================================================================
  // 本〆アナウンス（当日）
  // ==================================================================================
  public finalIsToday(to: string, mentionee: string): void {
    const today = DateUtils.startOfDay();
    const tomorrow = DateUtils.addDays(today, 1);
    const calendar = CalendarApp.getCalendarById(GOOGLE_CALENDER_ID_HONSHIME);
    const events = calendar.getEvents(today, tomorrow);
    if (events.length === 0) return;

    const formatted = Utilities.formatDate(today, 'JST', 'MM/dd');
    const header = `${formatted} {maintainer}さん\n大会本〆リマインダーです。以下の大会の申込を確認してください。\n\n`;
    const schedule = events.map(ev => ev.getTitle()).join('\n');
    const substitution = {
      maintainer: {
        type: 'mention',
        mentionee: { type: 'user', userId: mentionee },
      },
    } as const;


    const lineService = new LineService(LINE_CHANNEL_ACCESS_TOKEN);
    lineService.pushText(to, header + schedule, substitution);
  }

  // ==================================================================================
  // 調整さん集計（当日）
  // ==================================================================================
  public chouseisanToday(to: string): void {
    const today = DateUtils.startOfDay();
    const chouseisanService = new ChouseisanService();
    const { hasEvent, body } = chouseisanService.checkChouseisanByClass(today, today);

    if (hasEvent) {
      const lineService = new LineService(LINE_CHANNEL_ACCESS_TOKEN);
      lineService.pushText(to, body);
    }
  }

  // ==================================================================================
  // 調整さん集計（1 週間分）
  // ==================================================================================
  public chouseisanWeekly(to: string): void {
    const today = DateUtils.startOfDay();
    const start = DateUtils.addDays(today, -14);
    const end = DateUtils.addDays(today, 14);

    const chouseisanService = new ChouseisanService();
    const { hasEvent, body } = chouseisanService.checkChouseisanByClass(start, end);

    if (hasEvent) {
      const lineService = new LineService(LINE_CHANNEL_ACCESS_TOKEN);
      lineService.pushText(to, body);
    }
  }

  // ==================================================================================
  // 運営2週間後会練(毎週土曜)
  // ==================================================================================
  public weeklyForManagers(to: string): void {
    const today = DateUtils.startOfDay();
    const tomorrow = DateUtils.addDays(today, 1);
    const tomorrowStr = Utilities.formatDate(tomorrow, 'JST', 'MM/dd');
    const nextWednesday = DateUtils.addDays(today, 11);
    const nextNextWednesday = DateUtils.addDays(today, 18);

    const teamPracticeCalendar = CalendarApp.getCalendarById(GOOGLE_CALENDER_ID_KAIRENSHU);
    const teamPracticeEvents = teamPracticeCalendar.getEvents(nextWednesday, nextNextWednesday);
    const teamPractices = teamPracticeEvents.map(ev => this.formatEvent(ev)).join('\n');

    const matchCalendar = CalendarApp.getCalendarById(GOOGLE_CALENDER_ID_TAIKAI);
    const matchEvents = matchCalendar.getEvents(nextWednesday, nextNextWednesday);
    const matches = matchEvents.map(ev => this.formatEvent(ev)).join('\n');

    const base = [
      `{everyone}`,
      `2週間後会練の参加不参加を,`,
      `明日(${tomorrowStr})までにお願いします🤲`,
      ``,
      `↓対象の会練↓`,
      ``,
      teamPractices,
      ``,
      `↓開催の大会↓`,
      ``,
      matches,
      ``
    ].join('\n');
    const substitution = {
      "everyone": {
        type: 'mention',
        mentionee: { type: 'all' },
      }
    } as const;

    const lineService = new LineService(LINE_CHANNEL_ACCESS_TOKEN);
    lineService.pushText(to, base, substitution);
  }

  public formatEvent(event: GoogleAppsScript.Calendar.CalendarEvent): string {
    const monthStr = String(event.getStartTime().getMonth() + 1);
    const dateStr = String(event.getStartTime().getDate());
    const day = event.getStartTime().getDay();
    const wnames = ['日', '月', '火', '水', '木', '金', '土'];
    const dayStr = wnames[day];
    const title = event.getTitle();

    const base = [monthStr, "/", dateStr, "(", dayStr, ") ", title]

    return base.join("");
  }

  private formatToString(infos: (TeamPracticeInfo)[]) {
    const teamPracticesString = infos.map(info =>
      info.month + "/" + info.date + "(" + info.day + ") " + info.timeRange + " " + info.place + " " + info.targetClass).join("\n");
    const locationswithDup = infos.map(info => info.place);
    const locations = [...new Set(locationswithDup)];
    const practiceLocationsString = locations.map(loc => PRACTICE_LOCATIONS[loc].location + "\n" + PRACTICE_LOCATIONS[loc].map_url).join("\n");

    return { teamPracticesString, practiceLocationsString }
  }

  // ==================================================================================
  // 木曜定期便
  // ==================================================================================
  public weekly(to: string): void {
    const today = DateUtils.startOfDay(); //thursday
    const nextThursday = DateUtils.addDays(today, 7);
    const nextNextThursday = DateUtils.addDays(today, 14);

    const teamPracticeCalendar = CalendarApp.getCalendarById(GOOGLE_CALENDER_ID_KAIRENSHU);
    const teamPracticeEvents = teamPracticeCalendar.getEvents(today, nextThursday);
    const rawteamPractices = teamPracticeEvents.map(ev => formatToTeamPracticeInfo_(ev));
    const teamPractices: TeamPracticeInfo[] = rawteamPractices.filter(
      (item): item is TeamPracticeInfo => item !== null
    );
    const { teamPracticesString, practiceLocationsString } = this.formatToString(teamPractices);

    const matchCalendar = CalendarApp.getCalendarById(GOOGLE_CALENDER_ID_TAIKAI);
    const matchEvents = matchCalendar.getEvents(today, nextNextThursday);
    const matches = matchEvents.map(ev => this.formatEvent(ev)).join('\n');

    const lines = [
      '《ちはやふる富士見 木曜定期便》',
      '',
      '【今週末の練習】',
      teamPracticesString,
      '',
      '✔️練習会場案内',
      practiceLocationsString,
      '',
      '✔️会練持ち物',
      'マイ札、かるたノート、上達カード(基本級～F級)、スタートアップガイド',
      '',
      '【遅刻欠席連絡】',
      'あらかじめ遅参が分かっている時、または当日の遅刻欠席する時の連絡メールアドレス',
      ATTENDANCE_ADDRESS,
      '⚠️下記を必ず記載⚠️',
      '題名：名前と級',
      '本文：参加する練習会場、用件(遅刻の場合、到着予定時刻)',
      '✔️LINEで参加を押すと「初めから参加」の意味になります📝',
      '',
      '【今週来週の出場大会】',
      matches,
      '',
      '【活動カレンダー】',
      CALENDER_URL,
      '',
      '【周知済み大会情報】',
      DRIVE_URL,
      '',
      '【申込入力URL(調整さん)】',
      `A級| ${CHOUSEISAN_URLS[`A`]}\n`,
      `B級| ${CHOUSEISAN_URLS[`B`]}\n`,
      `C級| ${CHOUSEISAN_URLS[`C`]}\n`,
      `D級| ${CHOUSEISAN_URLS[`D`]}\n`,
      `E級| ${CHOUSEISAN_URLS[`E`]}\n`,
      `F級| ${CHOUSEISAN_URLS[`F`]}\n`,
      `G級| ${CHOUSEISAN_URLS[`G`]}`,
    ];

    const lineService = new LineService(LINE_CHANNEL_ACCESS_TOKEN);
    lineService.pushText(to, lines.join('\n'));

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
