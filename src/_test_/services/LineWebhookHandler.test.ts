// —————— ここを一番上に追加 ——————
/**
 * GAS 環境のモック
 */
; (global as any).PropertiesService = {
  getScriptProperties: () => ({
    getProperty: (key: string) => {
      switch (key) {
        case 'LINE_CHANNEL_TOKEN': return 'dummy_token'
        case "LINE_CHANNEL_ACCESS_TOKEN": return "xxx"
        case "LINE_USER_ID_MAINTAINER": return "xxx"
        case "LINE_GROUP_ID_TAIKAI_MOUSHIKOMI": return "xxx"
        case "LINE_GROUP_ID_UNNEI_HOMBU": return "xxx"
        case "LINE_GROUP_ID_UNNEI_SHIFT": return "xxx"
        case "LINE_GROUP_ID_ZENTAI": return "xxx"
        case "LINE_GROUP_ID_TEST": return "xxx"
        case "GOOGLE_CALENDAR_ID_TAIKAI": return "xxx"
        case "GOOGLE_CALENDAR_ID_KAIRENSHU": return "xxx"
        case "GOOGLE_CALENDAR_ID_KAISHIME": return "xxx"
        case "GOOGLE_CALENDAR_ID_HONSHIME": return "xxx"
        case "GOOGLE_CALENDAR_ID_OUTER": return "xxx"
        case "DRIVE_URL": return "xxx"
        case "CALENDAR_URL": return "xxx"
        case "ATTENDANCE_ADDRESS": return "xxx"
        case 'CHOUSEISAN_URLS':
          return `{
  "A": "https://example.com/",
  "B": "https://example.com/",
  "C": "https://example.com/",
  "D": "https://example.com/",
  "E": "https://example.com/",
  "F": "https://example.com/",
  "G": "https://example.com/"
}`;
        case 'CHOUSEISAN_CSVS':
          return `{
  "A": "https://example.com/",
  "B": "https://example.com/",
  "C": "https://example.com/",
  "D": "https://example.com/",
  "E": "https://example.com/",
  "F": "https://example.com/",
  "G": "https://example.com/"
}`;
        case "PRACTICE_LOCATIONS": return `{
        "神社":{
          "clubName": "ちはやふる富士見",
          "mapUrl": "https://maps.app.goo.gl/T96oux6vfJAtBQWNA",
          "buildingName": "針ケ谷氷川神社 社務所 (東武東上線 みずほ台駅15分)",
          "shortenBuildingName": "神社"
      }}`;
        default:
          return ''
      }
    }
  })
}

  // 必要に応じて他の GAS サービスもモック
  ; (global as any).ContentService = {
    createTextOutput: (s: string) => ({
      setMimeType: (_: any) => ({ /* chain ok */ })
    })
  }

import { LineWebhookHandler } from '../../services/LineWebhookHandler';
import { DateUtils } from '../../util/DateUtils';

describe('LineWebhookHandler.parseExternalPractice', () => {
  const handler = new LineWebhookHandler();

  // DateUtils.parseMD をモックして固定の Date を返す
  let parseMDSpy: jest.SpyInstance;
  const dateA = new Date(2025, 8, 13); // 2025-09-13
  const dateB = new Date(2025, 7, 20); // 2025-08-20

  beforeAll(() => {
    parseMDSpy = jest.spyOn(DateUtils, 'parseMD').mockImplementation((md: string) => {
      if (md === '9/13') return dateA;
      if (md === '8/20') return dateB;
      throw new Error(`Unexpected parseMD input: ${md}`);
    });
  });

  afterAll(() => {
    parseMDSpy.mockRestore();
  });

  it('正常系: フォーマット通りのテキストが渡されたら値オブジェクトを返す', () => {
    const input = [
      '★外部練追加フォーマット★',
      '日付(例.9/13)：9/13',
      '時間(例.0900-1900)：0900-1900',
      '練習名(例.和光練)：和光練',
      '対象級(例.ABC/G以上)：ABC/G以上',
      '〆切(例.8/20)：8/20',
      '場所：和光市民館'
    ].join('\n');

    const result = (handler as any).parseExternalPractice(input);
    expect(result).not.toBeNull();
    expect((result as any).date).toEqual(dateA);
    expect((result as any).start).toEqual(dateA);
    expect((result as any).end).toEqual(dateA);
    expect((result as any).deadline).toEqual(dateB);
    expect((result as any).timeRange).toBe('0900-1900');
    expect((result as any).practiceName).toBe('和光練');
    expect((result as any).targetClasses).toBe('ABC/G以上');
    expect((result as any).location).toBe('和光市民館');
  });

  it('異常系: 必須フィールドが欠けていると null を返す', () => {
    const inputMissingTime = [
      '★外部練追加フォーマット★',
      '日付(例.9/13)：9/13',
      // '時間' 不記載
      '練習名(例.和光練)：和光練',
      '対象級(例.ABC/G以上)：ABC/G以上',
      '〆切(例.8/20)：8/20',
      '場所：和光市民館'
    ].join('\n');

    expect((handler as any).parseExternalPractice(inputMissingTime)).toBeNull();
  });

  it('異常系: 日付フォーマットが不正なら null を返す', () => {
    // parseMD が throw するような文字列
    const inputBadDate = [
      '★外部練追加フォーマット★',
      '日付(例.9/13)：2025/09/13',
      '時間(例.0900-1900)：0900-1900',
      '練習名(例.和光練)：和光練',
      '対象級(例.ABC/G以上)：ABC/G以上',
      '〆切(例.8/20)：8/20',
      '場所：和光市民館'
    ].join('\n');

    expect((handler as any).parseExternalPractice(inputBadDate)).toBeNull();
  });
});
