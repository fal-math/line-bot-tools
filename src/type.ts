export interface KarutaClasses {
  A: string;
  B: string;
  C: string;
  D: string;
  E: string;
  F: string;
  G: string;
}


export interface PracticeLocation {
  name: string;
  map_url: string;
  location: string;
}
export type PracticeLocations = Record<string, PracticeLocation>;

export interface UrlPair {
  original: string;
  preview: string;
}

interface EventInfo {
  month: number;
  day: string;
  date:number
}

export interface TeamPracticeInfo extends EventInfo {
  place: string;
  timeRange: string;
  targetClass: string;
}

export interface MatchInfo extends EventInfo {
  title: string;
}

export interface Participants {
  attending: string[];
  notAttending: string[];
  undecided: string[];
}
export interface EventStatus {
  eventTitle: string;
  date: string;
  deadline: string;
  participants: Participants;
}

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

// // Practice Location Definition
// export interface PracticeLocation {
//   location: string;
//   shortenLocation: string;
//   mapUrl: string;
//   clubName: string;
//   closestStation: string;
// }

// export type PracticeLocations<Keys extends string> = {
//   [K in Keys]: PracticeLocation;
// };

// Calendar Event Base Type
export interface CalenderEvent {
  date: Date;
  class: KarutaClass[];
}

// Match Event
export interface MatchEvent extends CalenderEvent {
  title: string;
  location: string;
  mapUrl: string;
}

// Outer Practice Event
export interface OuterPracticeEvent extends CalenderEvent {
  title: string;
  location: string;
  mapUrl: string;
}

// Team Practice Event
export interface TeamPracticeEvent extends CalenderEvent {
  location: PracticeLocation;
  place: string;
  timeRange: string;
  type:string;
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
