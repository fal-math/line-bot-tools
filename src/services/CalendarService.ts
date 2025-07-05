import { CalendarIds, PRACTICE_LOCATIONS } from "../config";
import { MatchEvent, ExternalPracticeEvent, InternalDeadlineEvent, ClubPracticeEvent } from "../type";
import { StringUtils } from "../util/StringUtils";

export const EventType = {
  ClubPractice: 'clubPractice',
  ExternalPractice: 'externalPractice',
  Match: 'match',
  InternalDeadline: 'internalDeadline',
} as const;
export type EventTypeKey = typeof EventType[keyof typeof EventType];

interface EventConfig<T> {
  calendarId: string;
  regex: RegExp;
  parser: (match: RegExpMatchArray, event: GoogleAppsScript.Calendar.CalendarEvent) => T | null;
}
export interface EventMap {
  [EventType.ClubPractice]: ClubPracticeEvent;
  [EventType.ExternalPractice]: ExternalPracticeEvent;
  [EventType.Match]: MatchEvent;
  [EventType.InternalDeadline]: InternalDeadlineEvent;
}

export class CalendarService {
  // イベントごとの設定
  private readonly configs: Record<EventTypeKey, EventConfig<any>> = {
    [EventType.ClubPractice]: {
      calendarId: CalendarIds.clubPractice,
      regex: /^(.+?)\.(.+?)(\d{3,4}-\d{3,4})\s+(.+?)\((.+?)\)$/,
      parser: (m, event) => {
        const [_, shortLoc, practiceType, timeRange, targetClasses, person] = m;
        const loc = PRACTICE_LOCATIONS[shortLoc];
        if (!loc) return null;
        return {
          date: new Date(event.getStartTime().getTime()),
          location: loc,
          practiceType: practiceType.trim(),
          timeRange: timeRange.trim(),
          targetClasses,
          personInCharge: person.trim(),
        } as ClubPracticeEvent;
      }
    },
    [EventType.ExternalPractice]: {
      calendarId: CalendarIds.externalPractice,
      regex: /^(.+?)(\d{3,4}-\d{3,4})\s*([^:]+):(.+)$/,
      parser: (m, event) => {
        const [_, title, timeRange, classStr] = m;
        return {
          date: new Date(event.getStartTime().getTime()),
          title: title.trim(),
          timeRange: timeRange.trim(),
          targetClasses: StringUtils.formatKarutaClass(classStr),
          location: event.getLocation(),
        } as ExternalPracticeEvent;
      }
    },
    [EventType.Match]: {
      calendarId: CalendarIds.match,
      regex: /^(.+?)([A-G]+)?$/u,
      parser: (m, event) => {
        const [_, title, classStr] = m;
        return {
          date: new Date(event.getStartTime().getTime()),
          title: title.trim(),
          targetClasses: StringUtils.formatKarutaClass(classStr),
          location: event.getLocation(),
        } as MatchEvent;
      }
    },
    [EventType.InternalDeadline]: {
      calendarId: CalendarIds.internalDeadline,
      regex: /^〆([A-G]+)\|(.+)$/,
      parser: (m, event) => {
        const [_, classStr, title] = m;
        return {
          date: new Date(event.getStartTime().getTime()),
          targetClasses: StringUtils.formatKarutaClass(classStr),
          title: title.trim(),
          isExternalPractice: title.includes('外部'),
        } as InternalDeadlineEvent;
      }
    }
  };

  // 汎用取得メソッド
  public getEvents<K extends EventTypeKey>(
    type: K,
    start: Date,
    end: Date
  ): EventMap[K][] {
    const cfg = this.configs[type] as EventConfig<EventMap[K]>;
    const rawEvents = CalendarApp
      .getCalendarById(cfg.calendarId)
      .getEvents(start, end);

    return rawEvents
      .map(ev => {
        const m = ev.getTitle().trim().match(cfg.regex);
        return m ? cfg.parser(m, ev) : null;
      })
      .filter((e): e is EventMap[K] => e !== null);
  }
}
