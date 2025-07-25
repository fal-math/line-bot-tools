import { CalendarIds, PRACTICE_LOCATIONS } from "../config";
import { MatchEvent, ExternalPracticeEvent, InternalDeadlineEvent, ClubPracticeEvent, BaseEvent, ClassMap, KarutaClass } from "../types/type";
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
  parser: (reg: RegExpMatchArray, event: GoogleAppsScript.Calendar.CalendarEvent) => T | null;
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
      regex: /^(.+?)\.(.+?)(\d{3,4}-\d{3,4})(.+?)\((.+?)\)$/,
      parser: (m, event) => {
        const [_, shortLoc, practiceType, timeRange, targetClasses, person] = m;
        const loc = PRACTICE_LOCATIONS[shortLoc];
        if (!loc) return null;
        return {
          date: new Date(event.getStartTime().getTime()),
          location: loc,
          practiceType: StringUtils.removeBracketSymbols(practiceType.trim()),
          timeRange: StringUtils.removeBracketSymbols(timeRange.trim()),
          targetClasses: StringUtils.removeBracketSymbols(targetClasses.trim()),
          personInCharge: StringUtils.removeBracketSymbols(person.trim()),
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
          location: event.getLocation().split(",")[0],
          description: StringUtils.htmlToPlainText(event.getDescription()),
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
          isMatch: !title.includes('外部'),
          isExternalPractice: title.includes('外部'),
        } as InternalDeadlineEvent;
      }
    }
  };

  static groupByClass<T extends BaseEvent>(
    events: T[]
  ): ClassMap<T[]> {
    const result = (Object.values(KarutaClass) as KarutaClass[]).reduce(
      (acc, klass) => {
        acc[klass] = [];
        return acc;
      },
      {} as ClassMap<T[]>
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

  public get<K extends EventTypeKey>(
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

  /**
    * 外部練習イベントを登録する
    *
    * @param params.start    開始日時 (Date)
    * @param params.end      終了日時 (Date)
    * @param params.summary  イベントタイトル
    * @param params.location イベント場所
    * @param params.description 説明 (〆切など)
    * @returns CalendarApp.CalendarEvent
    */
  public createCalenderEvent(params: {
    start: Date;
    summary: string;
    location?: string;
    description?: string;
  },
    calendarId: string
  ): GoogleAppsScript.Calendar.CalendarEvent {
    const calendar = CalendarApp.getCalendarById(calendarId);
    if (!calendar) {
      throw new Error(`Calendar not found: ${calendarId}`);
    }
    // イベント作成
    const event = calendar.createAllDayEvent(
      params.summary,
      params.start,
      {
        location: params.location,
        description: params.description,
      }
    );
    return event;
  }
}
