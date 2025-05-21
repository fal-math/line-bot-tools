import { CHOUSEISAN_CSVS } from '../config';
import { EventStatus, Participants } from '../type';
import { toMD_, toYMD_ } from '../util/date';
import { fetchChoseisan_ } from './chouseisan';

const CSV_MAP: Record<string, string> = {
  A: CHOUSEISAN_CSVS[`A`],
  B: CHOUSEISAN_CSVS[`B`],
  C: CHOUSEISAN_CSVS[`C`],
  D: CHOUSEISAN_CSVS[`D`],
  E: CHOUSEISAN_CSVS[`E`],
  F: CHOUSEISAN_CSVS[`F`],
  G: CHOUSEISAN_CSVS[`G`],
};

export function checkChouseisanByClass_(
  startYMD: string,
  endYMD: string,
): {
  hasEvent: boolean;
  body: string
} {
  let body = `＝大会申込状況まとめ（〆切 ${toMD_(startYMD)}〜${toMD_(endYMD)}）＝\n\n`;
  let hasEvent = false;

  Object.entries(CSV_MAP).forEach(([karutaClass, url]) => {
    const rowChouseisanData: string = fetchChoseisan_(url);
    const events: EventStatus[] = formatChouseisanData_(rowChouseisanData);
    const filtered: EventStatus[] = filterByDeadline_(events, startYMD, endYMD);

    if (Object.keys(filtered).length) {
      body += `--${karutaClass}級--\n`
      for (const ev of Object.values(filtered)) {
        body += `🔹${ev.eventTitle}（${toMD_(ev.deadline)}〆切）\n`;
        body += `⭕参加: ${ev.participants.attending.join("\n")}\n`;
        body += `❓未回答: ${ev.participants.undecided.join("\n")}\n\n`;
      }
      hasEvent = true;
    }
  });

  return { hasEvent, body }
}

export function formatChouseisanData_(rowChouseisanData: string): EventStatus[] {
  const parsedData = rowChouseisanData.trim().split(/\r?\n/).map(line => line.split(","));
  const members = extractMembers_(parsedData);
  const result: EventStatus[] = [];

  parsedData.forEach(row => {
    const firstCol = row[0];
    if (["日程", "コメント", ""].includes(firstCol) || row.length <= 1) return;

    const eventStatus = parseEventRow_(row, members);
    if (eventStatus) result.push(eventStatus);
  });

  return result;
}

function parseEventRow_(row: string[], members: string[]): EventStatus | null {
  const eventRegex = /^\(?(\d{1,2}\/\d{1,2})(?:[日月火水木金土](?:祝)?)?\.(.+?)\(〆(\d{1,2}\/\d{1,2})(?:[日月火水木金土](?:祝)?)?\)$/;
  const [firstCol, ...rest] = row;
  const match = firstCol.match(eventRegex);

  if (!match) {
    Logger.log(`イベント情報の形式が不正です: ${firstCol}`);
    return null;
  }

  const [, dateMD, eventTitle, deadlineMD] = match;
  const date = toYMD_(dateMD);
  const deadline = toYMD_(deadlineMD);

  const participants: Participants = { attending: [], notAttending: [], undecided: [] };

  members.forEach((member, idx) => {
    const status = rest[idx];
    if (status === "◯") participants.attending.push(member);
    else if (status === "×") participants.notAttending.push(member);
    else participants.undecided.push(member);
  });

  return { eventTitle, date, deadline, participants };
}

function extractMembers_(parsedData: string[][]): string[] {
  const headerRow = parsedData.find(row => row[0] === "日程");
  return headerRow ? headerRow.slice(1) : [];
}

export const filterByDeadline_ = (
  events: EventStatus[],
  start: string,
  end: string
): EventStatus[] => {
  const out: EventStatus[] = [];
  Object.values(events).forEach(ev => {
    if (ev.deadline >= start && ev.deadline <= end) out.push(ev);
  });
  return out;
};
