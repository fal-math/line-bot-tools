import Config from '../config/config';
import { InboxRoute } from '../types/type';

function makeReserveRoute(label: string, address: string, lineId: string): InboxRoute {
  return {
    address,
    lineRecipients: [lineId],
    lineNoticeTemplate: [
      `【${label}ID | 抽選結果】`,
      '件名　　: {subject}',
      '受信時刻: {receivedAt}',
      '--------------------',
      '{body}',
    ].join('\n'),
    enableAutoReply: false,
    stripBannerInfo: true,
    allowPairs: [{ subject: '抽選申込みのお知らせ', body: '当選' }],
  };
}

export const INBOX_ROUTES: InboxRoute[] = [
  {
    address: Config.Mail.attendance,
    lineRecipients: [Config.Line.id.operations],
    stripCss: true,
    lineNoticeTemplate: [
      '【遅刻欠席連絡】',
      '件名　　: {subject}',
      '受信時刻: {receivedAt}',
      '--------------------',
      '{body}',
    ].join('\n'),
    enableAutoReply: true,
    autoReplyTemplate: '遅刻・欠席のご連絡を受け付けました。※本メールは自動送信です。',
  },
  makeReserveRoute('常盤', Config.Mail.reserve.Tokiwa, Config.Line.id.reserve),
  makeReserveRoute('別所', Config.Mail.reserve.Bessho, Config.Line.id.reserve),
  makeReserveRoute('指扇', Config.Mail.reserve.Sashiougi, Config.Line.id.reserve),
  makeReserveRoute('上落合', Config.Mail.reserve.Kamiochiai, Config.Line.id.reserve),
  makeReserveRoute('岸町', Config.Mail.reserve.Kishicho, Config.Line.id.reserve),
];
