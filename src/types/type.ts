// Karuta Class Enum
export enum KarutaClass {
  A = 'A',
  B = 'B',
  C = 'C',
  D = 'D',
  E = 'E',
  F = 'F',
  G = 'G',
}

export type ClassMap<T> = {
  [K in KarutaClass]: T;
};

export type HeaderMap<T> = Record<keyof T, string>;

// ========== Calendar Events ==========
export interface BaseEvent {
  date: Date;
  targetClasses: KarutaClass[] | string;
}

export interface MatchEvent extends BaseEvent {
  title: string;
  location: string;
  mapUrl?: string;
  targetClasses: KarutaClass[];
}

export interface ExPracticeEvent extends BaseEvent {
  title: string;
  location: string;
  mapUrl?: string;
  timeRange?: string;
  description?: string;
  category: string;
  deadline: Date;
}

export interface ClubPracticeEvent extends BaseEvent {
  location: Venue;
  // practiceType: string;
  timeRange: string;
  personInCharge: string;
  description?: string;
}

export interface InternalDeadlineEvent extends BaseEvent {
  title: string;
  isMatch: boolean;
  isExternalPractice: boolean;
}

// Spreadsheet Config

export interface Venue {
  name: string; // 会場名
  shortName: string; // 会場名（短縮）
  nearestStation: string; // 最寄り駅
  walkMinutes: string; // 徒歩時間
  line: string; // 何線か
  mapUrl: string; // 地図URL
  clubName: string; // 団体名
  capacityOfPairs: number; // 最大組数
}

export interface ExPracticeDescription {
  name: string;
  description: string;
}

// export type PracticeLocations = Record<string, PracticeLoc ation>;

// ========== Participation & Registration ==========
export interface ParticipantStatus {
  attending: string[];
  notAttending: string[];
  undecided: string[];
}

export interface Registration {
  title: string;
  eventDate: Date;
  deadline: Date;
  participants: ParticipantStatus;
}

// ========== Messaging Helpers ==========
export interface Mention {
  type: string;
  mentionee: object;
}

export type SubstitutionMap = Record<string, Mention>;

export interface ImageUrls {
  original: string;
  preview: string;
}

// ========== MailRouter Helpers ==========
export type MailRule = {
  from?: string | RegExp;
  to?: string | RegExp;
  subject?: string | RegExp;
  handler: any;
};

export type LotteryEntry = {
  result: string; // 抽選結果
  receivedAt: string; // 受付日
  hall: string; // 利用館
  facility: string; // 利用施設
  date: string; // 利用日
  time: string; // 利用時間
};

export interface LotteryMail {
  userId: string; // 利用者番号
  userName: string; // 利用者名
  entries: LotteryEntry[]; // 抽選結果（1メールに複数）
}

export const FIELD_MAP: Record<string, keyof LotteryEntry | 'userId' | 'userName'> = {
  利用者番号: 'userId',
  利用者名: 'userName',
  抽選結果: 'result',
  受付日: 'receivedAt',
  利用館: 'hall',
  利用施設: 'facility',
  利用日: 'date',
  利用時間: 'time',
};
