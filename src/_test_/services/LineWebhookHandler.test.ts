import { LineWebhookHandler } from '../../services/LineWebhookHandler';
import { ExPracticeEvent } from '../../types/type';
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
      '日付：9/13',
      '時間：0900-1900',
      '練習名：和光練',
      '場所：和光市民館',
      '対象級：ABC/G以上',
      '〆切：8/20',
      '種別：和光練',
    ].join('\n');

    const result: { event: ExPracticeEvent; deadline: Date } = (
      handler as any
    ).parseExternalPractice(input);
    expect(result).not.toBeNull();
    expect(result.event.date).toEqual(dateA);
    expect(result.deadline).toEqual(dateB);
    expect(result.event.timeRange).toBe('0900-1900');
    expect(result.event.title).toBe('和光練');
    expect(result.event.targetClasses).toBe('ABC/G以上');
    expect(result.event.location).toBe('和光市民館');
    expect(result.event.category).toBe('和光練');
  });

  it('異常系: 必須フィールドが欠けていると null を返す', () => {
    const inputMissingTime = [
      '★外部練追加フォーマット★',
      '日付(例.9/13)：9/13',
      // '時間' 不記載
      '練習名(例.和光練)：和光練',
      '対象級(例.ABC/G以上)：ABC/G以上',
      '〆切(例.8/20)：8/20',
      '場所：和光市民館',
      '種別：和光練',
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
      '場所：和光市民館',
      '種別：和光練',
    ].join('\n');

    expect((handler as any).parseExternalPractice(inputBadDate)).toBeNull();
  });
});

describe('parseExternalPractice + category resolution', () => {
  const handler = new LineWebhookHandler() as any;
  const bodyHalf = [
    '★外部練追加フォーマット★',
    '日付： 9/13',
    '時間： 0900-1900',
    '練習名： 和光練',
    '場所： 和光市総合センター',
    '対象級： ABC',
    '〆切： 9/10',
    '種別： 合同練', // name 指定
  ].join('\n');

  it('parses with full-width colon', () => {
    const parsed = handler.parseExternalPractice(bodyHalf);
    expect(parsed).not.toBeNull();
    expect(parsed!.event.category).toBe('合同練');
  });

  it('resolves category by tag or name', () => {
    const cfgByName = handler.config.getByName('合同練');
    expect(cfgByName?.description).toMatch('山田さん');
  });
});
