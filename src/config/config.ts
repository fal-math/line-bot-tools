import { SpreadsheetConfigService } from '../services/SpreadsheetConfigService';
import { ClassMap, ExPracticeDescription, HeaderMap, Venue } from '../types/type';
import { ConfigValidator } from './configValidator';

const userProps = PropertiesService.getScriptProperties();

/**
 * プロパティ値を取得し、存在しなければ例外を投げる
 *
 * @param key プロパティ名
 * @returns プロパティの値
 */
function getRequiredProp_(key: string): string {
  const value = userProps.getProperty(key);
  if (value === null || value === undefined || value.trim() === '') {
    throw new Error(`[Config] 必須プロパティが未設定です: ${key}`);
  }
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
  if (raw === null || raw === '') return undefined;
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
    const msg = e instanceof Error ? e.message : String(e);
    throw new Error(`[Config] JSON 解析に失敗しました: ${key} (${msg})`);
  }
}

const LineConfig = {
  channelToken: getRequiredProp_('LINE_CHANNEL_ACCESS_TOKEN'),
  id: {
    apply: getRequiredProp_('LINE_GROUP_ID_TAIKAI_MOUSHIKOMI'),
    operations: getRequiredProp_('LINE_GROUP_ID_UNNEI_HOMBU'),
    shift: getRequiredProp_('LINE_GROUP_ID_UNNEI_SHIFT'),
    reserve: getRequiredProp_('LINE_GROUP_ID_RESERVE'),
    all: getRequiredProp_('LINE_GROUP_ID_ZENTAI'),
    test: getRequiredProp_('LINE_GROUP_ID_TEST'),
    userT: getRequiredProp_('LINE_USER_ID_T'),
    userF: getRequiredProp_('LINE_USER_ID_F'),
    userI: getRequiredProp_('LINE_USER_ID_I'),
    userK: getRequiredProp_('LINE_USER_ID_K'),
  } as const,
};

const CalendarConfig = {
  url: getRequiredProp_('CALENDAR_URL'),
  id: {
    match: getRequiredProp_('GOOGLE_CALENDAR_ID_TAIKAI'),
    clubPractice: getRequiredProp_('GOOGLE_CALENDAR_ID_KAIRENSHU'),
    internalDeadline: getRequiredProp_('GOOGLE_CALENDAR_ID_KAISHIME'),
    actualDeadline: getRequiredProp_('GOOGLE_CALENDAR_ID_HONSHIME'),
    externalPractice: getRequiredProp_('GOOGLE_CALENDAR_ID_OUTER'),
  },
} as const;

const ChouseisanConfig = {
  urls: getJsonProp_<ClassMap<string>>('CHOUSEISAN_URLS'),
  csvs: getJsonProp_<ClassMap<string>>('CHOUSEISAN_CSVS'),
  spreadsheetId: getRequiredProp_('BACKUP_SPREADSHEET_ID'),
};

const MailConfig = {
  attendance: getRequiredProp_('ATTENDANCE_ADDRESS'),
  reserveCsv: getRequiredProp_('RESERVE_CSV_ADDRESS'),
  reserve: {
    Kamiochiai: getRequiredProp_('RESERVE_KAMIOCHIAI_ADDRESS'),
    Kishicho: getRequiredProp_('RESERVE_KISHICHO_ADDRESS'),
    Bessho: getRequiredProp_('RESERVE_BESSHO_ADDRESS'),
    Sashiougi: getRequiredProp_('RESERVE_SASHIOUGI_ADDRESS'),
    Tokiwa: getRequiredProp_('RESERVE_TOKIWA_ADDRESS'),
  },
};

const CONFIG_SPREADSHEET_ID = getRequiredProp_('CONFIG_SPREADSHEET_ID');

const Venues: Record<string, Venue> = Object.fromEntries(
  new SpreadsheetConfigService<Venue>(
    CONFIG_SPREADSHEET_ID,
    '会場',
    {
      name: '会場名',
      shortName: '会場名（短縮）',
      nearestStation: '最寄り駅',
      walkMinutes: '徒歩時間',
      line: '路線',
      mapUrl: '地図URL',
      clubName: '団体名',
      capacityOfPairs: '組数',
    } as HeaderMap<Venue>,
    'shortName'
  ).getAll()
);

const ExPracticeRecord: Record<string, ExPracticeDescription> = Object.fromEntries(
  new SpreadsheetConfigService(
    CONFIG_SPREADSHEET_ID,
    '外部練',
    { name: '名前', description: '説明' } as HeaderMap<ExPracticeDescription>,
    'name'
  ).getAll()
);

const DEBUG_MODE = (getOptionalProp_('DEBUG_MODE') || 'false') === 'true';
const DRIVE_URL = getRequiredProp_('DRIVE_URL');
const MANAGERS_PORTAL_URL = getRequiredProp_('MANAGERS_PORTAL_URL');

const Config = {
  Line: LineConfig,
  Calendar: CalendarConfig,
  Chouseisan: ChouseisanConfig,
  Mail: MailConfig,
  CONFIG_SPREADSHEET_ID,
  Venues,
  ExPracticeRecord,
  DEBUG_MODE,
  DRIVE_URL,
  MANAGERS_PORTAL_URL,
} as const;

/**
 * 起動時バリデーション
 * - 例外が投げられた場合はデプロイ直後に気づける
 * - DEBUG_MODE でも検証は走らせる（本番差し替え忘れ検知のため）
 */
function validateAllConfig_(): void {
  ConfigValidator.requireNonEmptyString(LineConfig.channelToken, 'LineConfig.channelToken');
  ConfigValidator.validateLineGroupIds(LineConfig.id);
  ConfigValidator.validateCalendarConfig(CalendarConfig);
  ConfigValidator.validateChouseisanConfig(ChouseisanConfig);
}

// モジュールロード時に一度だけ実行
validateAllConfig_();

export default Config;
