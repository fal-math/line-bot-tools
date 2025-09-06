// Jest 起動時に一度ロードされる GAS 風モック
const store = new Map<string, string>([
  ['DEBUG_MODE', 'xxx'],
  ['LINE_CHANNEL_ACCESS_TOKEN', 'xxx'],
  ['LINE_USER_ID_T', 'xxx'],
  ['LINE_USER_ID_F', 'xxx'],
  ['LINE_USER_ID_I', 'xxx'],
  ['LINE_USER_ID_K', 'xxx'],
  ['LINE_GROUP_ID_TAIKAI_MOUSHIKOMI', 'xxx'],
  ['LINE_GROUP_ID_UNNEI_HOMBU', 'xxx'],
  ['LINE_GROUP_ID_UNNEI_SHIFT', 'xxx'],
  ['LINE_GROUP_ID_ZENTAI', 'xxx'],
  ['LINE_GROUP_ID_RESERVE', 'xxx'],
  ['LINE_GROUP_ID_TEST', 'xxx'],
  ['GOOGLE_CALENDAR_ID_TAIKAI', 'xxx'],
  ['GOOGLE_CALENDAR_ID_KAIRENSHU', 'xxx'],
  ['GOOGLE_CALENDAR_ID_KAISHIME', 'xxx'],
  ['GOOGLE_CALENDAR_ID_HONSHIME', 'xxx'],
  ['GOOGLE_CALENDAR_ID_OUTER', 'xxx'],
  ['DRIVE_URL', 'xxx'],
  ['CALENDAR_URL', 'xxx'],
  ['SPREADSHEET_ID', 'xxx'],
  ['MANAGERS_PORTAL_URL', 'xxx'],
  ['ATTENDANCE_ADDRESS', 'xxx'],
  ['RESERVE_KAMIOCHIAI_ADDRESS', 'xxx'],
  ['RESERVE_KISHICHO_ADDRESS', 'xxx'],
  ['RESERVE_BESSHO_ADDRESS', 'xxx'],
  ['RESERVE_SASHIOUGI_ADDRESS', 'xxx'],
  ['RESERVE_TOKIWA_ADDRESS', 'xxx'],

  ['CHOUSEISAN_URLS', JSON.stringify({ A: 'urlA', B: 'urlB' })],
  ['CHOUSEISAN_CSVS', JSON.stringify({ A: 'csvA', B: 'csvB' })],
  [
    'PRACTICE_LOCATIONS',
    JSON.stringify({
      富士見: {
        clubName: 'ちはやふる富士見',
        mapUrl: 'https://example.com/map',
        buildingName: '富士見公民館',
        shortenBuildingName: '富士見',
      },
    }),
  ],
]);

export const resetStore = () => store.clear();

export const setStore = (entries: [string, string][]) => {
  entries.forEach(([k, v]) => store.set(k, v));
};

// ScriptProperties モック
(global as any).PropertiesService = {
  getScriptProperties() {
    return {
      getProperty: (k: string) => store.get(k) ?? null,
      setProperty: (k: string, v: string) => void store.set(k, v),
      setProperties: (obj: Record<string, string>) => {
        Object.entries(obj).forEach(([k, v]) => store.set(k, v));
      },
    };
  },
};

// Utilities モック
(global as any).Utilities = {
  getUuid: () => '00000000-0000-0000-0000-000000000000',
};

// UrlFetchApp モック
(global as any).UrlFetchApp = {
  fetch: jest.fn().mockReturnValue({
    getResponseCode: () => 200,
    getContentText: () => '',
  }),
};

// GmailApp モック
(global as any).GmailApp = {
  search: jest.fn().mockReturnValue([]),
  getUserLabelByName: jest.fn().mockReturnValue(null),
};

// ===================================================================================
// CalendarApp モック
// ===================================================================================

export type FakeEvent = {
  getTitle: () => string;
  getStartTime: () => Date;
  getEndTime: () => Date;
  getLocation: () => string;
  getDescription?: () => string;
  isAllDayEvent?: () => boolean;
  getTag?: () => string;
};

const calendarEventsMap: Record<string, () => FakeEvent[]> = {};

/**
 * 特定の Calendar ID にイベントリスト（関数）を割り当てる
 */
(global as any).__setCalendarEvents = (id: string, fn: () => FakeEvent[]) => {
  calendarEventsMap[id] = fn;
};

/**
 * CalendarApp.getCalendarById().getEvents(start, end) のモック
 */
(global as any).CalendarApp = {
  getCalendarById: (id: string) => ({
    getEvents: (start: Date, end: Date) => {
      const all = calendarEventsMap[id]?.() ?? [];
      return all.filter((ev) => {
        const s = ev.getStartTime();
        return s >= start && s < end; // [start, end)
      });
    },
  }),
};

export const jstDate = (s: string) => new Date(s.replace('Z', '') + '+09:00');
