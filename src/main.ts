import { LineConfig } from './config';
import { Announcer } from './jobs/Announcer';
import { setupTriggers_ } from './jobs/setupTriggers';
import { Attendance } from './jobs/Attendance';
import { ChouseisanSummary } from './jobs/ChouseisanSummary';
import { LineWebhookHandler } from './services/LineWebhookHandler';

// リマインドなび

const lineId = LineConfig.groupIds;

function announceWeekly() {
  return new Announcer().weekly(lineId.all);
}

function announceDeadlineToday() {
  return new Announcer().deadlineToday(lineId.all);
}

function announceDeadlineNextWeek() {
  return new Announcer().deadlineNextWeek(lineId.all);
}

function announceFinalToday() {
  return new Announcer().finalIsToday(lineId.apply, LineConfig.maintainerId);
}

function announceTodayPractice() {
  return new Announcer().todayPractice(lineId.operations);
}

function announceChouseisanToday() {
  return new ChouseisanSummary().sendToday(lineId.apply);
}

function announceChouseisanWeekly() {
  return new ChouseisanSummary().sendWeekly(LineConfig.maintainerId);
}

function attandanceHandler() {
  return new Attendance().do(lineId.operations);
}

// function announceWeeklyForManagers() {
//   return new Announcer().weeklyForManagers(LINE_GROUP_ID_UNNEI_SHIFT);
// }

// TODO: monthly calendar render
// function sendMonthlyCalendar() {
// return sendMonthlyCalendar_(LINE_GROUP_ID_TEST);
// }

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
