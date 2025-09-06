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
  ["ATTENDANCE_ADDRESS", "xxx"],
  ['RESERVE_KAMIOCHIAI_ADDRESS', 'xxx'],
  ['RESERVE_KISHICHO_ADDRESS', 'xxx'],
  ['RESERVE_BESSHO_ADDRESS', 'xxx'],
  ['RESERVE_SASHIOUGI_ADDRESS', 'xxx'],
  ['RESERVE_TOKIWA_ADDRESS', 'xxx'],

  ['CHOUSEISAN_URLS', JSON.stringify({ A: 'urlA', B: 'urlB' })],
  ['CHOUSEISAN_CSVS', JSON.stringify({ A: 'csvA', B: 'csvB' })],
  ['PRACTICE_LOCATIONS', JSON.stringify({
    '富士見': {
      clubName: 'ちはやふる富士見',
      mapUrl: 'https://example.com/map',
      buildingName: '富士見公民館',
      shortenBuildingName: '富士見'
    }
  })],
]);

// Minimal GAS mocks
// eslint-disable-next-line @typescript-eslint/no-explicit-any
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


// 使う可能性がある最低限のダミー
(global as any).Utilities = {
  getUuid: () => '00000000-0000-0000-0000-000000000000',
};
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(global as any).UrlFetchApp = { fetch: () => ({ getResponseCode: () => 200, getContentText: () => '' }) };
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(global as any).GmailApp = { search: () => [], getUserLabelByName: () => null };

// CalendarApp
type FakeEvent = {
  getTitle: () => string;
  getStartTime: () => Date;
  getEndTime: () => Date;
  getDescription?: () => string;
  getLocation?: () => string;
};

// 既定は「空配列を返す」ダミー。各テストで上書き可能にする。
let eventsProvider: () => FakeEvent[] = () => [];

// テストから eventsProvider を差し替えたい場合用のフック（必要なら使ってください）
// eslint-disable-next-line @typescript-eslint/no-explicit-any
;(global as any).__setCalendarEvents = (fn: () => FakeEvent[]) => { eventsProvider = fn; };

// eslint-disable-next-line @typescript-eslint/no-explicit-any
;(global as any).CalendarApp = {
  getCalendarById: (_id: string) => ({
    getEvents: (_start: Date, _end: Date) => eventsProvider(),
  }),
};