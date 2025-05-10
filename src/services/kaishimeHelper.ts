import { CHOUSEISAN_URLS } from '../config';

export interface Group { events: string[]; url: string }
export type Groups = Record<string, Group>;

export const createGroups_ = (): Groups => ({
  A: { events: [], url: CHOUSEISAN_URLS[`A`] },
  B: { events: [], url: CHOUSEISAN_URLS[`B`] },
  C: { events: [], url: CHOUSEISAN_URLS[`C`] },
  D: { events: [], url: CHOUSEISAN_URLS[`D`] },
  E: { events: [], url: CHOUSEISAN_URLS[`E`] },
  F: { events: [], url: CHOUSEISAN_URLS[`F`] },
  G: { events: [], url: CHOUSEISAN_URLS[`G`] },
});

export function getGroupedEvents_(
  start: Date,
  end: Date,
  groups: Groups,
  calendarId: string,
): Groups {
  const calendar = CalendarApp.getCalendarById(calendarId);
  const events = calendar.getEvents(start, end);
  events.forEach(ev => {
    const [lettersRaw, name] = ev.getTitle().split('|').map(s => s.trim());
    if (!name) return;
    lettersRaw.replace('〆', '').split('').forEach(letter => {
      if (groups[letter]) groups[letter].events.push(name);
    });
  });
  return groups;
}

export function buildGroupMessages_(
  base: string,
  groups: Groups
): {
  message: string;
  totalEvents: number
} {
  let total = 0;
  let msg = base;
  (Object.keys(groups) as Array<keyof Groups>).forEach(letter => {
    const g = groups[letter];
    if (g.events.length === 0) return;
    msg += `${letter}級|申込: ${g.url}\n`;
    g.events.forEach(ev => (msg += `・${ev}\n`));
    msg += '\n';
    total += g.events.length;
  });
  return { message: msg, totalEvents: total };
}

export const kaishimeMessage =
  '各大会情報については、級別のLINEノート(画面右上≡)を参照してください。\n\n' +
  '⚠️申込入力URL(調整さん)では、⭕️か❌の入力をお願いいたします。\n' +
  '空欄や△は検討中と判断します。\n' +
  '⭕️か❌を期限内にご入力ください。\n\n';