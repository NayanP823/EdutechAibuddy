
export enum Sender {
  User = 'user',
  Bot = 'model'
}

export interface Message {
  id: string;
  role: Sender;
  text: string;
  timestamp: number;
  isThinking?: boolean;
  audioPlaying?: boolean;
  isAudioLoading?: boolean;
}

export enum AgeGroup {
  Elementary = 'Elementary (Age 6-10)',
  MiddleSchool = 'Middle School (Age 11-14)',
  HighSchool = 'High School (Age 15-18)',
  Adult = 'Adult / General'
}

export enum UserLanguage {
  English = 'English',
  Spanish = 'Spanish',
  Hindi = 'Hindi',
  French = 'French',
  Hinglish = 'Hinglish (Hindi-English Mix)'
}

export interface UserPreferences {
  ageGroup: AgeGroup;
  language: UserLanguage;
  subjectInterest?: string;
  autoRead: boolean;
}

export interface ChartData {
  name: string;
  value: number;
}
