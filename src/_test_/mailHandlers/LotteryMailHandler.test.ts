import { LotteryMailHandler } from '../../mailHandlers/LotteryMailHandler';
import { LotteryMail } from '../../types/type';

const MAIL_BODY_LOSE= `
<!--banner-info-->
This email was sent to a1q497f2@anonaddy.com (00296129) from info@rsv.ws-scs.jp.
To deactivate this alias copy and paste the url below into your web browser.

https://app.addy.io/deactivate/1e1a4a5e-f167-48e5-96c0-43e75d9b5869?signature=ac945d3e674aafc13aaeb0da9fdae14d853056c831bedfedda0a9532732b3786
<!--banner-info-->

さいたま市公共施設予約システム

※このメールは発信専用です。返信はご遠慮ください。

下記の抽選申込みの結果をお知らせします。　※屋内スポーツ施設・屋外スポーツ施設・保養施設・その他施設の抽選申込みで当選した方は、確認期間内に、システム上で利用確定の操作が必要です。（公民館は確定の操作は不要です。コミュニティ施設・文化施設は確定の操作は不要ですが、コロナ渦の当面の対応として、事前来館手続きについて変更がある場合がございますので、予約システムの各施設区分のお知らせ画面をご確認ください。）ご注意ください。

■利用者番号     ：00296129
■利用者名       ：埼玉歌留多練様

■抽選結果       ：落選
■受付日         ：2025/11/01(土)
■申込番号       ：1
■希望番号       ：3
■分類           ：公民館
■利用館         ：指扇公民館
■利用施設       ：和室（３０人）
■利用日         ：2026/02/08(日)
■利用時間       ：09:00-12:00
■利用目的       ：かるた・百人一首
■面数           ：1
■催物名         ：競技かるたの練習

■抽選結果       ：落選
■受付日         ：2025/11/01(土)
■申込番号       ：2
■希望番号       ：3
■分類           ：公民館
■利用館         ：指扇公民館
■利用施設       ：和室（３０人）
■利用日         ：2026/02/08(日)
■利用時間       ：09:00-12:00
■利用目的       ：かるた・百人一首
■面数           ：1
■催物名         ：競技かるたの練習

■抽選結果       ：落選
■受付日         ：2025/11/01(土)
■申込番号       ：1
■希望番号       ：1
■分類           ：公民館
■利用館         ：指扇公民館
■利用施設       ：和室（３０人）
■利用日         ：2026/02/08(日)
■利用時間       ：13:00-17:00
■利用目的       ：かるた・百人一首
■面数           ：1
■催物名         ：競技かるたの練習

■抽選結果       ：落選
■受付日         ：2025/11/01(土)
■申込番号       ：3
■希望番号       ：1
■分類           ：公民館
■利用館         ：指扇公民館
■利用施設       ：和室（３０人）
■利用日         ：2026/02/08(日)
■利用時間       ：13:00-17:00
■利用目的       ：かるた・百人一首
■面数           ：1
■催物名         ：競技かるたの練習

■抽選結果       ：落選
■受付日         ：2025/11/01(土)
■申込番号       ：2
■希望番号       ：2
■分類           ：公民館
■利用館         ：指扇公民館
■利用施設       ：和室（３０人）
■利用日         ：2026/02/08(日)
■利用時間       ：18:00-21:30
■利用目的       ：かるた・百人一首
■面数           ：1
■催物名         ：競技かるたの練習

■抽選結果       ：落選
■受付日         ：2025/11/01(土)
■申込番号       ：3
■希望番号       ：2
■分類           ：公民館
■利用館         ：指扇公民館
■利用施設       ：和室（３０人）
■利用日         ：2026/02/08(日)
■利用時間       ：18:00-21:30
■利用目的       ：かるた・百人一首
■面数           ：1

■催物名         ：競技かるたの練習

●コロナウイルス対策として一部の施設で休館等があります。最新の情報はさいたま市公共施設予約システムHP等をご確認ください。
●施設の利用に関するご質問は直接、施設にお問い合わせください。
●システムの操作に関するご質問は、さいたま市公共施設予約システムインフォメーションセンターにお問い合わせください。
ＴＥＬ：０１２０－３１０－９７０　ＦＡＸ：０４８－７１１－８２４５
受付時間：８：３０～１７：００（土・日曜日・休日を除く）
`;

describe('parseLotteryMail(落選メール)', () => {
  const lotteryMailHandler = new LotteryMailHandler();
  let parsed: LotteryMail;

  beforeAll(() => {
    parsed = lotteryMailHandler['parseLotteryMail'](MAIL_BODY_LOSE);
  });

  test('利用者情報を正しくパースできる', () => {
    expect(parsed.userId).toBe('00296129');
    expect(parsed.userName).toBe('埼玉歌留多練様');
  });

  test('エントリ数が正しい', () => {
    expect(parsed.entries.length).toBe(6);
  });

  test('1件目の内容を検証', () => {
    const e = parsed.entries[0];

    expect(e).toMatchObject({
      result: '落選',
      receivedAt: '2025/11/01(土)',
      hall: '指扇公民館',
      facility: '和室（３０人）',
      date: '2026/02/08(日)',
      time: '09:00-12:00',
    });
  });

  test('最後のエントリも正しく取得', () => {
    const e = parsed.entries[5];

    expect(e).toMatchObject({
      result: '落選',
      receivedAt: '2025/11/01(土)',
      hall: '指扇公民館',
      facility: '和室（３０人）',
      date: '2026/02/08(日)',
      time: '18:00-21:30',
    });
  });
});


const MAIL_BODY_WIN = `<!--banner-info-->
This email was sent to nuffnjmv@anonaddy.com (00300134) from info@rsv.ws-scs.jp.
To deactivate this alias copy and paste the url below into your web browser.

https://app.addy.io/deactivate/8d7cdfba-1401-47ef-a23b-976ec0d72e77?signature=29c1c15be65f505e7f1aaf18615d613c46a89603c6a42c4cf4aa5e95f2edc00c
<!--banner-info-->

さいたま市公共施設予約システム

※このメールは発信専用です。返信はご遠慮ください。

下記の抽選申込みの結果をお知らせします。　※屋内スポーツ施設・屋外スポーツ施設・保養施設・その他施設の抽選申込みで当選した方は、確認期間内に、システム上で利用確定の操作が必要です。（公民館は確定の操作は不要です。コミュニティ施設・文化施設は確定の操作は不要ですが、コロナ渦の当面の対応として、事前来館手続きについて変更がある場合がございますので、予約システムの各施設区分のお知らせ画面をご確認ください。）ご注意ください。

■利用者番号     ：00300134
■利用者名       ：埼玉かるた合同練様

■抽選結果       ：当選
■受付日         ：2025/11/05(水)
■利用館         ：岸町公民館
■利用施設       ：第１和室
■利用日         ：2026/02/08(日)
■利用時間       ：13:00-17:00
■利用目的       ：かるた・百人一首
■利用人数       ：30人

■抽選結果       ：当選
■受付日         ：2025/11/12(水)
■利用館         ：岸町公民館
■利用施設       ：第１和室
■利用日         ：2026/02/22(日)
■利用時間       ：13:00-17:00
■利用目的       ：かるた・百人一首
■利用人数       ：30人

■抽選結果       ：当選
■受付日         ：2025/11/12(水)
■利用館         ：岸町公民館
■利用施設       ：第１和室
■利用日         ：2026/02/22(日)
■利用時間       ：18:00-21:30
■利用目的       ：かるた・百人一首
■利用人数       ：30人

●コロナウイルス対策として一部の施設で休館等があります。最新の情報はさいたま市公共施設予約システムHP等をご確認ください。
●施設の利用に関するご質問は直接、施設にお問い合わせください。
●システムの操作に関するご質問は、さいたま市公共施設予約システムインフォメーションセンターにお問い合わせください。
ＴＥＬ：０１２０－３１０－９７０　ＦＡＸ：０４８－７１１－８２４５
受付時間：８：３０～１７：００（土・日曜日・休日を除く）`;


describe('parseLotteryMail(当選メール)', () => {
  const lotteryMailHandler = new LotteryMailHandler();
  let parsed: LotteryMail;

  beforeAll(() => {
    parsed = lotteryMailHandler['parseLotteryMail'](MAIL_BODY_WIN);
  });

  test('利用者情報を正しくパースできる', () => {
    expect(parsed.userId).toBe('00300134');
    expect(parsed.userName).toBe('埼玉かるた合同練様');
  });

  test('エントリ数が正しい', () => {
    expect(parsed.entries.length).toBe(3);
  });

  test('1件目の内容を検証', () => {
    const e = parsed.entries[0];

    expect(e).toMatchObject({
      result: '当選',
      receivedAt: '2025/11/05(水)',
      hall: '岸町公民館',
      facility: '第１和室',
      date: '2026/02/08(日)',
      time: '13:00-17:00',
    });
  });

  test('最後のエントリも正しく取得', () => {
    const e = parsed.entries[2];

    expect(e).toMatchObject({
      result: '当選',
      receivedAt: '2025/11/12(水)',
      hall: '岸町公民館',
      facility: '第１和室',
      date: '2026/02/22(日)',
      time: '18:00-21:30',
    });
  });
});
