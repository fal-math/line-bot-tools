import Config from '../config/config';
import { LineService } from '../services/LineService';
import { SEPARATOR, StringUtils } from '../util/StringUtils';
import { MailHandler } from './MailHandler';

export class AbsenceMailHandler implements MailHandler {
  constructor(private readonly line = new LineService(), private readonly config = Config) {}

  handle(msg: GoogleAppsScript.Gmail.GmailMessage): void {
    const body = StringUtils.stripCss(msg.getPlainBody());
    const subject = msg.getSubject() || '(件名なし)';
    const received = Utilities.formatDate(msg.getDate(), 'Asia/Tokyo', 'MM/dd HH:mm:ss');
    const notice = [
      '【遅刻欠席連絡】',
      `件名　　: ${subject}`,
      `受信時刻: ${received}`,
      SEPARATOR,
      body,
    ].join('\n');

    try {
      this.line.pushText(this.config.Line.id.operations, notice);
    } catch (e) {
      Logger.log(`LINE通知エラー(運営G宛): ${(e as Error).message}`);
    }
    msg.markRead();

    const replyFrom = this.config.Mail.attendance;
    const replyText = '欠席・遅刻の連絡を受け付けました。※本メールは自動送信です。';
    try {
      msg.reply(replyText, { from: replyFrom });
    } catch (e) {
      this.line.pushText(this.config.Line.id.userT, `Gmail返信エラー: ${(e as Error).message}`);
    }

    return;
  }
}
