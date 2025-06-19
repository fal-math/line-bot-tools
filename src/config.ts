import { ChouseisanCsvs, ChouseisanUrls, KarutaClass, PracticeLocations } from "./type";

const userProps = PropertiesService.getScriptProperties();

/**
 * プロパティ値を取得し、存在しなければ例外を投げる
 */
function getRequiredProp_(key: string): string {
  const value = userProps.getProperty(key);
  if (!value) throw new Error(`Missing required property: ${key}`);
  return value;
}

/**
 * JSON オブジェクトを取得し、存在しなければ例外を投げる
 */
function getJsonProp_<T>(key: string): T {
  const raw = getRequiredProp_(key);
  try {
    return JSON.parse(raw) as T;
  } catch (e) {
    throw new Error(`Invalid JSON for property ${key}: ${e}`);
  }
}

function getPracticeLocations_(): PracticeLocations {
  const json = userProps.getProperty('PRACTICE_LOCATIONS');
  if (!json) {
    throw new Error('ScriptProperties に PRACTICE_LOCATIONS が設定されていません');
  }
  let data: unknown;
  try {
    data = JSON.parse(json);
  } catch (e: unknown) {
    throw new Error(`PRACTICE_LOCATIONS の JSON パースに失敗しました: ${e}`);
  }
  if (typeof data !== 'object' || data === null) {
    throw new Error('PRACTICE_LOCATIONS の中身がオブジェクトではありません');
  }
  return data as PracticeLocations;
}

// LINE 関連プロパティ
export const LINE_CHANNEL_ACCESS_TOKEN = getRequiredProp_("LINE_CHANNEL_ACCESS_TOKEN");
export const LINE_USER_ID_MAINTAINER = getRequiredProp_("LINE_USER_ID_MAINTAINER");
export const LINE_GROUP_ID_TAIKAI_MOUSHIKOMI = getRequiredProp_("LINE_GROUP_ID_TAIKAI_MOUSHIKOMI");
export const LINE_GROUP_ID_UNNEI_HOMBU = getRequiredProp_("LINE_GROUP_ID_UNNEI_HOMBU");
export const LINE_GROUP_ID_UNNEI_SHIFT = getRequiredProp_("LINE_GROUP_ID_UNNEI_SHIFT");
export const LINE_GROUP_ID_ZENTAI = getRequiredProp_("LINE_GROUP_ID_ZENTAI");
export const LINE_GROUP_ID_TEST = getRequiredProp_("LINE_GROUP_ID_TEST");

// Google カレンダー関連プロパティ
export const GOOGLE_CALENDER_ID_TAIKAI = getRequiredProp_("GOOGLE_CALENDER_ID_TAIKAI");
export const GOOGLE_CALENDER_ID_KAIRENSHU = getRequiredProp_("GOOGLE_CALENDER_ID_KAIRENSHU");
export const GOOGLE_CALENDER_ID_KAISHIME = getRequiredProp_("GOOGLE_CALENDER_ID_KAISHIME");
export const GOOGLE_CALENDER_ID_HONSHIME = getRequiredProp_("GOOGLE_CALENDER_ID_HONSHIME");
export const GOOGLE_CALENDER_ID_OUTER = getRequiredProp_("GOOGLE_CALENDER_ID_OUTER");

// その他プロパティ
export const DRIVE_URL = getRequiredProp_("DRIVE_URL");
export const CALENDER_URL = getRequiredProp_("CALENDER_URL");
export const ATTENDANCE_ADDRESS = getRequiredProp_("ATTENDANCE_ADDRESS");

// 調整さん URL／CSV（級ごとのマップ）
export const CHOUSEISAN_URLS: ChouseisanUrls = getJsonProp_("CHOUSEISAN_URLS");
export const CHOUSEISAN_CSVS: ChouseisanCsvs = getJsonProp_("CHOUSEISAN_CSVS");

export const PRACTICE_LOCATIONS: PracticeLocations = getPracticeLocations_();
