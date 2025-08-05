function scriptProperties() {
  try {
    const scriptProperties = PropertiesService.getScriptProperties();
    scriptProperties.setProperties({
      "DEBUG_MODE": "false",
      "LINE_CHANNEL_ACCESS_TOKEN": "xxx",
      "LINE_USER_ID_T": "xxx",
      "LINE_USER_ID_F": "xxx",
      "LINE_USER_ID_I": "xxx",
      "LINE_GROUP_ID_TAIKAI_MOUSHIKOMI": "xxx",
      "LINE_GROUP_ID_UNNEI_HOMBU": "xxx",
      "LINE_GROUP_ID_UNNEI_SHIFT": "xxx",
      "LINE_GROUP_ID_ZENTAI": "xxx",
      "LINE_GROUP_ID_TEST": "xxx",
      "GOOGLE_CALENDAR_ID_TAIKAI": "xxx@group.calendar.google.com",
      "GOOGLE_CALENDAR_ID_KAIRENSHU": "xxx@group.calendar.google.com",
      "GOOGLE_CALENDAR_ID_KAISHIME": "xxx@group.calendar.google.com",
      "GOOGLE_CALENDAR_ID_HONSHIME": "xxx@group.calendar.google.com",
      "GOOGLE_CALENDAR_ID_OUTER": "xxx@group.calendar.google.com",
      "DRIVE_URL": "https://example.com",
      "CALENDAR_URL": "https://example.com",
      "SPREADSHEET_ID": "xxx",
      "MANAGERS_PORTAL_URL": "https://example.com",
      "ATTENDANCE_ADDRESS": "aaa@example.com",
      "CHOUSEISAN_URLS": `{
        "A": "https://example.com/A",
        "B": "https://example.com/B",
        "C": "https://example.com/C",
        "D": "https://example.com/D",
        "E": "https://example.com/E",
        "F": "https://example.com/F",
        "G": "https://example.com/G"
      }`,
      "CHOUSEISAN_CSVS": `{
        "A": "https://example.com/csvs/A",
        "B": "https://example.com/csvs/B",
        "C": "https://example.com/csvs/C",
        "D": "https://example.com/csvs/D",
        "E": "https://example.com/csvs/E",
        "F": "https://example.com/csvs/F",
        "G": "https://example.com/csvs/G"
      }`,
      "PRACTICE_LOCATIONS": `{}`
    });
  } catch (err) {
    console.log("Failed");
  }
}