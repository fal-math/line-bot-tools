import {
  LINE_USER_ID_MAINTAINER,
  LINE_GROUP_ID_ZENTAI,
  LINE_GROUP_ID_TAIKAI_MOUSHIKOMI,
  LINE_GROUP_ID_UNNEI_SHIFT,
  LINE_GROUP_ID_TEST,
  LINE_GROUP_ID_UNNEI_HOMBU
} from './config';
import {
  announceWeekly_,
  announceDeadlineToday_,
  announceDeadlineNextWeek_,
  announceFinalToday_,
  announceChouseisanToday_,
  announceChouseisanWeekly_,
  sendMonthlyCalendar_,
  announceWeeklyForManagers_,
} from './jobs/announcer';
import { setupTriggers_ } from './jobs/setupTriggers';
import { attandanceHandler_ } from './jobs/attendance';
import { announceTodayPractice_ } from './jobs/teamPractice';

// リマインドなび

function announceWeekly() {
  return announceWeekly_(LINE_USER_ID_MAINTAINER);
}

function announceDeadlineToday() {
  return announceDeadlineToday_(LINE_GROUP_ID_ZENTAI);
}

function announceDeadlineNextWeek() {
  return announceDeadlineNextWeek_(LINE_GROUP_ID_ZENTAI);
}

function announceFinalToday() {
  return announceFinalToday_(LINE_GROUP_ID_TAIKAI_MOUSHIKOMI, LINE_USER_ID_MAINTAINER);
}

function announceChouseisanToday() {
  return announceChouseisanToday_(LINE_GROUP_ID_TAIKAI_MOUSHIKOMI);
}

function announceChouseisanWeekly() {
  return announceChouseisanWeekly_(LINE_USER_ID_MAINTAINER);
}

function sendMonthlyCalendar() {
  return sendMonthlyCalendar_(LINE_GROUP_ID_TEST);
}

function attandanceHandler() {
  return attandanceHandler_(LINE_GROUP_ID_UNNEI_HOMBU);
}
function announceWeeklyForManagers() {
  return announceWeeklyForManagers_(LINE_GROUP_ID_UNNEI_SHIFT);
}

function announceTodayPractice() {
  return announceTodayPractice_(LINE_GROUP_ID_UNNEI_HOMBU);
}


function setupTriggers() {
  return setupTriggers_();
}
