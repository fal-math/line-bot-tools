import { LINE_CHANNEL_ACCESS_TOKEN } from "../config";

export class LineService {
  constructor(private token: string = LINE_CHANNEL_ACCESS_TOKEN) { }

  pushText(to: string, text: string, substitution?: object, retryKey?: string): GoogleAppsScript.URL_Fetch.HTTPResponse {
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

    return UrlFetchApp.fetch('https://api.line.me/v2/bot/message/push', {
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

  pushImage(to: string, original: string, preview: string, retryKey?: string): GoogleAppsScript.URL_Fetch.HTTPResponse {
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

    return UrlFetchApp.fetch('https://api.line.me/v2/bot/message/push', {
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
