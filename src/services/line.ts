import { LINE_CHANNEL_ACCESS_TOKEN } from '../config';

export const pushTextV2_ = (
  to: string,
  text: string,
  substitution?: object,
  retryKey = Utilities.getUuid()
): GoogleAppsScript.URL_Fetch.HTTPResponse => {
  const payload = {
    to,
    messages: [{ type: 'textV2', text, ...(substitution && { substitution }) }],
  };
  return UrlFetchApp.fetch('https://api.line.me/v2/bot/message/push', {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify(payload),
    headers: { Authorization: `Bearer ${LINE_CHANNEL_ACCESS_TOKEN}`, 'X-Line-Retry-Key': retryKey },
    muteHttpExceptions: true,
  });
};

export const pushImage_ = (
  to: string,
  original: string,
  preview: string
): GoogleAppsScript.URL_Fetch.HTTPResponse => {
  const payload = {
    to,
    messages: [{
      type: 'image',
      originalContentUrl: original,
      previewImageUrl: preview
    }]
  };
  
  return UrlFetchApp.fetch('https://api.line.me/v2/bot/message/push', {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify(payload),
    headers: { Authorization: `Bearer ${LINE_CHANNEL_ACCESS_TOKEN}` },
    muteHttpExceptions: true,
  });
};