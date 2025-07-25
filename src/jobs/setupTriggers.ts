export function setupTriggers_(): void {
  ScriptApp.getProjectTriggers().forEach(trigger => ScriptApp.deleteTrigger(trigger));

  /** 木曜定期便: 毎週木曜日 16:00 */
  ScriptApp.newTrigger('announceWeekly')
    .timeBased()
    .onWeekDay(ScriptApp.WeekDay.THURSDAY)
    .atHour(16)
    .create();

  /** 会〆来週全体アナウンス: 毎週土曜日 09:00 */
  ScriptApp.newTrigger('announceDeadlineNextWeek')
    .timeBased()
    .onWeekDay(ScriptApp.WeekDay.SATURDAY)
    .atHour(9)
    .create();

  /** 会〆当日全体アナウンス: 毎日 09:00 */
  ScriptApp.newTrigger('announceDeadlineToday')
    .timeBased()
    .everyDays(1)
    .atHour(9)
    .create();

  /** 会〆当日通知: 毎日 09:00 */
  ScriptApp.newTrigger('notifyDeadlineToday')
    .timeBased()
    .everyDays(1)
    .atHour(21)
    .create();

  /** 本〆当日通知: 毎日 07:00 */
  ScriptApp.newTrigger('notifyFinalToday')
    .timeBased()
    .everyDays(1)
    .atHour(7)
    .create();

  /** 練習前通知: 毎日 08:00 */
  ScriptApp.newTrigger('notifyTodayPractice')
    .timeBased()
    .everyDays(1)
    .atHour(8)
    .create();

  /** 遅刻欠席連絡: 毎分 */
  ScriptApp.newTrigger('attandanceHandler')
    .timeBased()
    .everyMinutes(1)
    .create();
}
