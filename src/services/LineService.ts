import { DEBUG_MODE, LineConfig } from '../config/config';
import { ImageUrls, SubstitutionMap } from '../types/type';

export class LineService {
  constructor(private token: string = LineConfig.channelToken) {}
  pushText(to: string, text: string, substitution?: SubstitutionMap, retryKey?: string): void {
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

  pushImage(to: string, image: ImageUrls, retryKey?: string): void {
    if (DEBUG_MODE) {
      Logger.log(`[DEBUG] \noriginal=${image.original}\npreview=${image.preview}`);
      return;
    }

    const payload = {
      to,
      messages: [
        {
          type: 'image',
          originalContentUrl: image.original,
          previewImageUrl: image.preview,
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
