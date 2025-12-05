import { ReserveCsvMailHandler } from '../../mailHandlers/ReserveCsvMailHandler';

// const MAIL_BODY = `日付, 曜日, 館名, 状態, 時間帯, 予約ID
// 2025/11/30, 日, 常盤, 予約, 13:00-17:00 18:00-21:30, 常盤ID
// 2025/11/30, 日, 岸町, キャンセル, 13:00-17:00 18:00-21:30, 岸町ID
// 2025/12/06, 土, 上落合, 予約, 13:00-15:00 15:00-17:00 18:00-21:30, 上落合ID
// 2025/12/07, 日, 常盤, 予約, 13:00-17:00 18:00-21:30, 常盤ID
// 2025/12/07, 日, 指扇, 予約, 13:00-17:00 18:00-21:30, 指扇ID
// 2025/12/07, 日, 別所, キャンセル, 13:00-17:00, 別所ID`;

// describe('ReserveCsvMailHandler.buildLineNotice(mailBody)', () => {
//   const reserveCsvMailHandler = new ReserveCsvMailHandler();
//   const text = reserveCsvMailHandler['buildLineNotice'](MAIL_BODY);

//   expect(text).toBe(`11/30日, 13-21.5, 常盤, 常盤ID
// 12/06土, 13-21.5, 上落合, 上落合ID
// 12/07日, 13-21.5, 常盤, 常盤ID
// 12/07日, 13-21.5, 指扇, 指扇ID`
//   );
// });

describe('ReserveCsvMailHandler.buildLineNotice', () => {
  const handler = new ReserveCsvMailHandler() as any; // private呼べるように any

  test('最も簡単なパターン', () => {
    const mailBody = [
      '日付,曜日,時間帯,館名,予約ID,状態',
      '2025/01/04,土,9:00-12:00,会場A,ID010,予約',
    ].join('\n');

    const out = handler.buildLineNotice(mailBody);

    expect(out).toContain('01/04土,9-12,会場A,ID010');
    expect(out).not.toContain('12:00');
    expect(out).not.toContain('13:00');
  });

  test('予約状態の行だけを抽出し、正しくフォーマットする', () => {
    const mailBody = [
      '日付,曜日,時間帯,館名,予約ID,状態',
      '2025/01/02,木,9:00-12:00,上落合,ID001,予約',
      '2025/01/02,木,13:00-15:00,針ヶ谷,ID002,取消',
      '2025/01/03,金,17:00-21:30,富士見,ID003,予約',
    ].join('\n');

    const out = handler.buildLineNotice(mailBody);

    expect(out).toEqual(['01/02木,9-12,上落合,ID001', '01/03金,17-21.5,富士見,ID003'].join('\n'));
  });

  test('予約が 1 件もないときは空文字が返る', () => {
    const mailBody = [
      '日付,曜日,時間帯,館名,予約ID,状態',
      '2025/01/02,木,9:00-12:00,上落合,ID001,取消',
    ].join('\n');

    const out = handler.buildLineNotice(mailBody);

    expect(out).toBe('');
  });

  test('時間抽出の確認', () => {
    const mailBody = [
      '日付,曜日,時間帯,館名,予約ID,状態',
      '2025/01/02,木,13:00-17:00 18:00-21:30,上落合,ID001,予約',
      '2025/01/03,金,13:00-15:00 15:00-17:00 18:00-21:30,針ヶ谷,ID002,予約',
      '2025/01/04,土,9:00-12:00 13:00-17:00,富士見,ID003,予約',
      '2025/01/04,土,9:00-12:00 13:00-17:00 18:00-21:30,針ヶ谷,ID004,予約',
    ].join('\n');

    const out = handler.buildLineNotice(mailBody).split('\n');

    expect(out[0]).toBe('01/02木,13-21.5,上落合,ID001');
    expect(out[1]).toBe('01/03金,13-21.5,針ヶ谷,ID002');
    expect(out[2]).toBe('01/04土,9-17,富士見,ID003');
    expect(out[3]).toBe('01/04土,9-21.5,針ヶ谷,ID004');
  });

  test('空白入CSV', () => {
    const mailBody = [
      '日付, 曜日, 時間帯, 館名, 予約ID, 状態',
      '2025/01/02, 木, 13:00-17:00 18:00-21:30, 上落合, ID001, 予約',
      '2025/01/03, 金, 13:00-15:00 15:00-17:00 18:00-21:30, 針ヶ谷, ID002, 予約',
      '2025/01/04, 土, 9:00-12:00 13:00-17:00, 富士見, ID003, 予約',
      '2025/01/04, 土, 9:00-12:00 13:00-17:00 18:00-21:30, 針ヶ谷, ID004, 予約',
    ].join('\n');

    const out = handler.buildLineNotice(mailBody).split('\n');

    expect(out[0]).toBe('01/02木,13-21.5,上落合,ID001');
    expect(out[1]).toBe('01/03金,13-21.5,針ヶ谷,ID002');
    expect(out[2]).toBe('01/04土,9-17,富士見,ID003');
    expect(out[3]).toBe('01/04土,9-21.5,針ヶ谷,ID004');
  });
});

describe('ReserveCsvMailHandler.formatSchedule', () => {
  const handler = new ReserveCsvMailHandler() as any; // private呼べるように any

  test('日付ごとにグルーピングして整形する', () => {
    const text = [
      '01/02木,13-21.5,上落合,ID001',
      '01/03金,13-21.5,針ヶ谷,ID002',
      '01/04土,9-17,富士見,ID003',
      '01/04土,9-21.5,針ヶ谷,ID004',
    ].join('\n');

    const out = handler.formatSchedule(text);

    expect(out).toBe(
      [
        '01/02木',
        '・上落合 13-21.5 (ID001)',
        '',
        '01/03金',
        '・針ヶ谷 13-21.5 (ID002)',
        '',
        '01/04土',
        '・富士見 9-17 (ID003)',
        '・針ヶ谷 9-21.5 (ID004)',
      ].join('\n')
    );
  });
});

