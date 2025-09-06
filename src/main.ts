import { LineConfig } from './config/config';
import { Announcer } from './jobs/Announcer';
import { Notify } from './jobs/Notify';
import { setupTriggers_ } from './jobs/setupTriggers';
import { InboxRouter } from './jobs/InboxRouter';
import { LineWebhookHandler } from './services/LineWebhookHandler';
import { ChouseisanService } from './services/ChouseisanService';
import { DateUtils } from './util/DateUtils';

// リマインドなび

const lineId = LineConfig.id;

function announceWeekly() {
  return new Announcer().weekly(lineId.all);
}

function announceWeeklyTest() {
  const tomorrow = DateUtils.addDays(new Date(),1);
  return new Announcer(tomorrow, true).weekly(lineId.test);
}

function announceDeadlineToday() {
  return new Announcer().deadlineToday(lineId.all);
}

function announceDeadlineNextWeek() {
  return new Announcer().deadlineNextWeek(lineId.all);
}

function notifyDeadlineToday() {
  return new Notify().deadlineToday(lineId.apply, lineId.userK);
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

function inboxRouterProcesser() {
  return new InboxRouter().processUnread();
}

function backupChouseisan() {
  return new ChouseisanService().backupChouseisanCsv();
}

// TODO: monthly calendar render

// ------------- Webhook エンドポイント ----------------
/**
 * LINE からの Webhook を受ける関数
 */
function doPost(e: GoogleAppsScript.Events.DoPost) {
  try {
    const body = JSON.parse(e.postData!.contents) as { events: any[] };
    for (const ev of body.events) {
      const text: string | undefined = ev.message?.text;
      const to: string = ev.source.groupId || ev.source.roomId || ev.source.userId || '';
      if (text && to) {
        new LineWebhookHandler().handle(text, to);
      }
    }
    return ContentService
      .createTextOutput(JSON.stringify({ status: 'ok' }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    console.error('doPost error', err);
    return ContentService
      .createTextOutput(JSON.stringify({ status: 'error' }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// 初回一括セットアップ用
function setupTriggers() {
  return setupTriggers_();
}
