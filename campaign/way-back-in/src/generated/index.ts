// Cue and viseme data written by tools/voiceover.py and tools/visemes.py. Do not edit the JSON by hand.
import c1 from './film1-commit-history.cues.json';
import c2 from './film2-return-date.cues.json';
import c3 from './film3-parsed.cues.json';
import c1s from './film1-commit-history-short.cues.json';
import c2s from './film2-return-date-short.cues.json';
import c3s from './film3-parsed-short.cues.json';
import v1 from './film1-commit-history.visemes.json';
import v2 from './film2-return-date.visemes.json';
import v3 from './film3-parsed.visemes.json';
import v1s from './film1-commit-history-short.visemes.json';
import v2s from './film2-return-date-short.visemes.json';
import v3s from './film3-parsed-short.visemes.json';

export type Cue = {start: number; end: number; speechStart: number; speechEnd: number; text: string; lines: string[]};
export type Viseme = [number, number, number];

export const CUES: Record<string, Cue[]> = {
  'film1-commit-history': c1, 'film2-return-date': c2, 'film3-parsed': c3,
  'film1-commit-history-short': c1s, 'film2-return-date-short': c2s, 'film3-parsed-short': c3s,
};

export const VISEMES: Record<string, Viseme[]> = {
  'film1-commit-history': v1 as Viseme[], 'film2-return-date': v2 as Viseme[], 'film3-parsed': v3 as Viseme[],
  'film1-commit-history-short': v1s as Viseme[], 'film2-return-date-short': v2s as Viseme[], 'film3-parsed-short': v3s as Viseme[],
};
