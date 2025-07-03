import { ATTENDANCE_ADDRESS } from "../config";
import { LineService } from '../services/LineService';
import { StringUtils } from '../util/StringUtils';

export class Attendance {
  public do(to: string): void {
    const threads = GmailApp.search(`(to:${ATTENDANCE_ADDRESS} is:unread)`);
    if (!threads.length) return;

    GmailApp.getMessagesForThreads(threads).forEach(messages => {
      const msg = messages[messages.length - 1];
      const notice = this.buildNoticeText(msg);

      try {
        new LineService().pushText(to, notice);
      } catch (e) {
        Logger.log(`LINE通知エラー: ${(e as Error).message}`);
      }

      try {
        this.sendAutoReply(msg);
      } catch (e) {
        Logger.log(`Gmail返信エラー: ${(e as Error).message}`);
      }

      msg.markRead();
    });
  }

  private buildNoticeText(message: GoogleAppsScript.Gmail.GmailMessage): string {
    const receivedAt = Utilities.formatDate(message.getDate(), 'JST', 'MM/dd HH:mm:ss');
    return [
      '【遅刻欠席連絡】',
      `件名　　: ${message.getSubject()}`,
      `受信時刻: ${receivedAt}`,
      '--------------------------------------',
      StringUtils.stripCss(message.getPlainBody())
    ].join('\n');
  }

  private sendAutoReply(message: GoogleAppsScript.Gmail.GmailMessage): void {
    try {
      message.reply(
        '遅刻、欠席連絡を受け付けました。※こちらは自動配信メールのため返信はできません。',
        { from: ATTENDANCE_ADDRESS }
      );
    } catch (e) {
      throw e;
    }
  }

}

