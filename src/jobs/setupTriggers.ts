export function setupTriggers_(): void {
  ScriptApp.getProjectTriggers().forEach(trigger => ScriptApp.deleteTrigger(trigger));

  /** 木曜定期便: 毎週木曜日 16:00 */
  ScriptApp.newTrigger('announceWeekly')
    .timeBased()
    .onWeekDay(ScriptApp.WeekDay.THURSDAY)
    .atHour(16)
    .create();

  /** 会〆来週アナウンス: 毎週土曜日 09:00 */
  ScriptApp.newTrigger('announceDeadlineNextWeek')
    .timeBased()
    .onWeekDay(ScriptApp.WeekDay.SATURDAY)
    .atHour(9)
    .create();

  /** 会〆当日アナウンス: 毎日 09:00 */
  ScriptApp.newTrigger('announceDeadlineToday')
    .timeBased()
    .everyDays(1)
    .atHour(9)
    .create();

  /** 会〆当日調整さんチェック: 毎日 17:00 */
  ScriptApp.newTrigger('announceChouseisanToday')
    .timeBased()
    .everyDays(1)
    .atHour(17)
    .create();

  /** 本〆当日アナウンス: 毎日 07:00 */
  ScriptApp.newTrigger('announceFinalToday')
    .timeBased()
    .everyDays(1)
    .atHour(7)
    .create();

  /** 練習前アナウンス: 毎日 09:00 */
  ScriptApp.newTrigger('announceTodayPractice')
    .timeBased()
    .everyDays(1)
    .atHour(9)
    .create();

  /** 運営向け2週間後会練確認: 毎週土曜日 20:00 */
  // ScriptApp.newTrigger('announceWeeklyForManagers')
  //   .timeBased()
  //   .onWeekDay(ScriptApp.WeekDay.SATURDAY)
  //   .atHour(20)
  //   .create();

  /** 遅刻欠席連絡: 毎分 */
  ScriptApp.newTrigger('attandanceHandler')
    .timeBased()
    .everyMinutes(1)
    .create();
}
