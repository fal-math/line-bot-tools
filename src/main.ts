import { LineConfig } from './config';
import { Announcer } from './jobs/Announcer';
import { Notify } from './jobs/Notify';
import { setupTriggers_ } from './jobs/setupTriggers';
import { Attendance } from './jobs/Attendance';
import { LineWebhookHandler } from './services/LineWebhookHandler';

// リマインドなび

const lineId = LineConfig.id;

function announceWeekly() {
  return new Announcer().weekly(lineId.all);
}

function announceDeadlineToday() {
  return new Announcer().deadlineToday(lineId.all);
}

function announceDeadlineNextWeek() {
  return new Announcer().deadlineNextWeek(lineId.all);
}

function notifyDeadlineToday() {
  return new Notify().deadlineToday(lineId.apply, lineId.userF);
}

function notifyFinalToday() {
  return new Notify().finalIsToday(lineId.apply, lineId.userT);
}

function notifyTodayPractice() {
  return new Notify().todayPractice(lineId.operations);
}

function notifyChouseisanWeekly() {
  return new Notify().chouseisanWeekly(lineId.userT);
}

function attandanceHandler() {
  return new Attendance().do(lineId.operations);
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
