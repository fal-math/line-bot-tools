import Config from '../config/config';
import { AbsenceMailHandler } from '../mailHandlers/AbsenceMailHandler';
import { LotteryMailHandler } from '../mailHandlers/LotteryMailHandler';
import { ReserveCsvMailHandler } from '../mailHandlers/ReserveCsvMailHandler';
import { MailRule } from '../types/type';

// メール振り分けルール一覧
export const MAIL_RULES: MailRule[] = [
  {
    to: Config.Mail.attendance,
    handler: new AbsenceMailHandler(),
  },
  {
    subject: '抽選結果のお知らせ',
    handler: new LotteryMailHandler(),
  },
  {
    to: Config.Mail.reserveCsv,
    handler: new ReserveCsvMailHandler(),
  },
];

export class MailRouter {
  constructor(private rules: MailRule[] = MAIL_RULES) {}

  processUnread(): void {
    const threads = GmailApp.search('is:unread');
    if (!threads.length) return;
    GmailApp.getMessagesForThreads(threads).forEach((messages) => {
      messages.forEach((msg) => {
        if (!msg.isUnread()) return;

        const mailRule = this.resolve(msg);
        if (!mailRule) {
          msg.markRead();
          return;
        }

        try {
          mailRule.handler.handle(msg);
        } catch (e) {
          Logger.log(`メール処理エラー: ${(e as Error).message}`);
        }
        msg.markRead();
      });
    });
  }

  resolve(msg: GoogleAppsScript.Gmail.GmailMessage): MailRule | null {
    const from = msg.getFrom();
    const to = msg.getTo();
    const subject = msg.getSubject() || '';

    return (
      this.rules.find((r) => {
        return (
          (!r.from || this.match(r.from, from)) &&
          (!r.to || this.match(r.to, to)) &&
          (!r.subject || this.match(r.subject, subject))
        );
      }) ?? null
    );
  }

  private match(rule: string | RegExp, value: string): boolean {
    return typeof rule === 'string' ? value.includes(rule) : rule.test(value);
  }
}
