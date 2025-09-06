import Config from '../config/config';
import { InboxRoute } from "../types/type";
import { INBOX_ROUTES } from "../config/inboxRoutes";
import { LineService } from "../services/LineService";
import { StringUtils } from "../util/StringUtils";

class TemplateRenderer {
  static render(tpl: string, dict: Record<string, string>): string {
    return tpl.replace(/\{(\w+)\}/g, (_, k) => dict[k] ?? '');
  }
}

class MessageCleaner {
  static removeBannerInfo(s: string): string {
    return s.replace(/<!--banner-info-->[\s\S]*?<!--banner-info-->/g, '');
  }
  static normalizePlainBody(
    raw: string,
    opts: { stripCss: boolean; stripBannerInfo: boolean },
  ): string {
    let out = raw ?? '';
    if (opts.stripCss) out = StringUtils.stripCss(out);
    if (opts.stripBannerInfo) out = MessageCleaner.removeBannerInfo(out);
    return out.trim();
  }
}

class GmailAddressParser {
  static parseList(s?: string | null): string[] {
    if (!s) return [];
    return s
      .split(',')
      .map(t => t.trim().toLowerCase())
      .map(t => (t.includes('<') ? t.replace(/^.*<([^>]+)>.*/, '$1') : t))
      .filter(Boolean);
  }
}
export class InboxRouter {
  constructor(
    private readonly line: LineService = new LineService(),
    private readonly routes: InboxRoute[] = INBOX_ROUTES,
  ) { }

  private shouldSkip(route: InboxRoute, subject: string, body: string): boolean {
    // allowPairs が未定義または空 → 全部許可
    if (!route.allowPairs || route.allowPairs.length === 0) {
      return false; // スキップしない
    }
    const matched = route.allowPairs.some(pair => {
      const subjectMatch = subject.includes(pair.subject);
      const bodyMatch = body.includes(pair.body);
      return subjectMatch && bodyMatch;
    });

    if (!matched) {
      Logger.log(
        `ホワイトリスト不一致: 件名="${subject}" / 本文冒頭="${body.slice(0, 30)}..."`
      );
      return true; // 転送・返信をスキップ
    }
    return false; // ホワイトリスト条件なし or 一致
  }

  /** 未読で、対象アドレス宛のスレッドを処理 */
  public processUnread(): void {
    if (Config.DEBUG_MODE) return;

    const query = this.buildUnreadQuery(this.routes);
    const threads = GmailApp.search(query);
    if (!threads.length) return;

    GmailApp.getMessagesForThreads(threads).forEach(messages => {
      const msg = messages[messages.length - 1];
      const route = this.resolveRoute(msg, this.routes);
      if (!route) {
        msg.markRead();
        return;
      }

      const subject = msg.getSubject() ?? '';
      const body = MessageCleaner.normalizePlainBody(
        msg.getPlainBody(),
        {
          stripCss: route.stripCss !== false,
          stripBannerInfo: route.stripBannerInfo !== false,
        },
      );

      // --- ワードチェック ---
      if (this.shouldSkip(route, subject, body)) {
        msg.markRead();
        return;
      }

      const notice = this.buildLineNotice(msg, route, body);
      // LINE 送信（複数宛先）
      for (const to of route.lineRecipients) {
        try {
          this.line.pushText(to, notice);
        } catch (e) {
          Logger.log(`LINE通知エラー(to=${to}): ${(e as Error).message}`);
        }
      }

      // 自動返信
      if (route.enableAutoReply) {
        try {
          this.replyToSender(msg, route);
        } catch (e) {
          Logger.log(`Gmail返信エラー: ${(e as Error).message}`);
        }
      }

      msg.markRead();
    });
  }

  // --- クエリ構築 ---
  private buildUnreadQuery(routes: InboxRoute[]): string {
    const toQuery = routes.map(r => `to:${r.address}`).join(' OR ');
    return `( ${toQuery} ) is:unread`;
  }

  // --- ルート解決 ---
  private resolveRoute(
    message: GoogleAppsScript.Gmail.GmailMessage,
    routes: InboxRoute[],
  ): InboxRoute | null {
    const toList = GmailAddressParser.parseList(message.getTo());
    const ccList = GmailAddressParser.parseList(message.getCc());
    const bccList = GmailAddressParser.parseList(message.getBcc());
    const all = new Set([...toList, ...ccList, ...bccList]);
    for (const r of routes) {
      if (all.has(r.address.toLowerCase())) return r;
    }
    return null;
  }

  // --- LINE 通知本文生成 ---
  private buildLineNotice(
    message: GoogleAppsScript.Gmail.GmailMessage,
    route: InboxRoute,
    body: string,
  ): string {
    const receivedAt = Utilities.formatDate(message.getDate(), 'Asia/Tokyo', 'MM/dd HH:mm:ss');

    const dict = {
      subject: message.getSubject() ?? '',
      receivedAt,
      from: message.getFrom() ?? '',
      to: message.getTo() ?? '',
      cc: message.getCc() ?? '',
      body,
    };

    const template =
      route.lineNoticeTemplate ??
      [
        '【メール転送】',
        '件名　　: {subject}',
        '受信時刻: {receivedAt}',
        '--------------------------------------',
        '{body}',
      ].join('\n');

    return TemplateRenderer.render(template, dict);
  }

  // --- 自動返信（命名: replyToSender） ---
  private replyToSender(
    message: GoogleAppsScript.Gmail.GmailMessage,
    route: InboxRoute,
  ): void {
    const receivedAt = Utilities.formatDate(message.getDate(), 'Asia/Tokyo', 'MM/dd HH:mm:ss');
    const body = TemplateRenderer.render(
      route.autoReplyTemplate ??
      '遅刻・欠席のご連絡を受け付けました。※本メールは自動送信です。',
      {
        subject: message.getSubject() ?? '',
        receivedAt,
        from: message.getFrom() ?? '',
        to: message.getTo() ?? '',
      },
    );
    const replyFrom = route.autoReplyFrom || route.address;
    message.reply(body, { from: replyFrom });
  }
}
