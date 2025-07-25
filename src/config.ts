import { ClassMap, PracticeLocations } from "./types/type";

const userProps = PropertiesService.getScriptProperties();

/**
 * プロパティ値を取得し、存在しなければ例外を投げる
 * 
 * @param key プロパティ名
 * @returns プロパティの値
 */
function getRequiredProp_(key: string): string {
  const value = userProps.getProperty(key);
  if (!value) throw new Error(`Missing required property: ${key}`);
  return value;
}

/**
 * スクリプトプロパティからオプションの環境変数を取得します。
 * プロパティが未設定（null または空文字列）の場合は undefined を返します。
 *
 * @param key プロパティ名
 * @returns プロパティの値、未設定なら undefined
 */
export function getOptionalProp_(key: string): string | undefined {
  // GAS のスクリプトプロパティから取得
  const raw = userProps.getProperty(key);
  if (raw === null || raw === "") return undefined;
  return raw;
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

export const LineConfig = {
  channelToken: getRequiredProp_("LINE_CHANNEL_ACCESS_TOKEN"),
  id: {
    apply: getRequiredProp_("LINE_GROUP_ID_TAIKAI_MOUSHIKOMI"),
    operations: getRequiredProp_("LINE_GROUP_ID_UNNEI_HOMBU"),
    shift: getRequiredProp_("LINE_GROUP_ID_UNNEI_SHIFT"),
    all: getRequiredProp_("LINE_GROUP_ID_ZENTAI"),
    test: getRequiredProp_("LINE_GROUP_ID_TEST"),
    userT: getRequiredProp_("LINE_USER_ID_T"),
    userF: getRequiredProp_("LINE_USER_ID_F"),
    userI: getRequiredProp_("LINE_USER_ID_I"),
  } as const,
};

export const CalendarIds = {
  match: getRequiredProp_("GOOGLE_CALENDAR_ID_TAIKAI"),
  clubPractice: getRequiredProp_("GOOGLE_CALENDAR_ID_KAIRENSHU"),
  internalDeadline: getRequiredProp_("GOOGLE_CALENDAR_ID_KAISHIME"),
  actualDeadline: getRequiredProp_("GOOGLE_CALENDAR_ID_HONSHIME"),
  externalPractice: getRequiredProp_("GOOGLE_CALENDAR_ID_OUTER"),
} as const;

export const DEBUG_MODE = (getOptionalProp_("DEBUG_MODE") || "false") === "true";
export const DRIVE_URL = getRequiredProp_("DRIVE_URL");
export const CALENDAR_URL = getRequiredProp_("CALENDAR_URL");
export const MANAGERS_PORTAL_URL = getRequiredProp_("MANAGERS_PORTAL_URL");
export const ATTENDANCE_ADDRESS = getRequiredProp_("ATTENDANCE_ADDRESS");

export const CHOUSEISAN_URLS = getJsonProp_<ClassMap<string>>("CHOUSEISAN_URLS");
export const CHOUSEISAN_CSVS = getJsonProp_<ClassMap<string>>("CHOUSEISAN_CSVS");
export const PRACTICE_LOCATIONS = getPracticeLocations_();
