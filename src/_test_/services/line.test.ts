/**
 * UrlFetchApp を Jest モックに差し替えて、
 * - fetch が 1 回だけ呼ばれる
 * - 送信先 URL が正しい
 * - Authorization ヘッダーと payload が期待通り
 * を検証するユニットテスト例です。
 */

import Config from '../../config/config';
import { LineService } from '../../services/LineService';

declare const global: Record<string, any>; // テスト環境用に global を再宣言

describe('services/line.pushTextV2', () => {
  const originalFetch = global.UrlFetchApp;

  beforeEach(() => {
    global.UrlFetchApp = {
      fetch: jest.fn(() => ({
        getResponseCode: () => 200,
        getContentText: () => 'ok',
      })),
    } as any;
  });

  afterEach(() => {
    global.UrlFetchApp = originalFetch;
    jest.resetAllMocks();
  });

  it('builds correct payload and calls UrlFetchApp.fetch once', () => {
    new LineService().pushText('dummyTarget', 'hello, world');

    const mockFetch = global.UrlFetchApp.fetch as jest.Mock;
    expect(mockFetch).toHaveBeenCalledTimes(1);

    const [url, options] = mockFetch.mock.calls[0];
    expect(url).toBe('https://api.line.me/v2/bot/message/push');

    const body = JSON.parse(options.payload);
    expect(body.to).toBe('dummyTarget');
    expect(body.messages[0]).toEqual({ type: 'textV2', text: 'hello, world' });

    expect(options.headers.Authorization).toBe(`Bearer ${Config.Line.channelToken}`);
    expect(options.method).toBe('post');
    expect(options.contentType).toBe('application/json');
  });
});
