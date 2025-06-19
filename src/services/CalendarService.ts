import { GOOGLE_CALENDER_ID_KAIRENSHU, GOOGLE_CALENDER_ID_OUTER, GOOGLE_CALENDER_ID_TAIKAI, PRACTICE_LOCATIONS } from "../config";
import { KarutaClass, MatchCalendarEvent, OuterPracticeCalendarEvent, TeamPracticeCalendarEvent } from "../type";

export class CalendarService {
  private formatToTeamPracticeEvent(
    event: GoogleAppsScript.Calendar.CalendarEvent
  ): TeamPracticeCalendarEvent | null {
    const eventTitle = event.getTitle();
    const date: Date = new Date(event.getStartTime().getTime());
    const [shortenLocation, rest] = eventTitle.split(".", 2);
    if (!rest) return null;

    const re = /^([^\d]*?)(\d{3,4}-\d{3,4})\s+(.+?)\((.+?)\)$/;
    const m = rest.trim().match(re);
    if (!m) return null;
    const [, practiceType, timeRange, targetClass, personInCharge] = m;

    const location = PRACTICE_LOCATIONS[shortenLocation];
    if (!location) return null;

    return {
      date,
      location,
      practiceType: practiceType.trim(),
      timeRange: timeRange.trim(),
      targetClasses: targetClass.trim(),
      personInCharge: personInCharge.trim()
    };
  }
  
  private formatToOuterPracticeEvent(
    event: GoogleAppsScript.Calendar.CalendarEvent
  ): OuterPracticeCalendarEvent | null {
    const eventTitle = event.getTitle();
    const date: Date = new Date(event.getStartTime().getTime());
    const location = event.getLocation();

    const re = /^(.+?)(\d{3,4}-\d{3,4})\s*([^:]+):(.+)$/;
    const m = eventTitle.trim().match(re);
    if (!m) return null;
    const [, title, timeRange, targetClasses, comment] = m;

    return {
      date,
      targetClasses,
      title,
      timeRange,
      location
    };
  }

  private formatToMatchEvent(
    event: GoogleAppsScript.Calendar.CalendarEvent
  ): MatchCalendarEvent | null {
    const eventTitle = event.getTitle();
    const date: Date = new Date(event.getStartTime().getTime());
    const location = event.getLocation();

    const re = /^(.+?)([A-G]+)?$/u;
    const m = eventTitle.match(re);
    if (!m) return null;

    const [, title, classStr] = m;
    const chars = classStr?.split('') ?? [];

    const targetClasses: KarutaClass[] = chars
      .map(char => {
        return KarutaClass[char as keyof typeof KarutaClass];
      })
      .filter((kc): kc is KarutaClass => Boolean(kc));

    return {
      date,
      targetClasses,
      title,
      location,
      // mapUrl
    }
  }

  public getTeamPractices(
    start: Date, end: Date
  ): TeamPracticeCalendarEvent[] {
    const teamPracticeEvents = CalendarApp.getCalendarById(GOOGLE_CALENDER_ID_KAIRENSHU).getEvents(start, end);
    const rawteamPractices = teamPracticeEvents.map(ev => this.formatToTeamPracticeEvent(ev));
    const teamPractices: TeamPracticeCalendarEvent[] = rawteamPractices.filter(
      (item): item is TeamPracticeCalendarEvent => item !== null
    );
    return teamPractices;
  }

  public getOuterPractices(
    start: Date, end: Date
  ): OuterPracticeCalendarEvent[] {
    const outerPracticeEvents = CalendarApp.getCalendarById(GOOGLE_CALENDER_ID_OUTER).getEvents(start, end);
    const rawouterPractices = outerPracticeEvents.map(ev => this.formatToOuterPracticeEvent(ev));
    const outerPractices: OuterPracticeCalendarEvent[] = rawouterPractices.filter(
      (item): item is OuterPracticeCalendarEvent => item !== null
    );
    return outerPractices;
  }

  public getMatches(
    start: Date, end: Date
  ): MatchCalendarEvent[] {
    const matchEvents = CalendarApp.getCalendarById(GOOGLE_CALENDER_ID_TAIKAI).getEvents(start, end);
    const rawmatches = matchEvents.map(ev => this.formatToMatchEvent(ev));
    const matches: MatchCalendarEvent[] = rawmatches.filter(
      (item): item is MatchCalendarEvent => item !== null
    );
    return matches;
  }
}