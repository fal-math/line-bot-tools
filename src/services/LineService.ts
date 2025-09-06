import { DEBUG_MODE, LineConfig } from '../config/config';

export class LineService {
  constructor(private token: string = LineConfig.channelToken) {}
  pushText(to: string, text: string, substitution?: object, retryKey?: string): void {
    if (DEBUG_MODE) {
      Logger.log(`[DEBUG] to=${to}\n${text}`);
      return;
    }

    const payload = {
      to,
      messages: [
        {
          type: 'textV2',
          text,
          ...(substitution && { substitution }),
        },
      ],
    };

    UrlFetchApp.fetch('https://api.line.me/v2/bot/message/push', {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify(payload),
      headers: {
        Authorization: `Bearer ${this.token}`,
        'X-Line-Retry-Key': retryKey ?? Utilities.getUuid(),
      },
      muteHttpExceptions: true,
    });
    return;
  }

  pushError(text: string, retryKey?: string): void {
    const to = LineConfig.id.userT;
    const payload = {
      to,
      messages: [
        {
          type: 'textV2',
          text,
        },
      ],
    };

    UrlFetchApp.fetch('https://api.line.me/v2/bot/message/push', {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify(payload),
      headers: {
        Authorization: `Bearer ${this.token}`,
        'X-Line-Retry-Key': retryKey ?? Utilities.getUuid(),
      },
      muteHttpExceptions: true,
    });
  }

  pushImage(to: string, original: string, preview: string, retryKey?: string): void {
    if (DEBUG_MODE) {
      Logger.log(`[DEBUG] \noriginal=${original}\npreview=${preview}`);
      return;
    }

    const payload = {
      to,
      messages: [
        {
          type: 'image',
          originalContentUrl: original,
          previewImageUrl: preview,
        },
      ],
    };

    UrlFetchApp.fetch('https://api.line.me/v2/bot/message/push', {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify(payload),
      headers: {
        Authorization: `Bearer ${this.token}`,
        'X-Line-Retry-Key': retryKey ?? Utilities.getUuid(),
      },
      muteHttpExceptions: true,
    });
  }
}
