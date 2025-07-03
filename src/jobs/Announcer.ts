import {
  ATTENDANCE_ADDRESS,
  CALENDER_URL,
  CHOUSEISAN_URLS,
  DRIVE_URL,
  GOOGLE_CALENDER_ID_HONSHIME,
  GOOGLE_CALENDER_ID_KAISHIME,
  PRACTICE_LOCATIONS
} from '../config';

import { buildGroupMessages_, createGroups_, getGroupedEvents_, kaishimeMessage, } from '../services/kaishimeHelper';
import { MatchCalendarEvent, OuterPracticeCalendarEvent, TeamPracticeCalendarEvent } from '../type';

import { CalendarService } from '../services/CalendarService';
import { ChouseisanService } from '../services/ChouseisanService';
import { LineService } from '../services/LineService';
import { DateUtils, WEEK_DAYS } from '../util/DateUtils';

export class Announcer {
  private today = DateUtils.startOfDay();
  private tomorrow = DateUtils.addDays(this.today, 1);
  private oneWeekLater = DateUtils.addDays(this.today, 7);
  private twoWeekLater = DateUtils.addDays(this.today, 14);
  private readonly groups = createGroups_();

  // ==================================================================================
  // 受付〆アナウンス（当日 21 時）
  // ==================================================================================
  public deadlineToday(to: string): void {
    const events = getGroupedEvents_(
      this.today, this.tomorrow, this.groups, GOOGLE_CALENDER_ID_KAISHIME);

    const base = [
      '❗️本日21時に大会受付締切❗️',
      '',
      '次の大会は、本日21時に受付を締め切ります。',
      '申込入力URL（調整さん）上で、⭕️か❌になっているか、いま一度ご確認ください。',
      '',
      kaishimeMessage,
    ].join('\n');

    const { message, totalEvents } = buildGroupMessages_(base, events);

    if (totalEvents > 0) {
      const lineService = new LineService();
      lineService.pushText(to, message);
    }
  }

  // ==================================================================================
  // 受付〆アナウンス（来週分まとめ）
  // ==================================================================================
  public deadlineNextWeek(to: string): void {
    const events = getGroupedEvents_(
      this.today, this.oneWeekLater, this.groups, GOOGLE_CALENDER_ID_KAISHIME);

    const base = [
      '❗️大会受付締め切りまで間近❗️',
      '',
      '受付締め切りが近い大会のリマインド案内になります。',
      '来週中に受付締切です。',
      'ぜひ積極的に参加をご検討ください◎',
      '',
      kaishimeMessage,
    ].join('\n');

    const { message, totalEvents } = buildGroupMessages_(base, events);

    if (totalEvents > 0) {
      const lineService = new LineService();
      lineService.pushText(to, message);
    }
  }

  // ==================================================================================
  // 本〆アナウンス（当日）
  // ==================================================================================
  public finalIsToday(to: string, mentionee: string): void {
    const calendar = CalendarApp.getCalendarById(GOOGLE_CALENDER_ID_HONSHIME);
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


    const lineService = new LineService();
    lineService.pushText(to, header + schedule, substitution);
  }

  // ==================================================================================
  // 調整さん集計（当日）
  // ==================================================================================
  public chouseisanToday(to: string): void {
    const chouseisanService = new ChouseisanService();
    const { hasEvent, body } = chouseisanService.checkChouseisanByClass(this.today, this.today);

    if (hasEvent) {
      const lineService = new LineService();
      lineService.pushText(to, body);
    }
  }

  // ==================================================================================
  // 調整さん集計（1 週間分）
  // ==================================================================================
  public chouseisanWeekly(to: string): void {
    const start = DateUtils.addDays(this.today, -14);
    const end = DateUtils.addDays(this.today, 14);

    const chouseisanService = new ChouseisanService();
    const { hasEvent, body } = chouseisanService.checkChouseisanByClass(start, end);

    if (hasEvent) {
      const lineService = new LineService();
      lineService.pushText(to, body);
    }
  }

  private teamPracticesToString(
    infos: TeamPracticeCalendarEvent[]
  ): {
    teamPracticesString: string;
    practiceLocationsString: string;
  } {
    const teamPracticesString = infos
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

    return { teamPracticesString, practiceLocationsString };
  }


  private outerPracticesToString(
    infos: OuterPracticeCalendarEvent[]
  ): string {
    return infos
      .map(({ date, timeRange, title, targetClasses, location }) => {
        const target = Array.isArray(targetClasses)
          ? targetClasses.join("、")
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

  private matchesToString(infos: (MatchCalendarEvent)[]): string {
    return infos
      .map(({ date, title, targetClasses, location }) => {
        const target = Array.isArray(targetClasses)
          ? targetClasses.join("、")
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
    const calendarService = new CalendarService();

    const teamPractices: TeamPracticeCalendarEvent[]
      = calendarService.getTeamPractices(this.today, this.oneWeekLater);
    const { teamPracticesString, practiceLocationsString }
      = this.teamPracticesToString(teamPractices);

    const outerPractices = calendarService.getOuterPractices(this.today, this.oneWeekLater)
    const outerPracticesString = this.outerPracticesToString(outerPractices);

    const matches = calendarService.getMatches(this.today, this.twoWeekLater)
    const matchesString = this.matchesToString(matches);

    const lines = [
      '《ちはやふる富士見 木曜定期便》',
      '',
      '🟦今週末の練習🟦',
      teamPracticesString,
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
      CALENDER_URL,
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

    const lineService = new LineService();
    lineService.pushText(to, lines.join('\n'));
  }

  /**
   * Fisher–Yates でシャッフルして先頭 size 件抽出 & 昇順ソート
   */
  private chooseAndSort(size: number, source: number[]): number[] {
    if (size <= 0) return [];
    const arr = [...source];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr.slice(0, size).sort((a, b) => a - b);
  }

  /**
   * ベースと残りから混在リストを生成して昇順ソート
   */
  private mixAndSort(base: number[], all: number[], pickBase: number, pickRest: number): number[] {
    const fromBase = this.chooseAndSort(pickBase, base);
    const fromRest = this.chooseAndSort(pickRest, all.filter(n => !base.includes(n)));
    return [...fromBase, ...fromRest].sort((a, b) => a - b);
  }


  // ==================================================================================
  // 今日の練習・札分け
  // ==================================================================================
  public todayPractice(to: string): void {
    const practices: TeamPracticeCalendarEvent[]
      = new CalendarService().getTeamPractices(this.today, this.tomorrow);
    if (!practices.length) return;

    // 1) 今日の練習情報テキスト化
    const practiceMsg = practices
      .map(({ location, timeRange, targetClasses }) => {
        const place = location.buildingName
          ? `${location.shortenBuildingName}(${location.buildingName})`
          : location.shortenBuildingName;
        return `${place} ${timeRange}|${targetClasses}`;
      })
      .join("\n");

    // 2) 会札リスト生成
    const nums = Array.from({ length: 10 }, (_, i) => i);
    const hira = ['あ', 'い', 'う', 'え', 'お', 'か', 'き', 'く', 'け', 'こ'];
    const kata = ['サ', 'シ', 'ス', 'セ', 'ソ', 'タ', 'チ', 'ツ', 'テ', 'ト'];
    const kanji = ['一', '二', '三', '四', '五', '六', '七', '八', '九', '十'];
    const charSets = [hira, kata, kanji] as const;

    const numLists: number[][] = [];
    numLists.push(this.chooseAndSort(5, nums));
    numLists.push(this.chooseAndSort(5, nums));
    numLists.push(this.chooseAndSort(5, nums));
    numLists.push(this.mixAndSort(numLists[0], nums, 2, 3));
    numLists.push(this.mixAndSort(numLists[1], nums, 2, 3));
    numLists.push(this.mixAndSort(numLists[2], nums, 2, 3));

    const kaihudaLists = numLists.map((list, idx) => {
      const set = idx < 3 ? charSets[idx] : charSets[(idx - 3)];
      return list.map(i => set[i]);
    });

    // 3) マイ札リスト生成
    const myCardsList: number[][] = [];
    myCardsList.push(this.chooseAndSort(5, nums));
    myCardsList.push(this.chooseAndSort(5, nums));
    myCardsList.push(this.mixAndSort(myCardsList[0], nums, 2, 3));
    myCardsList.push(this.mixAndSort(myCardsList[1], nums, 2, 3));
    myCardsList.push(this.mixAndSort(myCardsList[2], nums, 2, 3));
    myCardsList.push(this.mixAndSort(myCardsList[3], nums, 2, 3));

    // 4) メッセージ組み立て
    const order = ["一の位", "十の位"];
    const msgKai = kaihudaLists
      .map((lst, i) => `  ${i + 1}試合目: ${lst.join(', ')}`)
      .join("\n");
    const msgMy = myCardsList
      .map((lst, i) => `  ${i + 1}試合目: ${order[i % 2]}が${lst.join(', ')}`)
      .join("\n");

    const fullMsg = [
      "■今日の練習■",
      practiceMsg,
      "=会札=",
      msgKai,
      "",
      "=マイ札=",
      msgMy,
      "",
      "=札分けの一覧表=",
      "https://onl.sc/nUb3Qd8"
    ].join("\n");

    new LineService().pushText(to, fullMsg);
  }
}

// ==================================================================================
// 運営2週間後会練(毎週土曜)
// ==================================================================================
// public weeklyForManagers(to: string): void {
//   const today = DateUtils.startOfDay();
//   const tomorrow = DateUtils.addDays(today, 1);
//   const tomorrowStr = Utilities.formatDate(tomorrow, 'JST', 'MM/dd');
//   const nextWednesday = DateUtils.addDays(today, 11);
//   const nextNextWednesday = DateUtils.addDays(today, 18);

//   const calendarService = new CalendarService();

//   const teamPractices = calendarService.getTeamPractices(nextWednesday, nextNextWednesday);
//   const matches = calendarService.getMatches(nextWednesday, nextNextWednesday);

//   const base = [
//     `{everyone}`,
//     `2週間後会練の参加不参加を,`,
//     `明日(${tomorrowStr})までにお願いします🤲`,
//     ``,
//     `↓対象の会練↓`,
//     ``,
//     teamPractices,
//     ``,
//     `↓開催の大会↓`,
//     ``,
//     matches,
//     ``
//   ].join('\n');
//   const substitution = {
//     "everyone": {
//       type: 'mention',
//       mentionee: { type: 'all' },
//     }
//   } as const;

//   const lineService = new LineService();
//   lineService.pushText(to, base, substitution);
// }
// ==================================================================================
// カレンダー画像生成&送信
// ==================================================================================
// public sendMonthlyCalendar_(to: string): void {
//   const result = generateMonthlyCalendar_();
//   if (!result) { Logger.log("canceled"); return; }
//   const { original, preview } = result;
//   pushImage_(to, original, preview);
// }
