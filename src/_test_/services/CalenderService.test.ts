// import { CalendarIds, PRACTICE_LOCATIONS } from "../../config";
// import { CalendarService, EventType } from "../../services/CalendarService";
// import { StringUtils } from "../../util/StringUtils";

// describe("CalendarService#getEvents", () => {
//   let service: CalendarService;
//   const mockEvent = (title: string, location: string, start: Date) => ({
//     getTitle: () => title,
//     getLocation: () => location,
//     getStartTime: () => start,
//   } as any);

//   beforeEach(() => {
//     service = new CalendarService();
//     (global as any).CalendarApp = {
//       getCalendarById: jest.fn().mockImplementation(id => ({
//         getEvents: (_start: Date, _end: Date) => eventsMap[id] || []
//       })),
//     };
//   });

//   afterEach(() => {
//     jest.resetAllMocks();
//   });

//   const eventsMap: Record<string, any[]> = {};

//   it("parses clubPractice events correctly", () => {
//     const title = `Jinja.基本 1200-1345 G(田中)`;
//     eventsMap[CalendarIds.clubPractice] = [mockEvent(title, "ignored", new Date("2025-07-10T12:00:00"))];

//     const result = service.getEvents(EventType.ClubPractice, new Date("2025-07-01"), new Date("2025-07-31"));
//     expect(result).toHaveLength(1);
//     const ev = result[0];
//     expect(ev.location).toBe(PRACTICE_LOCATIONS["Jinja"]);
//     expect(ev.practiceType).toBe("基本");
//     expect(ev.timeRange).toBe("1200-1345");
//     expect(ev.targetClasses).toBe("G");
//     expect(ev.personInCharge).toBe("田中");
//   });

//   it("parses externalPractice events correctly", () => {
//     const title = `交流会1400-1500 AB:コメント内容`;
//     eventsMap[CalendarIds.externalPractice] = [mockEvent(title, "外部場所", new Date("2025-07-11T14:00:00"))];

//     const result = service.getEvents(EventType.ExternalPractice, new Date(), new Date());
//     expect(result).toHaveLength(1);
//     const ev = result[0];
//     expect(ev.title).toBe("交流会");
//     expect(ev.timeRange).toBe("1400-1500");
//     expect(ev.targetClasses).toEqual(StringUtils.formatKarutaClass("AB"));
//     expect(ev.location).toBe("外部場所");
//   });

//   it("parses match events with and without classes correctly", () => {
//     const titleWith = `大会名CD`;
//     const titleWithout = `別大会`;
//     eventsMap[CalendarIds.match] = [
//       mockEvent(titleWith, "場所A", new Date("2025-07-12T09:00:00")),
//       mockEvent(titleWithout, "場所B", new Date("2025-07-13T10:00:00")),
//     ];

//     const result = service.getEvents(EventType.Match, new Date(), new Date());
//     expect(result).toHaveLength(2);
//     const ev1 = result.find(e => e.title === "大会名")!;
//     expect(ev1.targetClasses).toEqual(StringUtils.formatKarutaClass("CD"));
//     const ev2 = result.find(e => e.title === "別大会")!;
//     expect(ev2.targetClasses).toEqual(StringUtils.formatKarutaClass(""));
//   });

//   it("parses internalDeadline events correctly", () => {
//     const title = `[EF]|締切イベント外部`;
//     eventsMap[CalendarIds.internalDeadline] = [mockEvent(title, "ignored", new Date("2025-07-14T00:00:00"))];

//     const result = service.getEvents(EventType.InternalDeadline, new Date(), new Date());
//     expect(result).toHaveLength(1);
//     const ev = result[0];
//     expect(ev.targetClasses).toEqual(StringUtils.formatKarutaClass("EF"));
//     expect(ev.title).toBe("締切イベント外部");
//     expect(ev.isExternalPractice).toBe(true);
//   });
// });
