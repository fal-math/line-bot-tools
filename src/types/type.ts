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
}

export interface ClubPracticeEvent extends BaseEvent {
  location: PracticeLocation;
  practiceType: string;
  timeRange: string;
  personInCharge: string;
  description?: string;
}

export interface InternalDeadlineEvent extends BaseEvent {
  title: string;
  isMatch: boolean;
  isExternalPractice: boolean;
}

export interface PracticeLocation {
  clubName: string;
  mapUrl: string;
  buildingName: string;
  shortenBuildingName: string;
}

export type PracticeLocations = Record<string, PracticeLocation>;

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

// ========== Mail Forwarding Helpers ==========

export type InboxRoute = {
  /** 対象の受信アドレス（Gmail の送信エイリアス含む）。小文字記載推奨 */
  address: string;
  /** LINE の送り先（複数可） */
  lineRecipients: string[];
  /** LINE 通知テンプレ（{subject},{receivedAt},{from},{to},{cc},{body} が使える） */
  lineNoticeTemplate?: string;
  /** 自動返信するか */
  enableAutoReply?: boolean;
  /** 自動返信テンプレ（{subject},{receivedAt},{from},{to} が使える） */
  autoReplyTemplate?: string;
  /** 自動返信の From（未指定なら address を使用） */
  autoReplyFrom?: string;
  /** CSS や <style> の除去を行うか（既定: true） */
  stripCss?: boolean;
  /** <!--banner-info--> … <!--banner-info--> ブロックを除去するか（既定: true） */
  stripBannerInfo?: boolean;
  /** 件名・本文ペアでホワイトリストを指定 */
  allowPairs?: { subject: string; body: string }[];
};
