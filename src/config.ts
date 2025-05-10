const userProps = PropertiesService.getScriptProperties();

/**
 * プロパティ値を取得し、存在しなければ例外を投げる
 */
function getRequiredProp(key: string): string {
  const value = userProps.getProperty(key);
  if (!value) throw new Error(`Missing required property: ${key}`);
  return value;
}

/**
 * JSON オブジェクトを取得し、存在しなければ例外を投げる
 */
function getJsonProp<T>(key: string): T {
  const raw = getRequiredProp(key);
  try {
    return JSON.parse(raw) as T;
  } catch (e) {
    throw new Error(`Invalid JSON for property ${key}: ${e}`);
  }
}

export interface KarutaClasses {
  A: string;
  B: string;
  C: string;
  D: string;
  E: string;
  F: string;
  G: string;
}

// LINE 関連プロパティ
export const LINE_CHANNEL_ACCESS_TOKEN = getRequiredProp("LINE_CHANNEL_ACCESS_TOKEN");
export const LINE_USER_ID_MAINTAINER = getRequiredProp("LINE_USER_ID_MAINTAINER");
export const LINE_GROUP_ID_TAIKAI_MOUSHIKOMI = getRequiredProp("LINE_GROUP_ID_TAIKAI_MOUSHIKOMI");
export const LINE_GROUP_ID_UNNEI_HOMBU = getRequiredProp("LINE_GROUP_ID_UNNEI_HOMBU");
export const LINE_GROUP_ID_UNNEI_SHIFT = getRequiredProp("LINE_GROUP_ID_UNNEI_SHIFT");
export const LINE_GROUP_ID_ZENTAI = getRequiredProp("LINE_GROUP_ID_ZENTAI");
export const LINE_GROUP_ID_TEST = getRequiredProp("LINE_GROUP_ID_TEST");

// Google カレンダー関連プロパティ
export const GOOGLE_CALENDER_ID_TAIKAI = getRequiredProp("GOOGLE_CALENDER_ID_TAIKAI");
export const GOOGLE_CALENDER_ID_KAIRENSHU = getRequiredProp("GOOGLE_CALENDER_ID_KAIRENSHU");
export const GOOGLE_CALENDER_ID_KAISHIME = getRequiredProp("GOOGLE_CALENDER_ID_KAISHIME");
export const GOOGLE_CALENDER_ID_HONSHIME = getRequiredProp("GOOGLE_CALENDER_ID_HONSHIME");

// その他プロパティ
export const DRIVE_URL = getRequiredProp("DRIVE_URL");
export const CALENDER_URL = getRequiredProp("CALENDER_URL");
export const ATTENDANCE_ADDRESS = getRequiredProp("ATTENDANCE_ADDRESS");

// 調整さん URL／CSV（級ごとのマップ）
export const CHOUSEISAN_URLS: KarutaClasses = getJsonProp<KarutaClasses>("CHOUSEISAN_URLS");
export const CHOUSEISAN_CSVS: KarutaClasses = getJsonProp<KarutaClasses>("CHOUSEISAN_CSVS");
