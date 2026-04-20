export interface LifePathEntry {
  title: string;
  keywords: string;
  description: string;
  purpose: string;
  love: string;
  career: string;
  light: string[];
  shadow_list: string[];
  famous: string[];
}

export interface LifePathBreakdown {
  y: number;
  m: number;
  d: number;
  rawY: string;
  rawM: string;
  rawD: string;
  ySum: number;
  mSum: number;
  dSum: number;
}

export interface LifePathData {
  number: number;
  compound: number;
  breakdown: LifePathBreakdown;
}

export interface MbtiEntry {
  title: string;
  archetype: string;
  drive: string;
  stack: string[];
  desc: string;
  strengths: string[];
  strength_tip: string;
  shadows: string[];
  growth: string;
  famous: string[];
}

export type MbtiDimension = 'ie' | 'sn' | 'tf' | 'jp';
