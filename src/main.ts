import {
  LINE_USER_ID_MAINTAINER,
  LINE_GROUP_ID_ZENTAI,
  LINE_GROUP_ID_TAIKAI_MOUSHIKOMI,
  LINE_GROUP_ID_UNNEI_SHIFT,
  LINE_GROUP_ID_TEST,
  LINE_GROUP_ID_UNNEI_HOMBU
} from './config';
import { Announcer } from './jobs/announcer';
import { setupTriggers_ } from './jobs/setupTriggers';
import { attandanceHandler_ } from './jobs/attendance';
import { announceTodayPractice_ } from './jobs/teamPractice';

// リマインドなび

function announceWeekly() {
  return new Announcer().weekly(LINE_GROUP_ID_ZENTAI);
}

function announceDeadlineToday() {
  return new Announcer().deadlineToday(LINE_GROUP_ID_ZENTAI);
}

function announceDeadlineNextWeek() {
  return new Announcer().deadlineNextWeek(LINE_GROUP_ID_ZENTAI);
}

function announceFinalToday() {
  return new Announcer().finalIsToday(LINE_GROUP_ID_TAIKAI_MOUSHIKOMI, LINE_USER_ID_MAINTAINER);
}

function announceChouseisanToday() {
  return new Announcer().chouseisanToday(LINE_GROUP_ID_TAIKAI_MOUSHIKOMI);
}

function announceChouseisanWeekly() {
  return new Announcer().chouseisanWeekly(LINE_USER_ID_MAINTAINER);
}

function announceWeeklyForManagers() {
  return new Announcer().weeklyForManagers(LINE_GROUP_ID_UNNEI_SHIFT);
}

// TODO: monthly calender render
// function sendMonthlyCalendar() {
// return sendMonthlyCalendar_(LINE_GROUP_ID_TEST);
// }

function announceTodayPractice() {
  return announceTodayPractice_(LINE_GROUP_ID_UNNEI_HOMBU);
}

function attandanceHandler() {
  return attandanceHandler_(LINE_GROUP_ID_UNNEI_HOMBU);
}

function setupTriggers() {
  return setupTriggers_();
}
