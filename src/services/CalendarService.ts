import { CalendarIds, PRACTICE_LOCATIONS } from "../config";
import { MatchEvent, ExternalPracticeEvent, InternalDeadlineEvent, ClubPracticeEvent } from "../type";
import { StringUtils } from "../util/StringUtils";

export class CalendarService {
  private formatToClubPracticeEvent(
    event: GoogleAppsScript.Calendar.CalendarEvent
  ): ClubPracticeEvent | null {
    const eventTitle = event.getTitle();
    const date: Date = new Date(event.getStartTime().getTime());
    const [shortenLocation, rest] = eventTitle.split(".", 2);
    if (!rest) return null;

    const re = /^([^\d]*?)(\d{3,4}-\d{3,4})\s+(.+?)\((.+?)\)$/;
    const m = rest.trim().match(re);
    if (!m) return null;
    const [, practiceType, timeRange, targetClasses, personInCharge] = m;

    const location = PRACTICE_LOCATIONS[shortenLocation];
    if (!location) return null;

    return {
      date,
      location,
      practiceType: practiceType.trim(),
      timeRange: timeRange.trim(),
      targetClasses,
      personInCharge: personInCharge.trim()
    };
  }

  private formatToExternalPracticeEvent(
    event: GoogleAppsScript.Calendar.CalendarEvent
  ): ExternalPracticeEvent | null {
    const eventTitle = event.getTitle();
    const date: Date = new Date(event.getStartTime().getTime());
    const location = event.getLocation();

    const re = /^(.+?)(\d{3,4}-\d{3,4})\s*([^:]+):(.+)$/;
    const m = eventTitle.trim().match(re);
    if (!m) return null;
    const [, title, timeRange, classStr, comment] = m;
    const targetClasses = StringUtils.formatKarutaClass(classStr);

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
  ): MatchEvent | null {
    const eventTitle = event.getTitle();
    const date: Date = new Date(event.getStartTime().getTime());
    const location = event.getLocation();

    const re = /^(.+?)([A-G]+)?$/u;
    const m = eventTitle.match(re);
    if (!m) return null;
    const [, title, classStr] = m;
    const targetClasses = StringUtils.formatKarutaClass(classStr);

    return {
      date,
      targetClasses,
      title,
      location,
      // mapUrl
    }
  }

  private formatToInternalDeadlineEvent(
    event: GoogleAppsScript.Calendar.CalendarEvent
  ): InternalDeadlineEvent | null {
    const eventTitle = event.getTitle();
    const date: Date = new Date(event.getStartTime().getTime());

    const [classStr, title] = eventTitle.slice(1).split("|", 2);
    if (!title) return null;

    const targetClasses = StringUtils.formatKarutaClass(classStr);

    return {
      date,
      targetClasses,
      title,
      isExternalPractice: title.includes('外部')
    }
  }

  public getClubPractices(
    start: Date, end: Date
  ): ClubPracticeEvent[] {
    const clubPracticeEvents = CalendarApp.getCalendarById(CalendarIds.clubPractice).getEvents(start, end);
    const rawclubPractices = clubPracticeEvents.map(ev => this.formatToClubPracticeEvent(ev));
    const clubPractices: ClubPracticeEvent[] = rawclubPractices.filter(
      (item): item is ClubPracticeEvent => item !== null
    );
    return clubPractices;
  }

  public getOuterPractices(
    start: Date, end: Date
  ): ExternalPracticeEvent[] {
    const outerPracticeEvents = CalendarApp.getCalendarById(CalendarIds.externalPractice).getEvents(start, end);
    const rawouterPractices = outerPracticeEvents.map(ev => this.formatToExternalPracticeEvent(ev));
    const outerPractices: ExternalPracticeEvent[] = rawouterPractices.filter(
      (item): item is ExternalPracticeEvent => item !== null
    );
    return outerPractices;
  }

  public getMatches(
    start: Date, end: Date
  ): MatchEvent[] {
    const matchEvents = CalendarApp.getCalendarById(CalendarIds.match).getEvents(start, end);
    const rawmatches = matchEvents.map(ev => this.formatToMatchEvent(ev));
    const matches: MatchEvent[] = rawmatches.filter(
      (item): item is MatchEvent => item !== null
    );
    return matches;
  }

  public getInternalDeadlines(
    start: Date, end: Date
  ): InternalDeadlineEvent[] {
    const internalDeadlineEvents = CalendarApp.getCalendarById(CalendarIds.internalDeadline).getEvents(start, end);
    const rawInternalDeadlines = internalDeadlineEvents.map(ev => this.formatToInternalDeadlineEvent(ev));
    const internalDeadlines: InternalDeadlineEvent[] = rawInternalDeadlines.filter(
      (item): item is InternalDeadlineEvent => item !== null
    );
    return internalDeadlines;
  }
}