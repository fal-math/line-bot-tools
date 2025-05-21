import {
  ATTENDANCE_ADDRESS,
  CALENDER_URL,
  CHOUSEISAN_URLS,
  DRIVE_URL,
  GOOGLE_CALENDER_ID_HONSHIME,
  GOOGLE_CALENDER_ID_KAIRENSHU,
  GOOGLE_CALENDER_ID_KAISHIME,
  GOOGLE_CALENDER_ID_TAIKAI,
  LINE_CHANNEL_ACCESS_TOKEN
} from '../config';

import { pushImage_, pushTextV2_ } from '../services/line';
import { addDays_, startOfDay_ } from '../util/date';
import { checkChouseisanByClass_ } from '../services/chouseisanHelper';
import { buildGroupMessages_, createGroups_, getGroupedEvents_, kaishimeMessage, } from '../services/kaishimeHelper';
import { generateMonthlyCalendar_ } from '../services/calenderImage';

// ==================================================================================
// 受付〆アナウンス（当日 21 時）
// ==================================================================================
export function announceDeadlineToday_(to: string): void {
  const today = startOfDay_();
  const tomorrow = addDays_(today, 1);
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
  if (totalEvents > 0) pushTextV2_(to, LINE_CHANNEL_ACCESS_TOKEN, message);
}

// ==================================================================================
// 受付〆アナウンス（来週分まとめ）
// ==================================================================================
export function announceDeadlineNextWeek_(to: string): void {
  const today = startOfDay_();
  const oneWeekLater = addDays_(today, 7);
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
  if (totalEvents > 0) pushTextV2_(to, LINE_CHANNEL_ACCESS_TOKEN, message);
}

// ==================================================================================
// 本〆アナウンス（当日）
// ==================================================================================
export function announceFinalToday_(to: string, mentionee: string): void {
  const today = startOfDay_();
  const tomorrow = addDays_(today, 1);
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

  pushTextV2_(to, LINE_CHANNEL_ACCESS_TOKEN, header + schedule, substitution);
}

// ==================================================================================
// 調整さん集計（当日）
// ==================================================================================
export function announceChouseisanToday_(to: string): void {
  const today = startOfDay_();
  const ymd = Utilities.formatDate(today, 'JST', 'yyyy-MM-dd');
  const { hasEvent, body } = checkChouseisanByClass_(ymd, ymd);

  if (hasEvent) pushTextV2_(to, LINE_CHANNEL_ACCESS_TOKEN, body);
}

// ==================================================================================
// 調整さん集計（1 週間分）
// ==================================================================================
export function announceChouseisanWeekly_(to: string): void {
  const today = startOfDay_();
  const start = addDays_(today, -7);
  const startYMD = Utilities.formatDate(start, 'JST', 'yyyy-MM-dd');
  const endYMD = Utilities.formatDate(today, 'JST', 'yyyy-MM-dd');
  const { hasEvent, body } = checkChouseisanByClass_(startYMD, endYMD);

  if (hasEvent) pushTextV2_(to, LINE_CHANNEL_ACCESS_TOKEN, body);
}

// ==================================================================================
// 運営2週間後会練(毎週土曜)
// ==================================================================================
export function announceWeeklyForManagers_(to: string): void {
  const today = startOfDay_();
  const tomorrow = addDays_(today, 1);
  const tomorrowStr = Utilities.formatDate(tomorrow, 'JST', 'MM/dd');
  const nextWednesday = addDays_(today, 11);
  const nextNextWednesday = addDays_(today, 18);

  const teamPracticeCalendar = CalendarApp.getCalendarById(GOOGLE_CALENDER_ID_KAIRENSHU);
  const teamPracticeEvents = teamPracticeCalendar.getEvents(nextWednesday, nextNextWednesday);
  const teamPractices = teamPracticeEvents.map(ev => formatEvent_(ev)).join('\n');

  const matchCalendar = CalendarApp.getCalendarById(GOOGLE_CALENDER_ID_TAIKAI);
  const matchEvents = matchCalendar.getEvents(nextWednesday, nextNextWednesday);
  const matches = matchEvents.map(ev => formatEvent_(ev)).join('\n');

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
    },
  } as const;

  pushTextV2_(to, LINE_CHANNEL_ACCESS_TOKEN, base, substitution);
}

export function formatEvent_(event: GoogleAppsScript.Calendar.CalendarEvent): string {
  const monthStr = String(event.getStartTime().getMonth() + 1);
  const dateStr = String(event.getStartTime().getDate());
  const day = event.getStartTime().getDay();
  const wnames = ['日', '月', '火', '水', '木', '金', '土'];
  const dayStr = wnames[day];
  const title = event.getTitle();

  const base = [monthStr, "/", dateStr, "(", dayStr, ") ", title, "[", location, "]"]

  return base.join("");
}

// ==================================================================================
// 木曜定期便
// ==================================================================================
export function announceWeekly_(to: string): void {
  const today = startOfDay_(); //thrusday
  const nextThursday = addDays_(today, 7);
  const nextNextThursday = addDays_(today, 14);

  const teamPracticeCalendar = CalendarApp.getCalendarById(GOOGLE_CALENDER_ID_KAIRENSHU);
  const teamPracticeEvents = teamPracticeCalendar.getEvents(today, nextThursday);
  const teamPractices = teamPracticeEvents.map(ev => formatEvent_(ev)).join('\n');

  const matchCalendar = CalendarApp.getCalendarById(GOOGLE_CALENDER_ID_TAIKAI);
  const matchEvents = matchCalendar.getEvents(today, nextNextThursday);
  const matches = matchEvents.map(ev => formatEvent_(ev)).join('\n');

  const lines = [
    '《ちはやふる富士見 木曜定期便》',
    '',
    '【今週末の練習】',
    teamPractices,
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

  pushTextV2_(to, LINE_CHANNEL_ACCESS_TOKEN, lines.join('\n'));
}

// ==================================================================================
// カレンダー画像生成&送信
// ==================================================================================
export function sendMonthlyCalendar_(to: string): void {
  const result = generateMonthlyCalendar_();
  if (!result) { Logger.log("canceled"); return; }
  const { original, preview } = result;
  pushImage_(to, original, preview);
}
