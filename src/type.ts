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

export type ClassUrls = ClassMap<string>;

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

export interface ExternalPracticeEvent extends BaseEvent {
  title: string;
  location: string;
  mapUrl?: string;
  timeRange?: string;
  targetClasses: KarutaClass[];
}

export interface ClubPracticeEvent extends BaseEvent {
  location: PracticeLocation;
  practiceType: string;
  timeRange: string;
  personInCharge: string;
}

export interface InternalDeadlineEvent extends BaseEvent {
  title: string;
  targetClasses: KarutaClass[];
  isExternalPractice: boolean
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
