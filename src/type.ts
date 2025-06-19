export interface PracticeLocation {
  clubName: string;
  mapUrl: string;
  buildingName: string;
  shortenBuildingName: string;
}
export type PracticeLocations = Record<string, PracticeLocation>;

export interface Group { events: string[]; url: string }
export type Groups = Record<string, Group>;

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

// Utility Generic for mapping KarutaClass to any type
export type ByKarutaClass<T> = {
  [K in KarutaClass]: T;
};

// Chouseisan URLs and CSVs
export type ChouseisanUrls = ByKarutaClass<string>;
export type ChouseisanCsvs = ByKarutaClass<string>;

export type GroupedEvents = ByKarutaClass<{
  events: string[];
  url: string;
}>;



// Practice Location Definition
// export interface PracticeLocation {
//   buildingName: string;
//   shortenBuildingName: ShortBuildingName;
//   mapUrl: string;
//   clubName: string;
//   closestStation: string;
// }

// export enum ShortBuildingName {
//   Jinja= "神社",
//   Tokiwa= "常盤",
//   Kitaurawa= "北浦和",
//   Nakacho= "仲町",
//   Kamiochiai= "上落合",
//   Shimoochiai= "下落合",
//   Nakamoto= "仲本",
//   Motobuto= "本太",
//   Bessho= "別所",
//   Tajima= "田島",
//   Sashiougi= "指扇",
// }
// export type BuildingKey = keyof typeof ShortBuildingName;

// export type PracticeLocations<Keys extends string> = {
//   [K in Keys]: PracticeLocation;
// };

// Calendar Event Base Type
export interface CalendarEvent {
  date: Date;
  targetClasses: KarutaClass[] | string;
}

// Match Event
export interface MatchCalendarEvent extends CalendarEvent {
  title: string;
  location: string;
  mapUrl?: string;
}

// Outer Practice Event
export interface OuterPracticeCalendarEvent extends CalendarEvent {
  title: string;
  location: string;
  mapUrl?: string;
  timeRange?: string;
}

// Team Practice Event
export interface TeamPracticeCalendarEvent extends CalendarEvent {
  location: PracticeLocation;
  practiceType: string;
  timeRange: string;
  personInCharge: string;
}

// Participant Status
export interface ParticipantStatus {
  attending: string[];
  notAttending: string[];
  undecided: string[];
}

// Chouseisan Event
export interface ChouseisanEvent {
  title: string;
  eventDate: Date;
  deadline: Date;
  participants: ParticipantStatus;
}

// Mention and Substitution Map
export interface Mention {
  type: string;
  mentionee: object;
}

export type SubstitutionMap = {
  [key: string]: Mention;
};

export interface UrlPair {
  original: string;
  preview: string;
}
