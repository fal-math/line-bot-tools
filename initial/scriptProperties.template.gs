
function scriptProperties(){
  try {
    const scriptProperties = PropertiesService.getScriptProperties();
    scriptProperties.setProperties({
      "LINE_CHANNEL_ACCESS_TOKEN": "xxx",
      "LINE_USER_ID_MAINTAINER":  "xxx",
      "LINE_GROUP_ID_TAIKAI_MOUSHIKOMI":  "xxx",
      "LINE_GROUP_ID_UNNEI_HOMBU":  "xxx",
      "LINE_GROUP_ID_UNNEI_SHIFT":  "xxx",
      "LINE_GROUP_ID_ZENTAI":  "xxx",
      "LINE_GROUP_ID_TEST":  "xxx",
      "GOOGLE_CALENDAR_ID_TAIKAI":  "xxx",
      "GOOGLE_CALENDAR_ID_KAIRENSHU":  "xxx",
      "GOOGLE_CALENDAR_ID_KAISHIME":  "xxx",
      "GOOGLE_CALENDAR_ID_HONSHIME":  "xxx",
      "DRIVE_URL":  "xxx",
      "CALENDAR_URL":  "xxx",
      "ATTENDANCE_ADDRESS":  "xxx",
      "CHOUSEISAN_URLS":  "xxx",
      "CHOUSEISAN_CSVS":  "xxx",
    });
  } catch (err) {
    console.log('Failed');
  }
}