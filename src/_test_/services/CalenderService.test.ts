import { CalendarService, EventType } from '../../services/CalendarService';
import { ClubPracticeEvent, ExPracticeEvent, InternalDeadlineEvent } from '../../types/type';
import { jstDate, resetStore } from '../../_test_/setup.gas';
import { StringUtils } from '../../util/StringUtils';
import { DateUtils } from '../../util/DateUtils';

describe('CalendarService#get in JST', () => {
  let service: CalendarService;

  beforeEach(() => {
    resetStore();
    service = new CalendarService();
  });

  it('parses ClubPractice events correctly', () => {
    const calendarId = 'dummy_club_calendar';
    const start = jstDate('2025-07-01T00:00:00');
    const end = DateUtils.addDays(start, 1);

    const fakeEvent = {
      getTitle: () => `富士見1200-1345(田中)`,
      getStartTime: () => start,
      getEndTime: () => end,
      getLocation: () => '富士見公民館',
    } as unknown as GoogleAppsScript.Calendar.CalendarEvent;

    (global as any).__setCalendarEvents(calendarId, () => [fakeEvent]);
    (service as any).configs.clubPractice.calendarId = calendarId;

    const result = service.get(EventType.ClubPractice, start, end);

    expect(result).toHaveLength(1);
    const ev = result[0] as ClubPracticeEvent;

    expect(ev.date.getTime()).toBe(start.getTime());
    expect(ev.timeRange).toBe('1200-1345');
    expect(ev.targetClasses).toBe('全級');
    expect(ev.personInCharge).toBe('田中');
    expect(ev.location.shortName).toBe('富士見');
  });

  it('ignores unparsable event titles', () => {
    const calendarId = 'dummy_club_calendar';
    const badTitle = `これはマッチしないタイトル`;

    const fakeEvent = {
      getTitle: () => badTitle,
      getStartTime: () => jstDate('2025-07-01T12:00:00'),
      getEndTime: () => jstDate('2025-07-01T13:00:00'),
      getLocation: () => '',
    } as unknown as GoogleAppsScript.Calendar.CalendarEvent;

    (global as any).__setCalendarEvents(calendarId, () => [fakeEvent]);
    (service as any).configs.clubPractice.calendarId = calendarId;

    const result = service.get(
      EventType.ClubPractice,
      jstDate('2025-07-01T00:00:00'),
      jstDate('2025-07-02T00:00:00')
    );
    expect(result).toHaveLength(0);
  });

  it('parses externalPractice events correctly', () => {
    const calendarId = 'dummy_external_calendar';
    const start = jstDate('2025-07-11T00:00:00');
    const end = DateUtils.addDays(start, 1);
    const fakeEvent = {
      getTitle: () => `交流会1400-1500 AB:12/1〆コメント内容`,
      getStartTime: () => start,
      getEndTime: () => end,
      getLocation: () => '外部公民館',
      getDescription: () => '',
    } as unknown as GoogleAppsScript.Calendar.CalendarEvent;

    (global as any).__setCalendarEvents(calendarId, () => [fakeEvent]);
    (service as any).configs.externalPractice.calendarId = calendarId;

    const result = service.get(EventType.ExternalPractice, start, end);

    expect(result).toHaveLength(1);
    const ev = result[0] as ExPracticeEvent;

    expect(ev.date.getTime()).toBe(start.getTime());
    expect(ev.title).toBe('交流会');
    expect(ev.timeRange).toBe('1400-1500');
    expect(ev.targetClasses).toEqual(StringUtils.formatStrictKarutaClass('AB'));
    expect(ev.location).toBe('外部公民館');
  });

  it('parses match events with and without classes correctly', () => {
    const calendarId = 'dummy_match_calendar';
    const today = jstDate('2025-07-11T00:00:00');
    const tomorrow = DateUtils.addDays(today, 1);
    const fakeEvent = {
      getTitle: () => `大会名CD`,
      getStartTime: () => today,
      getEndTime: () => tomorrow,
      getLocation: () => '場所A',
      getDescription: () => '',
    } as unknown as GoogleAppsScript.Calendar.CalendarEvent;

    (global as any).__setCalendarEvents(calendarId, () => [fakeEvent]);
    (service as any).configs.match.calendarId = calendarId;

    const result = service.get(EventType.Match, today, tomorrow);
    expect(result).toHaveLength(1);

    const ev1 = result.find((e) => e.title === '大会名')!;
    expect(ev1.targetClasses).toEqual(StringUtils.formatStrictKarutaClass('CD'));
  });
  it('parses match events with and without classes correctly', () => {
    const calendarId = 'dummy_match_calendar';
    const today = jstDate('2025-07-11T00:00:00');
    const tomorrow = DateUtils.addDays(today, 1);
    const nextweek = DateUtils.addDays(today, 7);
    const nextweekAddOne = DateUtils.addDays(today, 8);
    const fakeEvent = {
      getTitle: () => `大会名CD`,
      getStartTime: () => today,
      getEndTime: () => tomorrow,
      getLocation: () => '場所A',
      getDescription: () => '',
    } as unknown as GoogleAppsScript.Calendar.CalendarEvent;
    const fakeEvent2 = {
      getTitle: () => `別大会`,
      getStartTime: () => nextweek,
      getEndTime: () => nextweekAddOne,
      getLocation: () => '場所B',
      getDescription: () => '',
    } as unknown as GoogleAppsScript.Calendar.CalendarEvent;

    (global as any).__setCalendarEvents(calendarId, () => [fakeEvent, fakeEvent2]);
    (service as any).configs.match.calendarId = calendarId;

    const result = service.get(EventType.Match, today, nextweekAddOne);
    expect(result).toHaveLength(2);

    const ev1 = result.find((e) => e.title === '大会名')!;
    expect(ev1.targetClasses).toEqual(StringUtils.formatStrictKarutaClass('CD'));
    const ev2 = result.find((e) => e.title === '別大会')!;
    expect(ev2.targetClasses).toEqual(StringUtils.formatKarutaClass(''));
  });

  it('parses internalDeadline events correctly', () => {
    const calendarId = 'dummy_internal_deadline_calendar';
    const start = jstDate('2025-07-14T00:00:00');
    const end = DateUtils.addDays(start, 1);
    const fakeEvent = {
      getTitle: () => `〆ABCDE|埼玉ぱるこ10/26ABCDE`,
      getStartTime: () => start,
      getEndTime: () => end,
      getLocation: () => '外部公民館',
    } as unknown as GoogleAppsScript.Calendar.CalendarEvent;

    (global as any).__setCalendarEvents(calendarId, () => [fakeEvent]);
    (service as any).configs.internalDeadline.calendarId = calendarId;

    const result = service.get(EventType.InternalDeadline, start, end);
    expect(result).toHaveLength(1);
    const ev = result[0] as InternalDeadlineEvent;
    expect(ev.targetClasses).toEqual(StringUtils.formatStrictKarutaClass('ABCDE'));
    expect(ev.title).toBe('埼玉ぱるこ10/26ABCDE');
  });

  it('respects [start, end) window on getEvents', () => {
    const id = 'dummy_match_calendar';
    const start = jstDate('2025-07-11T00:00:00'); // 含む
    const end = jstDate('2025-07-12T00:00:00'); // 含まない

    const evAtStart = {
      getTitle: () => 'A',
      getStartTime: () => start,
      getEndTime: () => end,
      getLocation: () => '',
      getDescription: () => '',
    } as unknown as GoogleAppsScript.Calendar.CalendarEvent;
    const evAtEnd = {
      getTitle: () => 'B',
      getStartTime: () => end,
      getEndTime: () => DateUtils.addDays(end, 1),
      getLocation: () => '',
      getDescription: () => '',
    } as unknown as GoogleAppsScript.Calendar.CalendarEvent;

    (global as any).__setCalendarEvents(id, () => [evAtStart, evAtEnd]);
    (service as any).configs.match.calendarId = id;

    const result = service.get(EventType.Match, start, end);
    expect(result.map((e) => e.title)).toEqual(['A']); // end ちょうどは除外
  });

  it('clubPractice rejects unknown short location', () => {
    const id = 'dummy_club_calendar';
    const s = jstDate('2025-07-01T00:00:00'),
      e = DateUtils.addDays(s, 1);
    const fake = {
      getTitle: () => `未知1200-1345(山田)`,
      getStartTime: () => s,
      getEndTime: () => e,
      getLocation: () => '',
    } as unknown as GoogleAppsScript.Calendar.CalendarEvent;

    (global as any).__setCalendarEvents(id, () => [fake]);
    (service as any).configs.clubPractice.calendarId = id;

    const res = service.get(EventType.ClubPractice, s, e);
    expect(res).toHaveLength(1);
  });

  it('externalPractice rejects title without colon', () => {
    const id = 'dummy_external_calendar';
    const s = jstDate('2025-07-11T00:00:00'),
      e = DateUtils.addDays(s, 1);
    const fake = {
      getTitle: () => `交流会1400-1500 AB コメントなし`,
      getStartTime: () => s,
      getEndTime: () => e,
      getLocation: () => '',
      getDescription: () => '',
    } as unknown as GoogleAppsScript.Calendar.CalendarEvent;

    (global as any).__setCalendarEvents(id, () => [fake]);
    (service as any).configs.externalPractice.calendarId = id;

    const res = service.get(EventType.ExternalPractice, s, e);
    expect(res).toHaveLength(0);
  });
  it('match without classes yields empty classes', () => {
    const id = 'dummy_match_calendar';
    const s = jstDate('2025-07-11T00:00:00'),
      e = DateUtils.addDays(s, 1);
    const fake = {
      getTitle: () => `別大会`,
      getStartTime: () => s,
      getEndTime: () => e,
      getLocation: () => '',
      getDescription: () => '',
    } as unknown as GoogleAppsScript.Calendar.CalendarEvent;

    (global as any).__setCalendarEvents(id, () => [fake]);
    (service as any).configs.match.calendarId = id;

    const res = service.get(EventType.Match, s, e);
    expect(res[0].targetClasses).toEqual(StringUtils.formatKarutaClass('')); // "" 想定
  });

  it('groupAndSortPractices with unparsable time ', () => {
    const mk = (d: string, tr: string) =>
      ({
        date: jstDate(d),
        timeRange: tr,
        location: {
          name: '常盤公民館',
          shortName: '常盤',
          nearestStation: '北浦和駅',
          walkMinutes: '5分',
          line: '京浜東北線',
          mapUrl: 'https://example.com',
          clubName: 'test_club',
          capacityOfPairs: "12"
        },
        practiceType: '基本',
        targetClasses: 'A',
        personInCharge: 'X',
        description: '',
      } as ClubPracticeEvent);

    const input = [mk('2025-07-01T09:00:00', '0900-1000'), mk('2025-07-01T10:00:00', 'bad')];
    const grouped = CalendarService.groupAndSortPractices(input);
    const list = [...grouped.values()][0];
    expect(list.map((e) => e.timeRange)).toEqual(['0900-1000']);
  });
});
