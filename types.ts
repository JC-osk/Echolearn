export interface Segment {
  id: number;
  start: number; // Start time in seconds
  end: number;   // End time in seconds
  text: string;  // Original language text
  translation: string; // Chinese translation
}

export interface SegmentState extends Segment {
  userInput: string; // For dictation mode
}

export type AppView = 'dashboard' | 'practice' | 'flashcards';
export type PracticeMode = 'shadowing' | 'dictation';

export type PlaybackSpeed = 0.8 | 1.0 | 1.2 | 1.5;

export interface AudioSession {
  id: string;
  fileName: string;
  createdAt: number;
  segments: SegmentState[];
  audioUrl: string; // Blob URL
  language: string;
}

export interface AnalysisResult {
  segments: Segment[];
  language: string;
}

export interface FlashCard {
  id: string;
  word: string;         // The selected word/phrase
  context: string;      // The original sentence from audio
  definition_cn: string; // Chinese definition
  ipa: string;          // Phonetic symbol
  example_original: string; // Same as context (original sentence)
  example_cn: string;   // Translation of the context (from audio)
}
