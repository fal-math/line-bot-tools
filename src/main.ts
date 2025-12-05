import config from './config/config';
import { Announcer } from './jobs/Announcer';
import { Notify } from './jobs/Notify';
import { MailRouter } from './jobs/MailRouter';
import { Backup } from './jobs/Backup';
import { LineWebhookHandler } from './services/LineWebhookHandler';
import { setupTriggers_ } from './jobs/setupTriggers';
import { DateUtils } from './util/DateUtils';

// リマインドなび

const lineId = config.Line.id;

function announceWeekly() {
  return new Announcer().weekly(lineId.all);
}

function announceWeeklyTest() {
  const tomorrow = DateUtils.addDays(new Date(), 1);
  return new Announcer(tomorrow, true).weekly(lineId.test);
}

function announceDeadlineToday() {
  return new Announcer().deadlineToday(lineId.all);
}

function announceDeadlineNextWeek() {
  return new Announcer().deadlineNextWeek(lineId.all);
}

function notifyDeadlineToday() {
  return new Notify().deadlineToday(lineId.apply);
}

function notifyFinalToday() {
  return new Notify().finalIsToday(lineId.apply, lineId.userT);
}

function notifyTodayPractice() {
  return new Notify().todayPractice(lineId.operations);
}

function notifyWeeklyPractice() {
  return new Notify().weeklyPractice(lineId.operations);
}

function notifyChouseisanWeekly() {
  return new Notify().chouseisanWeekly(lineId.userT);
}

function notifyDebugMode() {
  return new Notify().sendDebugBanner();
}

function mailRouter() {
  return new MailRouter().processUnread();
}

function backupChouseisan() {
  return new Backup().chouseisanCsv();
}

// TODO: monthly calendar render

// ------------- Webhook エンドポイント ----------------
/**
 * LINE からの Webhook を受ける関数
 */
function doPost(e: GoogleAppsScript.Events.DoPost) {
  try {
    if (!e?.postData?.contents) throw new Error('Missing postData.contents');
    const body = JSON.parse(e.postData.contents);
    for (const ev of body.events) {
      const text: string | undefined = ev.message?.text;
      const to: string = ev.source.groupId || ev.source.roomId || ev.source.userId || '';
      if (text && to) {
        new LineWebhookHandler().handle(text, to);
      }
    }
    return ContentService.createTextOutput(JSON.stringify({ status: 'ok' })).setMimeType(
      ContentService.MimeType.JSON
    );
  } catch (err) {
    console.error('doPost error', err);
    return ContentService.createTextOutput(JSON.stringify({ status: 'error' })).setMimeType(
      ContentService.MimeType.JSON
    );
  }
}

// 初回一括セットアップ用
function setupTriggers() {
  return setupTriggers_();
}
