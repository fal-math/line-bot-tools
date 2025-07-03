import { LineConfig } from './config';
import { Announcer } from './jobs/Announcer';
import { setupTriggers_ } from './jobs/setupTriggers';
import { Attendance } from './jobs/Attendance';
import { ChouseisanSummary } from './jobs/ChouseisanSummary';

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

function setupTriggers() {
  return setupTriggers_();
}
