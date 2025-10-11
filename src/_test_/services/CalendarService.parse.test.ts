import { CalendarService, EventType } from '../../services/CalendarService';
import { DateUtils } from '../../util/DateUtils';
import { StringUtils } from '../../util/StringUtils';
import Config from '../../config/config';
import { ClubPracticeEvent } from '../../types/type';

describe('CalendarService parser tests', () => {
  const start = new Date('2025-07-01T00:00:00');
  const end = new Date('2025-07-01T23:59:59');

  const makeEvent = (title: string, location: string, description = '') =>
    ({
      getTitle: () => title,
      getStartTime: () => start,
      getEndTime: () => end,
      getLocation: () => location,
      getDescription: () => description,
    } as unknown as GoogleAppsScript.Calendar.CalendarEvent);

  type ClubPracticeEventTypeKey = {
    practiceType: string;
    timeRange: string;
    targetClasses: string;
    personInCharge: string;
    description: string;
  };
  function checkClubPracticeParsing(title: string, expected: ClubPracticeEventTypeKey) {
    const service = new CalendarService() as any;
    const cfg = service.configs[EventType.ClubPractice];
    const ev = makeEvent(title, 'ほげほげ公民館');
    const m = ev.getTitle().match(cfg.regex);
    expect(m).not.toBeNull();

    const parsed = cfg.parser(m!, ev) as ClubPracticeEvent;
    expect(parsed.practiceType).toBe(expected.practiceType);
    expect(parsed.timeRange).toBe(expected.timeRange);
    expect(parsed.targetClasses).toBe(expected.targetClasses);
    expect(parsed.personInCharge).toBe(expected.personInCharge);
    expect(parsed.description).toContain(expected.description);
  }

  // --- ClubPractice --------------------------------------------------------
  it('parses ClubPractice correctly', () => {
    //基本
    checkClubPracticeParsing('富士見.基本1200-1345[G以上](田中)', {
      practiceType: '基本',
      timeRange: '1200-1345',
      targetClasses: 'G以上',
      personInCharge: '田中',
      description: '',
    });
    checkClubPracticeParsing('富士見.基本1200-1345[G以上](田中, 中田)', {
      practiceType: '基本',
      timeRange: '1200-1345',
      targetClasses: 'G以上',
      personInCharge: '田中, 中田',
      description: '',
    });
    checkClubPracticeParsing('富士見.基本1200-1345 [G以上](田中)', {
      practiceType: '基本',
      timeRange: '1200-1345',
      targetClasses: 'G以上',
      personInCharge: '田中',
      description: '',
    });
    checkClubPracticeParsing('富士見.基本1200-1345 [G以上](田中)', {
      practiceType: '基本',
      timeRange: '1200-1345',
      targetClasses: 'G以上',
      personInCharge: '田中',
      description: '',
    });
    checkClubPracticeParsing('富士見.基本1200-1345 G以上(田中,鈴木)※県大会対策', {
      practiceType: '基本',
      timeRange: '1200-1345',
      targetClasses: 'G以上',
      personInCharge: '田中,鈴木',
      description: '※県大会対策',
    });
    checkClubPracticeParsing('富士見.基本1200-1345 G以上', {
      practiceType: '基本',
      timeRange: '1200-1345',
      targetClasses: 'G以上',
      personInCharge: '',
      description: '',
    });
    checkClubPracticeParsing('富士見.基本1200-1345 全級', {
      practiceType: '基本',
      timeRange: '1200-1345',
      targetClasses: '全級',
      personInCharge: '',
      description: '',
    });
  });

  // --- ExternalPractice ----------------------------------------------------
  it('parses ExternalPractice correctly', () => {
    const service = new CalendarService() as any;
    const cfg = service.configs[EventType.ExternalPractice];
    const ev = makeEvent('千葉練0900-1600 E以上:10/10〆', '千葉公民館', '外部練習です');
    const m = ev.getTitle().match(cfg.regex);
    expect(m).not.toBeNull();

    const parsed = cfg.parser(m!, ev);
    expect(parsed.title).toBe('千葉練');
    expect(parsed.timeRange).toBe('0900-1600');
    expect(parsed.targetClasses).toContain('E');
    expect(parsed.deadline.getMonth() + 1).toBe(10); // 10月
  });

  // --- Match ---------------------------------------------------------------
  it('parses Match correctly', () => {
    const service = new CalendarService() as any;
    const cfg = service.configs[EventType.Match];
    const ev = makeEvent('全国選手権CDE', '東京体育館');
    const m = ev.getTitle().match(cfg.regex);
    expect(m).not.toBeNull();

    const parsed = cfg.parser(m!, ev);
    expect(parsed.title).toBe('全国選手権');
    expect(parsed.targetClasses).toContain('C');
    expect(parsed.location).toBe('東京体育館');
  });

  // --- InternalDeadline ----------------------------------------------------
  it('parses InternalDeadline correctly', () => {
    const service = new CalendarService() as any;
    const cfg = service.configs[EventType.InternalDeadline];
    const ev = makeEvent('〆E|府中大会', '');
    const m = ev.getTitle().match(cfg.regex);
    expect(m).not.toBeNull();

    const parsed = cfg.parser(m!, ev);
    expect(parsed.targetClasses).toContain('E');
    expect(parsed.title).toBe('府中大会');
    expect(parsed.isMatch).toBe(true);
  });
});
