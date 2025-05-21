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
  day: number;
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