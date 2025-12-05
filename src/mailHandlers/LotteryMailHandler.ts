import Config from '../config/config';
import { LineService } from '../services/LineService';
import { FIELD_MAP, LotteryEntry, LotteryMail } from '../types/type';
import { SEPARATOR, StringUtils } from '../util/StringUtils';
import { MailHandler } from './MailHandler';

export class LotteryMailHandler implements MailHandler {
  constructor(private readonly line = new LineService(), private readonly config = Config) {}

  handle(msg: GoogleAppsScript.Gmail.GmailMessage): void {
    const body = StringUtils.stripCss(msg.getPlainBody());
    const lotteryMail = this.parseLotteryMail(body);
    const winners = lotteryMail.entries.filter((entry) => entry.result === '当選');
    if (winners.length === 0) return; // 当選枠なし

    const notice = [
      `【${winners[0].hall} 抽選結果】`,
      ...winners.map((entry, index) =>
        [
          ``,
          `= 当選枠 ${index + 1} =`,
          `日付: ${entry.date}`,
          `時間: ${entry.time}`,
          `部屋: ${entry.facility}`,
        ].join('\n')
      ),
    ].join('\n');

    this.line.pushText(this.config.Line.id.reserve, notice);
  }

  // 「■項目名　：値」の1行をパース
  private parseFieldLine(line: string): { label: string; value: string } | null {
    // 全角コロン（：）で分割
    const m = line.match(/^■\s*([^：]+)：\s*(.+)$/);
    if (!m) return null;
    const [, label, value] = m;
    return { label: label.trim(), value: value.trim() };
  }

  // メール本文全体を構造化する関数
  private parseLotteryMail(body: string): LotteryMail {
    // 「■」で始まる行だけを対象にする
    const rawLines = body.split(/\r?\n/);
    const fields: { label: string; value: string }[] = [];

    for (const raw of rawLines) {
      const line = raw.trim();
      if (!line.startsWith('■')) continue;
      const f = this.parseFieldLine(line);
      if (f) fields.push(f);
    }

    let idx = 0;
    let userId = '';
    let userName = '';

    // 先頭の利用者番号・利用者名を取り出す
    while (idx < fields.length) {
      const { label, value } = fields[idx];
      if (label === '利用者番号') {
        userId = value;
        idx++;
      } else if (label === '利用者名') {
        userName = value;
        idx++;
      } else {
        break;
      }
    }

    const entries: LotteryEntry[] = [];
    let current: Partial<LotteryEntry> | null = null;

    // 残りは「■抽選結果」から始まるブロックとして解釈
    for (; idx < fields.length; idx++) {
      const { label, value } = fields[idx];

      // 新しいブロックの開始
      if (label === '抽選結果') {
        if (current) {
          // 前のブロックを確定
          entries.push(this.normalizeEntry(current));
        }
        current = {};
      }

      if (!current) current = {}; // 想定外だが念のため防御

      const key = FIELD_MAP[label];
      if (!key) continue; // 未知フィールドは無視

      (current as any)[key] = value;
    }

    // ループ最後のブロックを追加
    if (current) {
      entries.push(this.normalizeEntry(current));
    }

    return { userId, userName, entries };
  }

  // 必須項目が抜けていた場合の補完
  private normalizeEntry(partial: Partial<LotteryEntry>): LotteryEntry {
    return {
      result: partial.result ?? '',
      receivedAt: partial.receivedAt ?? '',
      hall: partial.hall ?? '',
      facility: partial.facility ?? '',
      date: partial.date ?? '',
      time: partial.time ?? '',
    };
  }
}
