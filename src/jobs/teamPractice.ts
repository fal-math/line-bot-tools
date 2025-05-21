import { GOOGLE_CALENDER_ID_KAIRENSHU, LINE_CHANNEL_ACCESS_TOKEN, PRACTICE_LOCATIONS } from "../config";
import { formatToTeamPracticeInfo_, TeamPracticeInfo } from "../services/calenderImage";
import { pushTextV2_ } from "../services/line";
import { addDays_, startOfDay_ } from "../util/date";

export function announceTodayPractice_(to: string): void {
  // 練習取得
  const today = startOfDay_();
  const tomorrow = addDays_(today, 1)
  const teamPracticeCalendar = CalendarApp.getCalendarById(GOOGLE_CALENDER_ID_KAIRENSHU);
  const teamPracticeEvents = teamPracticeCalendar.getEvents(today, tomorrow);
  if (teamPracticeEvents.length === 0) return;

  const teamPractices = teamPracticeEvents.map(ev => formatToTeamPracticeInfo_(ev));

  function formatter(info: TeamPracticeInfo | null): string {
    if (!info) return "";

    const { place, timeRange, targetClass } = info;
    const thisPracticeLocation = PRACTICE_LOCATIONS[place] ?? "";
    const placeLabel = thisPracticeLocation.name
      ? `${place}(${thisPracticeLocation.name})`
      : place;

    return `${placeLabel} ${timeRange}|${targetClass}`;
  }
  const teamPracticesStr = teamPractices.map(ev => formatter(ev)).join("\n");

  // 札分け
  const listNum: number[] = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
  const listKanji: string[] = ['一', '二', '三', '四', '五', '六', '七', '八', '九', '十'];
  const listHiragana: string[] = ['あ', 'い', 'う', 'え', 'お', 'か', 'き', 'く', 'け', 'こ'];
  const listKatakana: string[] = ['サ', 'シ', 'ス', 'セ', 'ソ', 'タ', 'チ', 'ツ', 'テ', 'ト'];

  let seed = (() => {
    const now = new Date();
    return (now.getMonth() + 1) * 100 + now.getDate();
  })();

  const kaihudaLists = [] as string[][];
  for (const charList of [listHiragana, listKatakana, listKanji]) {
    const nums = chooseN_(5, listNum, seed);
    kaihudaLists.push(numListToCharList_(nums, charList));
    seed = seed * 2 + 1;
  }

  const mix1 = [...chooseN_(2, chooseN_(5, listNum, ((seed = seed * 2 + 1))), seed),
  ...chooseN_(3, listNum.filter(i => !chooseN_(5, listNum, seed).includes(i)), seed)].sort();
  kaihudaLists.push(numListToCharList_(mix1, listHiragana));
  seed = seed * 2 + 1;

  const mix2 = [...chooseN_(2, chooseN_(5, listNum, ((seed = seed * 2 + 1))), seed),
  ...chooseN_(3, listNum.filter(i => !chooseN_(5, listNum, seed).includes(i)), seed)].sort();
  kaihudaLists.push(numListToCharList_(mix2, listKatakana));
  seed = seed * 2 + 1;

  // Generate マイ札 lists
  const myLists: number[][] = [];
  const base1 = chooseN_(5, listNum, seed); seed = seed * 2 + 1;
  const base2 = chooseN_(5, listNum, seed); seed = seed * 2 + 1;
  myLists.push(base1);
  myLists.push(base2);
  myLists.push([...chooseN_(2, base1, (seed = seed * 2 + 1)), ...chooseN_(3, listNum.filter(i => !base1.includes(i)), seed)].sort());
  seed = seed * 2 + 1;
  myLists.push([...chooseN_(2, base2, seed), ...chooseN_(3, listNum.filter(i => !base2.includes(i)), seed)].sort());
  seed = seed * 2 + 1;
  myLists.push([...chooseN_(2, myLists[2], seed), ...chooseN_(3, listNum.filter(i => !myLists[2].includes(i)), seed)].sort());

  // Build message
  const orderList = ["一の位", "十の位"];
  const messageHudawake =
    `=会札=` + '\n' +
    kaihudaLists.map((lst, i) => `  ${i + 1}試合目 : ${lst.join(', ')}`).join('\n') + '\n' +
    `=マイ札=` + '\n' +
    myLists.map((lst, i) => `  ${i + 1}試合目 : ${orderList[i % 2]}が${lst.join(', ')}`).join('\n') + '\n' +
    '=札分けの一覧表= \n https://onl.sc/nUb3Qd8';

  pushTextV2_(to, LINE_CHANNEL_ACCESS_TOKEN, teamPracticesStr + '\n\n' + messageHudawake);
}

/**
 * Choose `size` random numbers from `inputList` using `seed`.
 */
function chooseN_(size: number, inputList: number[], seed: number): number[] {
  const rng = new Random(seed);
  const selected: number[] = [];
  if (size <= 0) return selected;
  while (selected.length < size) {
    const n = rng.nextInt(0, 9);
    if (inputList.includes(n) && !selected.includes(n)) {
      selected.push(n);
    }
  }
  return selected.sort((a, b) => a - b);
}

class Random {
  private x = 123456789;
  private y = 362436069;
  private z = 521288629;
  private w: number;

  constructor(seed: number = 88675123) {
    this.w = seed;
  }

  private next(): number {
    const t = this.x ^ (this.x << 11);
    this.x = this.y;
    this.y = this.z;
    this.z = this.w;
    this.w = (this.w ^ (this.w >>> 19)) ^ (t ^ (t >>> 8));
    return this.w;
  }

  /** min 以上 max 以下の乱数を返す */
  public nextInt(min: number, max: number): number {
    return min + (Math.abs(this.next()) % (max + 1 - min));
  }
}

/**
 * Map numeric indices to characters.
 */
function numListToCharList_(indices: number[], chars: string[]): string[] {
  return indices.map(i => chars[i]);
}