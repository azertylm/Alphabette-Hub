export type PassportFontSize = 'normal' | 'lg' | 'xl' | 'xxl';
export type PassportTheme =
  | 'light'
  | 'sepia'
  | 'onyx'
  | 'high-contrast'
  | 'high-contrast-light';
export type PassportFontFamily = 'standard' | 'dyslexic' | 'serif' | 'mono';
export type PassportAccentColor = 'blue' | 'emerald' | 'violet' | 'amber';
export type PassportLineHeight = 'compact' | 'normal' | 'relaxed' | 'double';
export type PassportLetterSpacing = 'normal' | 'wide' | 'extra';
export type PassportReadingWidth = 'narrow' | 'normal' | 'wide';
export type PassportButtonSize = 'normal' | 'large' | 'xl';
export type PassportFocusStyle = 'standard' | 'strong';
export type PassportColorBlindFilter =
  | 'none'
  | 'protanopia'
  | 'deuteranopia'
  | 'tritanopia'
  | 'grayscale';
export type PassportWarmth = 0 | 1 | 2;
export type SpeechRate = 0.65 | 0.8 | 1 | 1.25 | 1.5;
export type SpeechPitch = 0.8 | 1 | 1.2;

export type HubTabId = 'passport' | 'ideas' | 'apps';
export type AiEngineMode = 'local' | 'gemini';
export type AppCategory = 'Toutes' | 'Quotidien' | 'Culture' | 'Entraide' | 'Fun';
export type PassportPresetId = 'standard' | 'senior' | 'dys' | 'calm';
export type PassportSectionFilter = 'all' | 'vision' | 'text' | 'motor' | 'voice';

export interface PassportSettings {
  version: number;
  // Vision & Couleurs
  theme: PassportTheme;
  accentColor: PassportAccentColor;
  colorBlindFilter: PassportColorBlindFilter;
  warmth: PassportWarmth;
  // Texte & Lecture
  fontSize: PassportFontSize;
  fontFamily: PassportFontFamily;
  lineHeight: PassportLineHeight;
  letterSpacing: PassportLetterSpacing;
  readingWidth: PassportReadingWidth;
  underlineLinks: boolean;
  readingGuide: boolean;
  // Motricité & Confort sensoriel
  buttonSize: PassportButtonSize;
  focusStyle: PassportFocusStyle;
  reducedMotion: boolean;
  largeCursor: boolean;
  confirmActions: boolean;
  // Voix & Audio
  speechRate: SpeechRate;
  speechPitch: SpeechPitch;
  voiceName: string;
  autoRead: boolean;
  speakToasts: boolean;
}

export interface PassportPreset {
  id: PassportPresetId;
  label: string;
  description: string;
  settings: Partial<PassportSettings>;
}

export interface ProductIdea {
  id: string;
  name: string;
  problem: string;
  target: string;
  features: string[];
  votes: number;
  createdAt: number;
}

export interface ProductSheetDraft {
  name: string;
  problem: string;
  target: string;
  features: string[];
}

export interface EcosystemApp {
  id: string;
  name: string;
  category: Exclude<AppCategory, 'Toutes'>;
  url: string;
  description: string;
  shortDesc: string;
  isNew?: boolean;
  iconKey: 'lock' | 'message' | 'users' | 'smile' | 'file' | 'heart' | 'book';
}

export interface ToastItem {
  id: string;
  message: string;
  type: 'info' | 'success' | 'error';
}
